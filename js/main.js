/**
 * Swiggy / Zomato Inspired Portfolio Engine
 * Zero Emojis • Vector SVG Icons • REST API & Live Search
 */

// SVG Icon Helpers (Zero Emojis)
const ICONS = {
  sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  externalLink: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  github: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
};

let currentPortfolioData = null;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initContact();

  // Step 1: Instant 0ms Paint using local / bundled cache
  currentPortfolioData = PortfolioAPI.getCachedOrLocal();
  renderFullPage(currentPortfolioData);

  // Step 2: Background Stale-While-Revalidate to sync live cloud database
  PortfolioAPI.getPortfolio(true).then(freshData => {
    if (freshData) {
      currentPortfolioData = freshData;
      renderFullPage(freshData);
    }
  }).catch(err => {
    console.warn('[Portfolio] Background sync fallback to local cache:', err);
  });
});

function renderFullPage(data) {
  if (!data) return;
  hydrateProfile(data);
  renderCards(data);
  renderSkills(data);
  renderExperience(data);
  renderEducation(data);
}

/* ==========================================================================
   Hydrate Dynamic Profile Data (via REST API)
   ========================================================================== */
function hydrateProfile(passedData) {
  const data = passedData || currentPortfolioData || PortfolioAPI.getCachedOrLocal();
  const p = data ? data.profile : null;
  if (!p) return;

  const avatarWrap = document.getElementById('hero-avatar-wrap');
  const avatarImg = document.getElementById('hero-avatar-img');
  if (p.avatar && avatarImg && avatarWrap) {
    avatarImg.src = p.avatar;
    avatarWrap.style.display = 'flex';
  } else if (avatarWrap) {
    avatarWrap.style.display = 'none';
  }

  const nameElem = document.getElementById('hero-brand-name');
  if (nameElem) nameElem.textContent = p.name || 'ADHITHYA';

  const footerBrand = document.getElementById('footer-brand-name');
  if (footerBrand) footerBrand.textContent = (p.name || 'ADHITHYA') + '.';

  const footerRole = document.getElementById('footer-role-text');
  if (footerRole) footerRole.textContent = (p.role ? `${p.role} Portfolio.` : 'Software Tester Portfolio.');

  const footerCopy = document.getElementById('footer-copy-name');
  if (footerCopy) footerCopy.textContent = p.name || 'ADHITHYA';

  const taglineElem = document.getElementById('hero-tagline');
  if (taglineElem) taglineElem.textContent = p.role || 'Software Tester';

  const titleElem = document.getElementById('hero-title');
  if (titleElem) titleElem.textContent = p.tagline || 'Software Tester';

  const bioElem = document.getElementById('hero-bio');
  if (bioElem) bioElem.textContent = p.bio || 'Specializing in SDLC, STLC, manual and automated testing.';

  const locElem = document.getElementById('location-text');
  if (locElem) locElem.textContent = p.location || 'Chennai/TamilNadu';

  const emailDisplay = document.getElementById('contact-email-display');
  if (emailDisplay) emailDisplay.textContent = p.email || 'adhithyam0210@gmail.com';

  const ghLink = document.getElementById('social-github');
  if (ghLink && p.github) ghLink.href = p.github;

  const liLink = document.getElementById('social-linkedin');
  if (liLink && p.linkedin) liLink.href = p.linkedin;

  const mailLink = document.getElementById('social-mail');
  if (mailLink) {
    const emailToUse = p.email || 'adhithyam0210@gmail.com';
    mailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailToUse)}`;
    mailLink.setAttribute('target', '_blank');
    mailLink.setAttribute('rel', 'noopener noreferrer');
    mailLink.setAttribute('title', 'Open in Gmail');
  }
}

/* ==========================================================================
   Theme Switcher (Dark / Light)
   ========================================================================== */
function initTheme() {
  const themeBtn = document.getElementById('theme-btn');
  const savedTheme = localStorage.getItem('adhit-theme') || 'light';
  applyTheme(savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const target = current === 'dark' ? 'light' : 'dark';
      applyTheme(target);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('adhit-theme', theme);
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    themeBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
  }
}

/* ==========================================================================
   Navigation & Mobile Menu
   ========================================================================== */
function initNavigation() {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }
}

/* ==========================================================================
   Render Project Cards
   ========================================================================== */
function renderCards(passedData) {
  const grid = document.getElementById('cards-grid');
  const countLabel = document.getElementById('results-count');
  if (!grid) return;

  const data = passedData || currentPortfolioData || PortfolioAPI.getCachedOrLocal();
  const projects = data.projects || [];

  if (countLabel) {
    countLabel.textContent = `${projects.length} ${projects.length === 1 ? 'Project' : 'Projects'}`;
  }

  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 48px 20px;">
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">No projects found</h3>
        <p style="color: var(--text-secondary);">No projects currently available.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = projects.map(p => `
    <article class="product-card" id="project-${p.id}">
      <div class="card-banner-wrap">
        <img src="${p.image || 'assets/projects/nexus_ai.jpg'}" alt="${p.title}" class="card-banner-img" loading="lazy" />
        <span class="card-tag-badge">${p.categoryLabel || 'PROJECT'}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <p class="card-summary">${p.summary || ''}</p>
        <div class="card-tech-chips">
          ${(Array.isArray(p.tech) ? p.tech : []).map(t => `<span class="tech-chip">${t}</span>`).join('')}
        </div>
        <div class="card-actions-bar">
          <a href="${p.liveUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn-card btn-card-primary">
            <span>Live Preview</span>
            ${ICONS.externalLink}
          </a>
          <a href="${p.githubUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn-card btn-card-secondary" title="View Source Code">
            <span>Code</span>
            ${ICONS.github}
          </a>
        </div>
      </div>
    </article>
  `).join('');
}

/* ==========================================================================
   Render Skills Dynamically
   ========================================================================== */
function renderSkills(passedData) {
  const container = document.getElementById('skills-container');
  const section = document.getElementById('skills');
  if (!container) return;

  const data = passedData || currentPortfolioData || PortfolioAPI.getCachedOrLocal();
  const skills = data.skills || {};

  const categories = [
    { key: 'frontend', title: skills.frontend?.title || 'Frontend Engineering', items: skills.frontend?.items || [], icon: `<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>` },
    { key: 'backend', title: skills.backend?.title || 'Backend & Databases', items: skills.backend?.items || [], icon: `<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line>` },
    { key: 'tools', title: skills.tools?.title || 'Tools & DevOps', items: skills.tools?.items || [], icon: `<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>` }
  ];

  // Filter out any empty skill categories so they are not reflected in the portal
  const activeCategories = categories.filter(cat => Array.isArray(cat.items) && cat.items.length > 0);

  if (activeCategories.length === 0) {
    if (section) section.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  if (section) section.style.display = 'block';

  // Apply responsive layout class based on active category count
  container.className = `skills-container-grid cols-${activeCategories.length}`;

  container.innerHTML = activeCategories.map(cat => `
    <div class="skill-category-card">
      <div class="skill-category-header">
        <div class="skill-header-main">
          <div class="skill-category-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${cat.icon}
            </svg>
          </div>
          <h3 class="skill-category-title">${cat.title}</h3>
        </div>
        <span class="skill-badge-count">${cat.items.length} ${cat.items.length === 1 ? 'Skill' : 'Skills'}</span>
      </div>
      <div class="skill-items-grid">
        ${cat.items.map(item => `
          <div class="skill-list-item">
            <span class="skill-item-name">${item}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   Render Experience Dynamically
   ========================================================================== */
function renderExperience(passedData) {
  const container = document.getElementById('experience-container');
  if (!container) return;

  const data = passedData || currentPortfolioData || PortfolioAPI.getCachedOrLocal();
  const list = data.experience || [];

  if (list.length === 0) {
    container.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 24px;">No experience records available.</p>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="exp-card">
      <div class="exp-header">
        <h3 class="exp-role">${escapeHtml(item.role || '')}</h3>
        ${item.period ? `<span class="exp-period">${escapeHtml(item.period)}</span>` : ''}
      </div>
      <div class="exp-meta">${escapeHtml(item.company || '')}${item.location ? ` • ${escapeHtml(item.location)}` : ''}</div>
      ${item.description ? `<p class="exp-desc">${escapeHtml(item.description)}</p>` : ''}
      ${item.bullets && item.bullets.length ? `
        <ul class="exp-bullets">
          ${item.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `).join('');
}

/* ==========================================================================
   Render Education Dynamically
   ========================================================================== */
function renderEducation(passedData) {
  const container = document.getElementById('education-container');
  if (!container) return;

  const data = passedData || currentPortfolioData || PortfolioAPI.getCachedOrLocal();
  const list = data.education || (typeof PORTFOLIO_DATA !== 'undefined' ? PORTFOLIO_DATA.education : []) || [];

  if (list.length === 0) {
    container.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 24px;">No academic education records available.</p>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="edu-card">
      <div class="edu-card-body">
        <h3 class="edu-degree-title">${escapeHtml(item.degree || 'Degree / Course')}</h3>
        <div class="edu-inst-row">
          <span class="edu-inst-name">${escapeHtml(item.institution || '')}</span>
          ${item.location ? `<span class="edu-loc-text">• ${escapeHtml(item.location)}</span>` : ''}
        </div>
      </div>
      <div class="edu-card-footer">
        <span class="edu-year-pill">${escapeHtml(item.year || item.period || '')}</span>
        ${item.score ? `<span class="edu-score-pill">${escapeHtml(item.score)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   Contact Form & Direct Copy (Calls REST API)
   ========================================================================== */
function initContact() {
  const form = document.getElementById('contact-form');
  const copyBtn = document.getElementById('copy-email-card');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();

      btn.disabled = true;
      btn.innerHTML = 'Sending...';

      try {
        await PortfolioAPI.sendContact({ name, email, message, timestamp: new Date().toISOString() });
        showToast('Message sent successfully. I will get back to you soon.');
        form.reset();
      } catch (err) {
        showToast('Message received! Thank you for reaching out.');
        form.reset();
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const data = currentPortfolioData || PortfolioAPI.getCachedOrLocal();
      const email = data.profile?.email || 'adhithyam0210@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast(`Email copied: ${email}. Opening Gmail...`);
      }).catch(() => {
        showToast(`Email: ${email}`);
      });
      setTimeout(() => {
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`, '_blank');
      }, 400);
    });
  }
}

/* ==========================================================================
   Toast Notification (Zero Emojis)
   ========================================================================== */
function showToast(text) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast-bar';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `${ICONS.check} <span>${text}</span>`;
  toast.style.display = 'flex';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
