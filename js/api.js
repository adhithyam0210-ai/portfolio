/**
 * Unified Database, REST API & Local Storage Client
 * 
 * Multi-Tier Dynamic Data Architecture:
 * 1. Cloud Database (Supabase PostgreSQL): Primary live data engine.
 *    Any edits in Admin Portal write directly to the database and reflect live
 *    for all visitors across the world with zero deployment delay.
 * 2. Local Node/Python Server: For local development on localhost:5000.
 * 3. Resilient Offline Cache: Fallback to cached data or config.js with zero crashes.
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

/* ==========================================================================
   Supabase PostgreSQL Cloud Database Manager
   ========================================================================== */
const DatabaseManager = (() => {
  const URL_KEY = 'sb_portfolio_url';
  const KEY_KEY = 'sb_portfolio_key';

  // Support pre-configured environment or window values if defined
  const DEFAULT_URL = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) || '';
  const DEFAULT_KEY = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.anonKey) || '';

  let clientInstance = null;

  function getUrl() {
    const fromStorage = localStorage.getItem(URL_KEY);
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
    return ((window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) || DEFAULT_URL).trim();
  }

  function setUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem(URL_KEY, url.trim());
    } else {
      localStorage.removeItem(URL_KEY);
    }
    clientInstance = null;
  }

  function getKey() {
    const fromStorage = localStorage.getItem(KEY_KEY);
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
    return ((window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.anonKey) || DEFAULT_KEY).trim();
  }

  function setKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(KEY_KEY, key.trim());
    } else {
      localStorage.removeItem(KEY_KEY);
    }
    clientInstance = null;
  }

  function isConnected() {
    return Boolean(getUrl() && getKey());
  }

  function getClient() {
    if (!isConnected()) return null;
    if (clientInstance) return clientInstance;

    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('[Database] Supabase client SDK not found. Make sure supabase-js script is loaded.');
      return null;
    }

    try {
      clientInstance = window.supabase.createClient(getUrl(), getKey());
      return clientInstance;
    } catch (err) {
      console.error('[Database] Failed to initialize Supabase client:', err);
      return null;
    }
  }

  async function testConnection(url = getUrl(), key = getKey()) {
    if (!url || !key) {
      throw new Error('Please enter both Supabase Project URL and Public Anon Key.');
    }
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      throw new Error('Supabase client SDK is not loaded. Please check your internet connection or script tags.');
    }

    const testClient = window.supabase.createClient(url.trim(), key.trim());
    const { data, error } = await testClient.from('portfolio').select('id, updated_at').limit(1);

    if (error) {
      if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        return {
          success: true,
          tableExists: false,
          message: 'Connected to Supabase! The "portfolio" table does not exist yet. Please run schema.sql in your Supabase SQL editor.'
        };
      }
      throw new Error(error.message || 'Unable to connect to Supabase project.');
    }

    return {
      success: true,
      tableExists: true,
      rowCount: data ? data.length : 0,
      message: 'Successfully connected to Supabase PostgreSQL database!'
    };
  }

  async function fetchPortfolio() {
    const client = getClient();
    if (!client) return null;

    try {
      const fetchPromise = client
        .from('portfolio')
        .select('*')
        .eq('id', 'main')
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase request timeout')), 2500)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        if (error.code === 'PGRST116') {
          // Record doesn't exist yet
          console.warn('[Database] Portfolio main record not found yet in database.');
          return null;
        }
        console.warn('[Database] fetchPortfolio error:', error.message);
        return null;
      }

      if (data) {
        return {
          profile: data.profile || {},
          categories: data.categories || [],
          projects: data.projects || [],
          skills: data.skills || {},
          experience: data.experience || [],
          education: data.education || []
        };
      }
    } catch (e) {
      console.warn('[Database] fetchPortfolio exception:', e.message || e);
    }
    return null;
  }

  async function savePortfolio(portfolioData) {
    const client = getClient();
    if (!client) throw new Error('Database is not configured.');

    const payload = {
      id: 'main',
      profile: portfolioData.profile || {},
      categories: portfolioData.categories || [],
      projects: portfolioData.projects || [],
      skills: portfolioData.skills || {},
      experience: portfolioData.experience || [],
      education: portfolioData.education || [],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('portfolio')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return { success: true, data };
  }

  async function seedDatabase(initialData) {
    return await savePortfolio(initialData);
  }

  async function fetchMessages() {
    const client = getClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Database] fetchMessages error:', error.message);
        return null;
      }
      return data || [];
    } catch (e) {
      console.error('[Database] fetchMessages exception:', e);
      return null;
    }
  }

  async function saveMessage(messageObj) {
    const client = getClient();
    if (!client) return { success: false, error: 'Database not connected' };

    try {
      const { data, error } = await client
        .from('messages')
        .insert([{
          name: messageObj.name,
          email: messageObj.email,
          message: messageObj.message,
          is_read: false
        }])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      console.error('[Database] saveMessage error:', e);
      return { success: false, error: e.message };
    }
  }

  async function deleteMessage(id) {
    const client = getClient();
    if (!client) return { success: false };

    try {
      const { error } = await client
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('[Database] deleteMessage error:', e);
      return { success: false, error: e.message };
    }
  }

  async function markMessageRead(id) {
    const client = getClient();
    if (!client) return { success: false };

    try {
      const { error } = await client
        .from('messages')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('[Database] markMessageRead error:', e);
      return { success: false, error: e.message };
    }
  }

  return {
    getUrl,
    setUrl,
    getKey,
    setKey,
    isConnected,
    getClient,
    testConnection,
    fetchPortfolio,
    savePortfolio,
    seedDatabase,
    fetchMessages,
    saveMessage,
    deleteMessage,
    markMessageRead
  };
})();

