/**
 * Unified REST API, GitHub Cloud Sync & Local Storage Client
 * 
 * Multi-Mode Data Architecture:
 * 1. GitHub API Cloud Publisher: When running on Vercel or any live host,
 *    commits updates directly to GitHub, triggering instant Vercel redeployment.
 * 2. Local Node/Python Server: When running on localhost:5000, writes to local disk.
 * 3. Static/Offline Fallback: Loads data/portfolio.json or localStorage with zero latency.
 */

// UTF-8 Safe Base64 Helpers
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const GitHubSync = (() => {
  const TOKEN_KEY = 'gh_portfolio_token';
  const REPO_KEY = 'gh_portfolio_repo';
  const BRANCH_KEY = 'gh_portfolio_branch';

  const DEFAULT_REPO = 'adhithyam0210-ai/portfolio';
  const DEFAULT_BRANCH = 'main';

  function getToken() {
    return (localStorage.getItem(TOKEN_KEY) || '').trim();
  }

  function setToken(token) {
    if (token && token.trim()) {
      localStorage.setItem(TOKEN_KEY, token.trim());
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  function getRepo() {
    return (localStorage.getItem(REPO_KEY) || DEFAULT_REPO).trim();
  }

  function setRepo(repo) {
    if (repo && repo.trim()) {
      localStorage.setItem(REPO_KEY, repo.trim());
    }
  }

  function getBranch() {
    return (localStorage.getItem(BRANCH_KEY) || DEFAULT_BRANCH).trim();
  }

  function setBranch(branch) {
    if (branch && branch.trim()) {
      localStorage.setItem(BRANCH_KEY, branch.trim());
    }
  }

  function hasToken() {
    return Boolean(getToken());
  }

  async function testConnection(token = getToken(), repo = getRepo()) {
    if (!token) throw new Error('Please provide a GitHub Personal Access Token.');
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}: Unable to connect to repository ${repo}`);
    }

    const data = await res.json();
    return {
      success: true,
      repoName: data.full_name,
      description: data.description,
      permissions: data.permissions
    };
  }

  async function commitFile(path, contentStr, message) {
    const token = getToken();
    if (!token) throw new Error('GitHub token not configured.');
    const repo = getRepo();
    const branch = getBranch();

    // 1. Fetch current file SHA if it exists
    let sha = null;
    try {
      const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}&_=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        sha = fileInfo.sha;
      }
    } catch (e) {
      console.warn(`Could not fetch SHA for ${path}:`, e);
    }

    // 2. Commit updated file
    const payload = {
      message: message || `Update ${path} via Portfolio Admin Portal`,
      content: utf8ToBase64(contentStr),
      branch: branch
    };
    if (sha) payload.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(err.message || `Failed to commit ${path} to GitHub (HTTP ${putRes.status})`);
    }

    return await putRes.json();
  }

  async function publishPortfolio(data, message = 'Update portfolio content via Admin Portal') {
    const jsonStr = JSON.stringify(data, null, 2);
    // Commit primary database file
    const result = await commitFile('data/portfolio.json', jsonStr, message);

    // Also update js/config.js so static fallback is always in sync
    try {
      const configStr = `/**\n * Portfolio Configuration Data (Zero Emojis)\n * Fallback static data matching data/portfolio.json\n */\n\nconst PORTFOLIO_DATA = ${jsonStr};\n`;
      await commitFile('js/config.js', configStr, `Sync config.js with portfolio data`);
    } catch (e) {
      console.warn('Could not sync js/config.js to GitHub:', e);
    }

    return result;
  }

  return {
    getToken,
    setToken,
    getRepo,
    setRepo,
    getBranch,
    setBranch,
    hasToken,
    testConnection,
    commitFile,
    publishPortfolio
  };
})();

const PortfolioAPI = (() => {
  const STORAGE_KEY = 'adhit_portfolio_data';
  const isHttp = window.location.protocol.startsWith('http');
  const isLocalhost = isHttp && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const API_BASE = isLocalhost ? window.location.origin + '/api' : 'http://localhost:5000/api';

  function getLocalData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing local portfolio data:', e);
      }
    }
    if (typeof PORTFOLIO_DATA !== 'undefined') {
      return JSON.parse(JSON.stringify(PORTFOLIO_DATA));
    }
    return { profile: {}, categories: [], projects: [], skills: {}, experience: [] };
  }

  function setLocalData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  return {
    isServerActive: isLocalhost,

    async getPortfolio() {
      if (isHttp) {
        // 1. If running on local Node/Python server, fetch from local REST API
        if (isLocalhost) {
          try {
            const res = await fetch(`${API_BASE}/portfolio`, { cache: 'no-cache' });
            if (res.ok) {
              const data = await res.json();
              setLocalData(data);
              return data;
            }
          } catch (err) {
            // Local server might be stopped, fall through
          }
        }

        // 2. When deployed on Vercel, fetch static /data/portfolio.json with cache-buster
        try {
          const fetchUrl = window.location.origin + '/data/portfolio.json?t=' + Date.now();
          const staticRes = await fetch(fetchUrl, { cache: 'no-cache' });
          if (staticRes.ok) {
            const data = await staticRes.json();
            setLocalData(data);
            return data;
          }
        } catch (err) {
          console.warn('Could not load data/portfolio.json:', err);
        }
      }

      // 3. Fallback to localStorage or bundled config.js
      return getLocalData();
    },

    async savePortfolio(data, message = 'Update portfolio via Admin Portal') {
      setLocalData(data);

      let ghResult = null;
      let ghError = null;

      // 1. If GitHub token is configured, commit directly to GitHub repository (triggers Vercel redeployment)
      if (GitHubSync.hasToken()) {
        try {
          ghResult = await GitHubSync.publishPortfolio(data, message);
        } catch (err) {
          console.error('GitHub Cloud Sync failed:', err);
          ghError = err.message;
        }
      }

      // 2. If running locally with Node.js/Python server, also update local file system
      if (isLocalhost) {
        try {
          const res = await fetch(`${API_BASE}/portfolio`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (res.ok) {
            const resData = await res.json();
            return {
              ...resData,
              publishedToGitHub: Boolean(ghResult),
              ghError,
              commit: ghResult?.commit
            };
          }
        } catch (err) {
          console.warn('Local REST API save failed:', err);
        }
      }

      return {
        success: true,
        data,
        publishedToGitHub: Boolean(ghResult),
        ghError,
        commit: ghResult?.commit
      };
    },

    async createProject(project) {
      const data = await this.getPortfolio();
      data.projects = data.projects || [];
      const newProj = {
        ...project,
        id: project.id || 'proj-' + Date.now()
      };
      data.projects.unshift(newProj);
      const res = await this.savePortfolio(data, `Add project: ${project.title || 'New Project'}`);
      return { ...res, project: newProj };
    },

    async updateProject(id, projectData) {
      const data = await this.getPortfolio();
      data.projects = data.projects || [];
      const idx = data.projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        data.projects[idx] = { ...data.projects[idx], ...projectData, id };
      }
      return await this.savePortfolio(data, `Update project: ${projectData.title || id}`);
    },

    async deleteProject(id) {
      const data = await this.getPortfolio();
      const removed = (data.projects || []).find(p => p.id === id);
      data.projects = (data.projects || []).filter(p => p.id !== id);
      return await this.savePortfolio(data, `Delete project: ${removed?.title || id}`);
    },

    async updateProfile(profile) {
      const data = await this.getPortfolio();
      data.profile = { ...(data.profile || {}), ...profile };
      const res = await this.savePortfolio(data, 'Update profile information');
      return { ...res, profile: data.profile };
    },

    async updateSkills(skills) {
      const data = await this.getPortfolio();
      data.skills = skills;
      const res = await this.savePortfolio(data, 'Update technical skills');
      return { ...res, skills };
    },

    async updateExperience(experience) {
      const data = await this.getPortfolio();
      data.experience = experience;
      const res = await this.savePortfolio(data, 'Update experience milestones');
      return { ...res, experience };
    },

    async updateEducation(education) {
      const data = await this.getPortfolio();
      data.education = education;
      const res = await this.savePortfolio(data, 'Update education details');
      return { ...res, education };
    },

    async sendContact(messageData) {
      if (isLocalhost) {
        try {
          const res = await fetch(`${API_BASE}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData)
          });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn('REST API contact post failed:', err);
        }
      }
      return { success: true, message: 'Received locally' };
    }
  };
})();
