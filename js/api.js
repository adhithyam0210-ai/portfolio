/**
 * Unified REST API & Local Storage Client
 * Dual Mode: Uses Node.js REST API when running on HTTP server;
 * gracefully falls back to localStorage when opened via file:///.
 */

const PortfolioAPI = (() => {
  const STORAGE_KEY = 'adhit_portfolio_data';
  const isHttp = window.location.protocol.startsWith('http');
  const API_BASE = isHttp ? window.location.origin + '/api' : 'http://localhost:5000/api';

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
    isServerActive: isHttp,

    async getPortfolio() {
      if (isHttp) {
        try {
          const res = await fetch(`${API_BASE}/portfolio`);
          if (res.ok) {
            const data = await res.json();
            setLocalData(data); // keep local mirror updated
            return data;
          }
        } catch (err) {
          console.warn('REST API unavailable, falling back to local storage:', err);
        }
      }
      return getLocalData();
    },

    async savePortfolio(data) {
      setLocalData(data);
      if (isHttp) {
        try {
          const res = await fetch(`${API_BASE}/portfolio`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn('REST API save failed, stored locally:', err);
        }
      }
      return { success: true, data };
    },

    async createProject(project) {
      const data = await this.getPortfolio();
      data.projects = data.projects || [];
      const newProj = {
        ...project,
        id: project.id || 'proj-' + Date.now()
      };
      data.projects.unshift(newProj);
      setLocalData(data);

      if (isHttp) {
        try {
          const res = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProj)
          });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn('REST API project creation failed, stored locally:', err);
        }
      }
      return { success: true, project: newProj };
    },

    async updateProject(id, projectData) {
      const data = await this.getPortfolio();
      data.projects = data.projects || [];
      const idx = data.projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        data.projects[idx] = { ...data.projects[idx], ...projectData, id };
        setLocalData(data);
      }

      if (isHttp) {
        try {
          const res = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
          });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn('REST API project update failed, stored locally:', err);
        }
      }
      return { success: true };
    },

    async deleteProject(id) {
      const data = await this.getPortfolio();
      data.projects = (data.projects || []).filter(p => p.id !== id);
      setLocalData(data);

      if (isHttp) {
        try {
          const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn('REST API project deletion failed, deleted locally:', err);
        }
      }
      return { success: true };
    },

    async updateProfile(profile) {
      const data = await this.getPortfolio();
      data.profile = { ...(data.profile || {}), ...profile };
      setLocalData(data);

      if (isHttp) {
        try {
          const res = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
          });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn('REST API profile update failed, stored locally:', err);
        }
      }
      return { success: true, profile: data.profile };
    },

    async updateSkills(skills) {
      const data = await this.getPortfolio();
      data.skills = skills;
      setLocalData(data);

      if (isHttp) {
        try {
          const res = await fetch(`${API_BASE}/skills`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skills)
          });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn('REST API skills update failed, stored locally:', err);
        }
      }
      return { success: true, skills };
    },

    async updateExperience(experience) {
      const data = await this.getPortfolio();
      data.experience = experience;
      setLocalData(data);

      if (isHttp) {
        try {
          const res = await fetch(`${API_BASE}/experience`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(experience)
          });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn('REST API experience update failed, stored locally:', err);
        }
      }
      return { success: true, experience };
    },

    async updateEducation(education) {
      const data = await this.getPortfolio();
      data.education = education;
      setLocalData(data);

      if (isHttp) {
        try {
          const res = await fetch(`${API_BASE}/education`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(education)
          });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn('REST API education update failed, stored locally:', err);
        }
      }
      return { success: true, education };
    },

    async sendContact(messageData) {
      if (isHttp) {
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