/* ==========================================================================
   Legacy GitHub Sync (Optional secondary backup)
   ========================================================================== */
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
    const result = await commitFile('data/portfolio.json', jsonStr, message);

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

/* ==========================================================================
   Unified Portfolio API (Database First + Local & Cache Fallbacks)
   ========================================================================== */
const PortfolioAPI = (() => {
  const STORAGE_KEY = 'adhit_portfolio_data';
  const MESSAGES_KEY = 'adhit_contact_messages';
  const isHttp = window.location.protocol.startsWith('http');
  const isLocalhost = isHttp && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const API_BASE = isLocalhost ? window.location.origin + '/api' : 'http://localhost:5000/api';

  let cachedPortfolio = null;
  let inflightPortfolioPromise = null;

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
    return { profile: {}, categories: [], projects: [], skills: {}, experience: [], education: [] };
  }

  function setLocalData(data) {
    cachedPortfolio = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  function getLocalMessages() {
    try {
      const saved = localStorage.getItem(MESSAGES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalMessage(msg) {
    const list = getLocalMessages();
    list.unshift({
      id: msg.id || 'msg-' + Date.now(),
      name: msg.name || 'Anonymous',
      email: msg.email || '',
      message: msg.message || '',
      created_at: msg.created_at || msg.timestamp || new Date().toISOString(),
      is_read: false
    });
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
  }

  return {
    isServerActive: isLocalhost,
    isDatabaseConnected: () => DatabaseManager.isConnected(),

    // Instant 0ms synchronous data retrieval for first-paint rendering
    getCachedOrLocal() {
      if (cachedPortfolio) return cachedPortfolio;
      cachedPortfolio = getLocalData();
      return cachedPortfolio;
    },

    async getPortfolio(forceRefresh = false) {
      if (!forceRefresh && cachedPortfolio) {
        return cachedPortfolio;
      }

      if (inflightPortfolioPromise) {
        return inflightPortfolioPromise;
      }

      inflightPortfolioPromise = (async () => {
        try {
          // 1. Primary: Cloud Database (Supabase PostgreSQL)
          if (DatabaseManager.isConnected()) {
            try {
              const dbData = await DatabaseManager.fetchPortfolio();
              if (dbData && dbData.profile && (dbData.profile.name || (dbData.projects && dbData.projects.length))) {
                setLocalData(dbData);
                return dbData;
              }
            } catch (dbErr) {
              console.warn('[PortfolioAPI] Database fetch error, checking fallbacks:', dbErr);
            }
          }

          if (isHttp) {
            // 2. Secondary: If running locally with Node/Python server, fetch from REST API
            if (isLocalhost) {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                const res = await fetch(`${API_BASE}/portfolio`, { cache: 'no-cache', signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) {
                  const data = await res.json();
                  setLocalData(data);
                  return data;
                }
              } catch (err) {
                // Local server not responding, continue
              }
            }

            // 3. Tertiary: Static JSON file from web server
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 2500);
              const fetchUrl = window.location.origin + '/data/portfolio.json?t=' + Date.now();
              const staticRes = await fetch(fetchUrl, { cache: 'no-cache', signal: controller.signal });
              clearTimeout(timeoutId);
              if (staticRes.ok) {
                const data = await staticRes.json();
                setLocalData(data);
                return data;
              }
            } catch (err) {
              console.warn('Could not load data/portfolio.json:', err);
            }
          }

          // 4. Fallback: Browser localStorage or bundled config.js
          const fallback = getLocalData();
          cachedPortfolio = fallback;
          return fallback;
        } finally {
          inflightPortfolioPromise = null;
        }
      })();

      return inflightPortfolioPromise;
    },

    async savePortfolio(data, message = 'Update portfolio via Admin Portal') {
      // 1. Update client cache immediately
      setLocalData(data);

      let dbResult = null;
      let dbError = null;

      // 2. Save directly to Cloud Database (Supabase PostgreSQL)
      if (DatabaseManager.isConnected()) {
        try {
          dbResult = await DatabaseManager.savePortfolio(data);
        } catch (err) {
          console.error('[PortfolioAPI] Database save failed:', err);
          dbError = err.message;
        }
      }

      // 3. If running locally with Node.js server, also write to local disk
      let localApiSuccess = false;
      if (isLocalhost) {
        try {
          const res = await fetch(`${API_BASE}/portfolio`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (res.ok) localApiSuccess = true;
        } catch (err) {
          console.warn('Local REST API save failed:', err);
        }
      }

      // 4. Optional GitHub commit backup
      let ghResult = null;
      let ghError = null;
      if (GitHubSync.hasToken()) {
        try {
          ghResult = await GitHubSync.publishPortfolio(data, message);
        } catch (err) {
          ghError = err.message;
        }
      }

      return {
        success: true,
        data,
        savedToDatabase: Boolean(dbResult),
        dbError,
        localApiSuccess,
        publishedToGitHub: Boolean(ghResult),
        ghError
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

    /* -------------------------------------------------------------
       Contact Messages / Inquiries (Database + Local Server)
       ------------------------------------------------------------- */
    async sendContact(messageData) {
      let savedToDb = false;
      let savedToServer = false;

      // 1. Save to Cloud Database
      if (DatabaseManager.isConnected()) {
        try {
          const dbRes = await DatabaseManager.saveMessage(messageData);
          if (dbRes && dbRes.success) {
            savedToDb = true;
          }
        } catch (e) {
          console.warn('Database sendContact failed:', e);
        }
      }

      // 2. Save to local server if active
      if (isLocalhost) {
        try {
          const res = await fetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData)
          });
          if (res.ok) {
            savedToServer = true;
          }
        } catch (err) {
          console.warn('REST API message post failed:', err);
        }
      }

      // 3. Fallback: Always record locally in browser storage
      saveLocalMessage(messageData);

      return {
        success: true,
        savedToDb,
        savedToServer,
        message: 'Message sent successfully. I will get back to you soon.'
      };
    },

    async getMessages() {
      // 1. From Cloud Database
      if (DatabaseManager.isConnected()) {
        const msgs = await DatabaseManager.fetchMessages();
        if (msgs !== null && Array.isArray(msgs)) return msgs;
      }

      // 2. From Local Server
      if (isLocalhost) {
        try {
          const res = await fetch(`${API_BASE}/messages`);
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list)) return list;
          }
        } catch (e) {
          // ignore
        }
      }

      // 3. From LocalStorage
      return getLocalMessages();
    },

    async deleteMessage(id) {
      if (DatabaseManager.isConnected()) {
        await DatabaseManager.deleteMessage(id);
      }

      if (isLocalhost) {
        try {
          await fetch(`${API_BASE}/messages/${id}`, { method: 'DELETE' });
        } catch (e) {
          // ignore
        }
      }

      // Local storage cleanup
      const list = getLocalMessages().filter(m => m.id !== id);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
      return { success: true };
    },

    async markMessageRead(id, isRead = true) {
      if (DatabaseManager.isConnected()) {
        await DatabaseManager.markMessageRead(id);
      }

      if (isLocalhost) {
        try {
          await fetch(`${API_BASE}/messages/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_read: isRead })
          });
        } catch (e) {
          // ignore
        }
      }

      const list = getLocalMessages().map(m => m.id === id ? { ...m, is_read: isRead } : m);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
      return { success: true };
    }
  };
})();
