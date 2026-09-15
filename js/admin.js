/**
 * Portfolio Admin Controller
 * Zero Emojis • Vector SVG Icons • REST API & File Explorer Image Picker
 */

const PIN_KEY = 'adhit_admin_pin';
const AUTH_KEY = 'adhit_admin_auth';

// SVG Icons
const ADMIN_ICONS = {
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let currentEditingProjectId = null;
let currentEditingExpIndex = null;
let currentEditingEduIndex = null;
let selectedImageData = null;
let profileAvatarData = null;
let resumeDocData = null;
let resumeDocFilename = null;

/* ==========================================================================
   Admin Form Validation Engine & Inline Feedback
   ========================================================================== */

function getOrCreateErrorEl(inputEl) {
  if (!inputEl) return null;
  const parent = inputEl.closest('.form-group') || inputEl.parentElement;
  if (!parent) return null;
  let errEl = parent.querySelector('.admin-inline-error');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.className = 'admin-inline-error';
    errEl.setAttribute('role', 'alert');
    const wrap = inputEl.closest('.password-input-wrap') || inputEl.closest('.file-picker-row') || inputEl;
    if (wrap.nextSibling) {
      wrap.parentNode.insertBefore(errEl, wrap.nextSibling);
    } else {
      wrap.parentNode.appendChild(errEl);
    }
  }
  return errEl;
}

function setAdminFieldError(inputEl, message) {
  if (!inputEl) return;
  inputEl.classList.add('input-error');
  inputEl.classList.remove('input-valid');
  inputEl.setAttribute('aria-invalid', 'true');
  const errEl = getOrCreateErrorEl(inputEl);
  if (errEl) {
    errEl.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${message}</span>
    `;
    errEl.classList.add('visible');
  }
}

function clearAdminFieldError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove('input-error');
  inputEl.removeAttribute('aria-invalid');
  if (inputEl.value && inputEl.value.trim().length > 0) {
    inputEl.classList.add('input-valid');
  } else {
    inputEl.classList.remove('input-valid');
  }
  const errEl = getOrCreateErrorEl(inputEl);
  if (errEl) {
    errEl.textContent = '';
    errEl.classList.remove('visible');
  }
}

/**
 * Standard Field Validators
 */
const AdminValidators = {
  name(val, isRequired = true) {
    const v = (val || '').trim();
    if (!v) return isRequired ? 'Full Name is required.' : null;
    if (v.length < 3) return `Name must be at least 3 characters (currently ${v.length}).`;
    if (v.length > 50) return `Name cannot exceed 50 characters (currently ${v.length}).`;
    if (/^\d+$/.test(v)) return 'Name cannot be entirely numbers.';
    if (!/^[a-zA-Z\s.'\-]+$/.test(v)) return 'Name can only contain letters, spaces, dots, and hyphens.';
    return null;
  },

  email(val, isRequired = true) {
    const v = (val || '').trim();
    if (!v) return isRequired ? 'Email address is required.' : null;
    if (/\s/.test(v)) return 'Email address cannot contain spaces.';
    const atCount = (v.match(/@/g) || []).length;
    if (atCount === 0) return "Email must contain an '@' symbol.";
    if (atCount > 1) return "Email can only contain one '@' symbol.";
    const [user, domain] = v.split('@');
    if (!user) return "Email must include a username before '@'.";
    if (user.startsWith('.') || user.endsWith('.')) return 'Username cannot begin or end with a dot.';
    if (user.includes('..')) return 'Username cannot contain consecutive dots (..).';
    if (!domain) return "Email must include a domain after '@' (e.g. gmail.com).";
    if (!domain.includes('.')) return 'Domain must include a dot and extension (e.g. .com, .org).';
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) return 'Domain extension must be at least 2 characters (e.g. .com).';
    if (!/^[a-zA-Z]+$/.test(tld)) return 'Domain extension must contain letters only.';
    const standardEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!standardEmailRegex.test(v)) return 'Please enter a valid standard email address (e.g. name@domain.com).';
    return null;
  },

  url(val, isRequired = false, domainMatch = null) {
    const v = (val || '').trim();
    if (!v) return isRequired ? 'URL is required.' : null;
    if (/\s/.test(v)) return 'URL cannot contain spaces.';
    if (!/^https?:\/\//i.test(v) && !/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(v)) {
      return 'Please enter a valid URL (e.g. https://example.com).';
    }
    if (domainMatch && !v.toLowerCase().includes(domainMatch.toLowerCase())) {
      return `URL must be a valid ${domainMatch} link.`;
    }
    return null;
  },

  text(val, fieldName, min = 1, max = 250, isRequired = true) {
    const v = (val || '').trim();
    if (!v) return isRequired ? `${fieldName} is required.` : null;
    if (v.length < min) return `${fieldName} must be at least ${min} character${min > 1 ? 's' : ''}.`;
    if (v.length > max) return `${fieldName} cannot exceed ${max} characters.`;
    return null;
  },

  yearOrPeriod(val, fieldName, isRequired = true) {
    const v = (val || '').trim();
    if (!v) return isRequired ? `${fieldName} is required.` : null;
    if (v.length < 4) return `${fieldName} must be at least 4 characters (e.g. 2026).`;
    if (!/\d{4}/.test(v)) return `${fieldName} must include a valid 4-digit year (e.g. 2026 or 2022 – 2026).`;
    return null;
  },

  score(val, isRequired = true) {
    const v = (val || '').trim();
    if (!v) return isRequired ? 'Score / CGPA is required.' : null;
    if (v.length < 2) return 'Score must be at least 2 characters (e.g. 7.4 CGPA or 85%).';
    if (!/\d/.test(v)) return 'Score must contain a numerical mark or CGPA.';
    return null;
  },

  password(val, isRequired = true) {
    const v = (val || '').trim();
    if (!v) return isRequired ? 'Password is required.' : null;
    if (v.length < 8) return `Password must be at least 8 characters (currently ${v.length}).`;
    if (!/[A-Z]/.test(v)) return 'Password must contain at least 1 uppercase letter (A-Z).';
    if (!/[0-9]/.test(v)) return 'Password must contain at least 1 number (0-9).';
    if (!/[^A-Za-z0-9]/.test(v)) return 'Password must contain at least 1 special character (e.g. !@#$%^&*).';
    return null;
  },

  supabaseUrl(val, isRequired = true) {
    const v = (val || '').trim();
    if (!v) return isRequired ? 'Supabase Project URL is required.' : null;
    if (/\s/.test(v)) return 'URL cannot contain spaces.';
    if (!/^https?:\/\//i.test(v)) return 'URL must begin with https:// or http://';
    if (!v.includes('.')) return 'URL must include a valid project domain.';
    return null;
  },

  repo(val, isRequired = true) {
    const v = (val || '').trim();
    if (!v) return isRequired ? 'Repository is required (e.g. username/repo).' : null;
    if (/\s/.test(v)) return 'Repository name cannot contain spaces.';
    if (!v.includes('/')) return 'Repository must follow the owner/repository format (e.g. adhit/portfolio).';
    const parts = v.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return 'Repository must follow the owner/repository format.';
    }
    return null;
  },

  branch(val, isRequired = true) {
    const v = (val || '').trim();
    if (!v) return isRequired ? 'Branch name is required (e.g. main).' : null;
    if (/\s/.test(v)) return 'Branch name cannot contain spaces.';
    return null;
  },

  token(val, fieldName = 'Access Token', min = 15, isRequired = true) {
    const v = (val || '').trim();
    if (!v) return isRequired ? `${fieldName} is required.` : null;
    if (/\s/.test(v)) return `${fieldName} cannot contain spaces.`;
    if (v.length < min) return `${fieldName} must be at least ${min} characters.`;
    return null;
  }
};

function initAdminValidation() {
  const fieldRules = [
    { id: 'prof-name', check: (v) => AdminValidators.name(v, true) },
    { id: 'prof-role', check: (v) => AdminValidators.text(v, 'Primary Role', 3, 70, true) },
    { id: 'prof-location', check: (v) => AdminValidators.text(v, 'Location', 2, 70, true) },
    { id: 'prof-email', check: (v) => AdminValidators.email(v, true) },
    { id: 'prof-tagline', check: (v) => AdminValidators.text(v, 'Headline', 3, 100, true) },
    { id: 'prof-bio', check: (v) => AdminValidators.text(v, 'Bio', 10, 600, true) },
    { id: 'prof-github', check: (v) => AdminValidators.url(v, false, 'github.com') },
    { id: 'prof-linkedin', check: (v) => AdminValidators.url(v, false, 'linkedin.com') },

    { id: 'project-title', check: (v) => AdminValidators.text(v, 'Project Title', 3, 80, true) },
    { id: 'project-summary', check: (v) => AdminValidators.text(v, 'Summary', 10, 600, true) },
    { id: 'project-tech', check: (v) => AdminValidators.text(v, 'Tech Stack', 2, 200, true) },
    { id: 'custom-category-input', check: (v) => {
      const cat = document.getElementById('project-category')?.value;
      if (cat === 'others') return AdminValidators.text(v, 'Custom Category Name', 2, 50, true);
      return null;
    }},
    { id: 'project-live', check: (v) => AdminValidators.url(v, false) },
    { id: 'project-github', check: (v) => AdminValidators.url(v, false, 'github.com') },

    { id: 'exp-role', check: (v) => AdminValidators.text(v, 'Role', 2, 70, true) },
    { id: 'exp-period', check: (v) => AdminValidators.text(v, 'Active Period', 3, 50, true) },
    { id: 'exp-company', check: (v) => AdminValidators.text(v, 'Company', 2, 70, true) },
    { id: 'exp-location', check: (v) => AdminValidators.text(v, 'Location', 2, 70, true) },
    { id: 'exp-desc', check: (v) => AdminValidators.text(v, 'Summary Description', 10, 600, true) },

    { id: 'edu-degree', check: (v) => AdminValidators.text(v, 'Degree Title', 2, 80, true) },
    { id: 'edu-institution', check: (v) => AdminValidators.text(v, 'Institution Name', 2, 90, true) },
    { id: 'edu-year', check: (v) => AdminValidators.yearOrPeriod(v, 'Year / Period', true) },
    { id: 'edu-score', check: (v) => AdminValidators.score(v, true) },

    { id: 'course-name', check: (v) => AdminValidators.text(v, 'Course Title', 2, 90, true) },
    { id: 'course-platform', check: (v) => AdminValidators.text(v, 'Platform / Institute', 2, 80, true) },
    { id: 'course-year', check: (v) => AdminValidators.yearOrPeriod(v, 'Completion Year', true) },
    { id: 'course-desc', check: (v) => AdminValidators.text(v, 'Course Description', 10, 500, true) },

    { id: 'current-pass-input', check: (v) => AdminValidators.text(v, 'Current Password', 1, 100, true) },
    { id: 'new-pass-input', check: (v) => AdminValidators.password(v, true) },
    { id: 'confirm-pass-input', check: (v) => {
      const newPass = document.getElementById('new-pass-input')?.value || '';
      if (!v) return 'Confirmation password is required.';
      if (v !== newPass) return 'Passwords do not match.';
      return null;
    }},

    { id: 'sb-url-input', check: (v) => AdminValidators.supabaseUrl(v, true) },
    { id: 'sb-key-input', check: (v) => AdminValidators.token(v, 'Supabase Public Anon Key', 20, true) },

    { id: 'gh-repo-input', check: (v) => AdminValidators.repo(v, true) },
    { id: 'gh-branch-input', check: (v) => AdminValidators.branch(v, true) },
    { id: 'gh-token-input', check: (v) => AdminValidators.token(v, 'GitHub Personal Access Token', 15, true) },

    { id: 'skill-hdr-title', check: (v) => AdminValidators.text(v, 'Stage Title', 2, 80, true) },
    { id: 'skill-hdr-status', check: (v) => AdminValidators.text(v, 'Status Badge', 2, 60, true) },
    { id: 'skill-hdr-subtitle', check: (v) => AdminValidators.text(v, 'Stage Subtitle', 5, 250, true) },

    { id: 'course-hdr-era', check: (v) => AdminValidators.text(v, 'Era Badge', 2, 60, true) },
    { id: 'course-hdr-status', check: (v) => AdminValidators.text(v, 'Status Badge', 2, 60, true) },
    { id: 'course-hdr-title', check: (v) => AdminValidators.text(v, 'Stage Title', 2, 80, true) },
    { id: 'course-hdr-subtitle', check: (v) => AdminValidators.text(v, 'Stage Subtitle', 5, 250, true) }
  ];

  fieldRules.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.addEventListener('blur', () => {
        const err = item.check(el.value);
        if (err) setAdminFieldError(el, err);
        else clearAdminFieldError(el);
      });
      el.addEventListener('input', () => {
        if (el.classList.contains('input-error')) {
          const err = item.check(el.value);
          if (err) setAdminFieldError(el, err);
          else clearAdminFieldError(el);
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initTabs();
  initImagePicker();
  initProfileAvatarPicker();
  initResumeDocPicker();
  initAdminValidation();
  renderAll();
});

function getStoredPin() {
  return localStorage.getItem(PIN_KEY) || 'admin123';
}

/* ==========================================================================
   Authentication & Lock Screen
   ========================================================================== */
function initAuth() {
  const lockScreen = document.getElementById('lock-screen');
  const pinInput = document.getElementById('pin-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const lockError = document.getElementById('lock-error');
  const logoutBtn = document.getElementById('logout-btn');

  const isAuth = sessionStorage.getItem(AUTH_KEY) === 'true';
  if (isAuth && lockScreen) {
    lockScreen.style.display = 'none';
  }

  function attemptUnlock() {
    const entered = pinInput.value.trim();
    if (entered === getStoredPin()) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      lockScreen.style.display = 'none';
      renderAll();
      lockError.style.display = 'none';
      pinInput.value = '';
      showToast('Unlocked successfully');
    } else {
      lockError.style.display = 'block';
      pinInput.value = '';
      pinInput.focus();
    }
  }

  if (unlockBtn) unlockBtn.addEventListener('click', attemptUnlock);
  if (pinInput) {
    pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptUnlock();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(AUTH_KEY);
      window.location.reload();
    });
  }
}

/* ==========================================================================
   Tab Navigation & URL Hash Routing
   ========================================================================== */
function switchTab(target, updateHash = true) {
  // Database and Cloud tab is permanently hidden per user requirements
  if (target === 'database' || target === 'cloud-sync') {
    target = 'projects';
  }

  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const targetBtn = document.querySelector(`.tab-btn[data-tab="${target}"]`);
  const targetPane = document.getElementById(`tab-${target}`);

  if (!targetPane || !targetBtn) return;

  tabBtns.forEach(b => b.classList.remove('active'));
  tabPanes.forEach(p => p.classList.remove('active'));

  targetBtn.classList.add('active');
  targetPane.classList.add('active');

  if (updateHash) {
    history.replaceState(null, '', '#' + target);
  }

  if (target === 'education') renderEducationManager();
  if (target === 'courses') renderCoursesManager();
  if (target === 'experience') renderExperienceManager();
  if (target === 'projects') renderProjectsList();
  if (target === 'skills') renderSkillsManager();
  if (target === 'profile') renderProfileForm();
  if (target === 'messages') renderInquiriesManager();
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      if (target === 'database' || target === 'cloud-sync') return;
      switchTab(target, true);
    });
  });

  // Check URL hash on initial load (e.g. #skills or #projects)
  const hash = window.location.hash.replace('#', '').trim();
  if (hash && hash !== 'database' && hash !== 'cloud-sync') {
    switchTab(hash, false);
  }

  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '').trim();
    if (currentHash && currentHash !== 'database' && currentHash !== 'cloud-sync') {
      switchTab(currentHash, false);
    }
  });
}

/* ==========================================================================
   File Explorer Image Picker & Preview
   ========================================================================== */
function initImagePicker() {
  const fileInput = document.getElementById('project-file-input');
  const textInput = document.getElementById('project-image');
  const nameLabel = document.getElementById('selected-file-name');
  const previewImg = document.getElementById('image-preview');
  const previewPlaceholder = document.getElementById('image-preview-placeholder');

  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (nameLabel) nameLabel.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (event) => {
      selectedImageData = event.target.result;
      if (previewImg) {
        previewImg.src = selectedImageData;
        previewImg.style.display = 'block';
      }
      if (previewPlaceholder) previewPlaceholder.style.display = 'none';
      if (textInput) textInput.value = selectedImageData;
    };
    reader.readAsDataURL(file);
  });

  if (textInput) {
    textInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        selectedImageData = val;
        if (previewImg) {
          previewImg.src = val;
          previewImg.style.display = 'block';
        }
        if (previewPlaceholder) previewPlaceholder.style.display = 'none';
        if (nameLabel) nameLabel.textContent = 'Custom path/URL';
      }
    });
  }
}

/* ==========================================================================
   Profile Photo Picker
   ========================================================================== */
function initProfileAvatarPicker() {
  const photoInput = document.getElementById('profile-photo-input');
  const nameLabel = document.getElementById('profile-photo-name');
  const previewImg = document.getElementById('profile-avatar-preview-img');
  const placeholder = document.getElementById('profile-avatar-placeholder');

  if (!photoInput) return;

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (nameLabel) nameLabel.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (event) => {
      profileAvatarData = event.target.result;
      if (previewImg) {
        previewImg.src = profileAvatarData;
        previewImg.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

function initResumeDocPicker() {
  const docInput = document.getElementById('resume-doc-input');
  const nameLabel = document.getElementById('resume-doc-name');

  if (!docInput) return;

  docInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resumeDocFilename = file.name;
    const sizeKb = (file.size / 1024).toFixed(1);
    if (nameLabel) {
      nameLabel.innerHTML = `Selected: <strong>${escapeHtml(file.name)}</strong> (${sizeKb} KB) &mdash; <span style="color: var(--accent-green);">Ready to save</span>`;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      resumeDocData = event.target.result;
      try {
        localStorage.setItem('portfolio_resume_doc', resumeDocData);
        localStorage.setItem('portfolio_resume_filename', resumeDocFilename);
      } catch (err) {
        console.warn('Could not cache resume in localStorage:', err);
      }
    };
    reader.readAsDataURL(file);
  });
}

function handleCategoryChange(select) {
  const customGroup = document.getElementById('custom-category-group');
  const customInput = document.getElementById('custom-category-input');
  if (!customGroup) return;

  if (select.value === 'others') {
    customGroup.style.display = 'block';
    if (customInput) customInput.focus();
  } else {
    customGroup.style.display = 'none';
  }
}

async function renderAll() {
  await renderProjectsList();
  await renderProfileForm();
  await renderSkillsManager();
  await renderExperienceManager();
  await renderEducationManager();
  await updateInquiriesBadge();
  renderDatabaseStatus();
}

/* ==========================================================================
   Projects Manager (CRUD via REST API)
   ========================================================================== */
async function renderProjectsList() {
  const grid = document.getElementById('admin-projects-grid');
  if (!grid) return;

  const data = await PortfolioAPI.getPortfolio();
  const projects = data.projects || [];

  if (projects.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
        <p style="color: var(--text-secondary); margin-bottom: 14px;">No projects currently available.</p>
        <button class="btn-primary" onclick="openProjectModal()">+ Add Your First Project</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = projects.map(p => `
    <div class="admin-project-card">
      <div class="admin-card-thumb">
        <img src="${p.image || 'assets/projects/nexus_ai.jpg'}" alt="${p.title}" />
        <span class="admin-card-badge">${p.categoryLabel || 'Project'}</span>
      </div>
      <div class="admin-card-content">
        <h4 class="admin-card-title">${p.title}</h4>
        <p class="admin-card-summary">${p.summary}</p>
        <div class="admin-card-chips">
          ${(Array.isArray(p.tech) ? p.tech : []).map(t => `<span class="chip">${t}</span>`).join('')}
        </div>
        <div class="admin-card-actions">
          <button class="btn-card-edit" onclick="editProject('${p.id}')">
            ${ADMIN_ICONS.edit}
            <span>Edit</span>
          </button>
          <button class="btn-card-delete" onclick="deleteProject('${p.id}')" title="Delete Project">
            ${ADMIN_ICONS.trash}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openProjectModal(isEdit = false) {
  const modal = document.getElementById('project-modal');
  const titleElem = document.getElementById('modal-project-title');
  const form = document.getElementById('project-form');
  const nameLabel = document.getElementById('selected-file-name');
  const previewImg = document.getElementById('image-preview');
  const previewPlaceholder = document.getElementById('image-preview-placeholder');
  const customGroup = document.getElementById('custom-category-group');
  const customInput = document.getElementById('custom-category-input');

  if (!modal || !form) return;

  if (!isEdit) {
    currentEditingProjectId = null;
    selectedImageData = null;
    titleElem.textContent = 'Add New Project';
    form.reset();
    const subInput = document.getElementById('project-subtitle');
    if (subInput) subInput.value = '';
    document.getElementById('project-category').value = 'testing';
    if (customGroup) customGroup.style.display = 'none';
    if (customInput) customInput.value = '';
    if (nameLabel) nameLabel.textContent = 'No file selected';
    if (previewImg) {
      previewImg.src = 'assets/projects/nexus_ai.jpg';
      previewImg.style.display = 'block';
    }
    if (previewPlaceholder) previewPlaceholder.style.display = 'none';
  } else {
    titleElem.textContent = 'Edit Project';
  }

  modal.classList.add('active');
}

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal) modal.classList.remove('active');
}

async function editProject(id) {
  const data = await PortfolioAPI.getPortfolio();
  const project = (data.projects || []).find(p => p.id === id);
  if (!project) return;

  currentEditingProjectId = id;
  selectedImageData = project.image || '';

  document.getElementById('project-title').value = project.title || '';
  const subInput = document.getElementById('project-subtitle');
  if (subInput) subInput.value = project.subtitle || '';
  
  const catSelect = document.getElementById('project-category');
  const customGroup = document.getElementById('custom-category-group');
  const customInput = document.getElementById('custom-category-input');
  const knownCats = ['testing', 'fullstack', 'frontend', 'backend', 'tools'];

  if (knownCats.includes(project.category)) {
    catSelect.value = project.category;
    if (customGroup) customGroup.style.display = 'none';
    if (customInput) customInput.value = '';
  } else {
    catSelect.value = 'others';
    if (customGroup) customGroup.style.display = 'block';
    if (customInput) customInput.value = project.categoryLabel || '';
  }

  document.getElementById('project-summary').value = project.summary || '';
  document.getElementById('project-tech').value = (project.tech || []).join(', ');
  document.getElementById('project-live').value = project.liveUrl || '';
  document.getElementById('project-github').value = project.githubUrl || '';

  const nameLabel = document.getElementById('selected-file-name');
  if (nameLabel) {
    nameLabel.textContent = project.image && project.image.startsWith('data:') ? 'Custom image loaded' : (project.image || 'Preset');
  }

  const previewImg = document.getElementById('image-preview');
  const previewPlaceholder = document.getElementById('image-preview-placeholder');
  if (previewImg && project.image) {
    previewImg.src = project.image;
    previewImg.style.display = 'block';
    if (previewPlaceholder) previewPlaceholder.style.display = 'none';
  }

  openProjectModal(true);
}

async function saveProjectForm(e) {
  e.preventDefault();

  const titleEl = document.getElementById('project-title');
  const subtitleEl = document.getElementById('project-subtitle');
  const summaryEl = document.getElementById('project-summary');
  const techEl = document.getElementById('project-tech');
  const liveEl = document.getElementById('project-live');
  const ghEl = document.getElementById('project-github');

  const rawCategory = document.getElementById('project-category').value;
  const customCategoryEl = document.getElementById('custom-category-input');

  const validations = [
    { el: titleEl, err: AdminValidators.text(titleEl?.value, 'Project Title', 3, 80, true) },
    { el: summaryEl, err: AdminValidators.text(summaryEl?.value, 'Summary', 10, 600, true) },
    { el: techEl, err: AdminValidators.text(techEl?.value, 'Tech Stack', 2, 200, true) },
    { el: liveEl, err: AdminValidators.url(liveEl?.value, false) },
    { el: ghEl, err: AdminValidators.url(ghEl?.value, false, 'github.com') }
  ];

  if (rawCategory === 'others') {
    validations.push({
      el: customCategoryEl,
      err: AdminValidators.text(customCategoryEl?.value, 'Custom Category Name', 2, 50, true)
    });
  }

  let firstInvalid = null;
  validations.forEach(({ el, err }) => {
    if (el) {
      if (err) {
        setAdminFieldError(el, err);
        if (!firstInvalid) firstInvalid = el;
      } else {
        clearAdminFieldError(el);
      }
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    showToast('Please correct the highlighted project fields.');
    return;
  }

  const title = titleEl.value.trim();
  const subtitle = subtitleEl?.value.trim() || '';
  let category = rawCategory;
  let categoryLabel = 'Software Testing';

  if (rawCategory === 'others') {
    const customVal = document.getElementById('custom-category-input').value.trim();
    categoryLabel = customVal || 'Other';
    category = 'cat-' + categoryLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
  } else if (rawCategory === 'testing') {
    categoryLabel = 'Software Testing';
  } else {
    const categoryLabels = {
      fullstack: 'Full Stack',
      frontend: 'Frontend',
      backend: 'Backend & APIs',
      tools: 'Developer Tools'
    };
    categoryLabel = categoryLabels[rawCategory] || 'Project';
  }

  const image = selectedImageData || 'assets/projects/nexus_ai.jpg';
  const summary = summaryEl.value.trim();
  const techStr = techEl.value.trim();
  const liveUrl = liveEl.value.trim();
  const githubUrl = ghEl.value.trim();

  const tech = techStr ? techStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const projectPayload = {
    title,
    subtitle,
    category,
    categoryLabel,
    image,
    summary,
    tech,
    liveUrl,
    githubUrl
  };

  if (currentEditingProjectId) {
    const res = await PortfolioAPI.updateProject(currentEditingProjectId, projectPayload);
    notifySaveResult('Project updated', res);
  } else {
    const res = await PortfolioAPI.createProject(projectPayload);
    notifySaveResult('Project created', res);
  }

  closeProjectModal();
  renderProjectsList();
}

async function deleteProject(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;

  const res = await PortfolioAPI.deleteProject(id);
  renderProjectsList();
  notifySaveResult('Project deleted', res);
}

/* ==========================================================================
   Profile Settings (CRUD via REST API)
   ========================================================================== */
async function renderProfileForm() {
  const data = await PortfolioAPI.getPortfolio();
  const p = data.profile || {};

  document.getElementById('prof-name').value = p.name || '';
  document.getElementById('prof-role').value = p.role || '';
  document.getElementById('prof-location').value = p.location || '';
  document.getElementById('prof-tagline').value = p.tagline || '';
  document.getElementById('prof-bio').value = p.bio || '';
  document.getElementById('prof-email').value = p.email || '';
  document.getElementById('prof-github').value = p.github || '';
  document.getElementById('prof-linkedin').value = p.linkedin || '';

  const degInput = document.getElementById('prof-degree');
  if (degInput) degInput.value = p.degreeTag || '';

  const cHeadline = document.getElementById('prof-contact-headline');
  const cSubtext = document.getElementById('prof-contact-subtext');
  if (cHeadline) cHeadline.value = p.contactHeadline || '';
  if (cSubtext) cSubtext.value = p.contactSubtext || '';

  const aboutQuoteInput = document.getElementById('prof-about-quote');
  const aboutNarrativeInput = document.getElementById('prof-about-narrative');
  if (aboutQuoteInput) aboutQuoteInput.value = data.aboutMe?.quote || '';
  if (aboutNarrativeInput) aboutNarrativeInput.value = data.aboutMe?.narrative || '';

  // About Me 5 Qualities
  const qualities = data.aboutMe?.qualities || [];
  for (let i = 0; i < 5; i++) {
    const qTitle = document.getElementById(`prof-q-title-${i}`);
    const qDesc = document.getElementById(`prof-q-desc-${i}`);
    if (qTitle) qTitle.value = qualities[i]?.title || '';
    if (qDesc) qDesc.value = qualities[i]?.description || '';
  }

  // QA Vision & Philosophy (Stage 7)
  const vision = data.vision || {};
  const vTitle = document.getElementById('prof-vision-title');
  const vBadge = document.getElementById('prof-vision-badge');
  const vQuote = document.getElementById('prof-vision-quote');
  const vNar = document.getElementById('prof-vision-narrative');
  if (vTitle) vTitle.value = vision.title || 'QA Vision & Philosophy';
  if (vBadge) vBadge.value = vision.badge || 'ENGINEERING EXCELLENCE';
  if (vQuote) vQuote.value = vision.quote || '';
  if (vNar) vNar.value = vision.narrative || '';

  const pillars = vision.pillars || [];
  for (let i = 0; i < 4; i++) {
    const pTitle = document.getElementById(`prof-p-title-${i}`);
    const pDesc = document.getElementById(`prof-p-desc-${i}`);
    if (pTitle) pTitle.value = pillars[i]?.title || '';
    if (pDesc) pDesc.value = pillars[i]?.description || '';
  }

  const avatarImg = document.getElementById('profile-avatar-preview-img');
  const placeholder = document.getElementById('profile-avatar-placeholder');
  const photoName = document.getElementById('profile-photo-name');
  if (p.avatar && avatarImg) {
    avatarImg.src = p.avatar;
    avatarImg.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    if (photoName) photoName.textContent = 'Custom photo set';
  }

  // Resume Document Status
  const resumeName = document.getElementById('resume-doc-name');
  const existingResume = p.resumeUrl || localStorage.getItem('portfolio_resume_doc');
  const existingFilename = p.resumeFilename || localStorage.getItem('portfolio_resume_filename');
  if (existingResume && resumeName) {
    resumeName.innerHTML = `Current: <strong>${escapeHtml(existingFilename || 'Uploaded Resume')}</strong> <a href="${existingResume}" download="${escapeHtml(existingFilename || 'Resume.pdf')}" style="margin-left: 8px; color: var(--accent-cyan, #38bdf8); text-decoration: underline;">(Download Preview)</a>`;
  }
}

async function saveProfileForm(e) {
  e.preventDefault();

  const nameEl = document.getElementById('prof-name');
  const roleEl = document.getElementById('prof-role');
  const locEl = document.getElementById('prof-location');
  const emailEl = document.getElementById('prof-email');
  const tagEl = document.getElementById('prof-tagline');
  const bioEl = document.getElementById('prof-bio');
  const ghEl = document.getElementById('prof-github');
  const liEl = document.getElementById('prof-linkedin');

  const validations = [
    { el: nameEl, err: AdminValidators.name(nameEl?.value, true) },
    { el: roleEl, err: AdminValidators.text(roleEl?.value, 'Primary Role', 3, 70, true) },
    { el: locEl, err: AdminValidators.text(locEl?.value, 'Location', 2, 70, true) },
    { el: emailEl, err: AdminValidators.email(emailEl?.value, true) },
    { el: tagEl, err: AdminValidators.text(tagEl?.value, 'Headline', 3, 100, true) },
    { el: bioEl, err: AdminValidators.text(bioEl?.value, 'Bio', 10, 600, true) },
    { el: ghEl, err: AdminValidators.url(ghEl?.value, false, 'github.com') },
    { el: liEl, err: AdminValidators.url(liEl?.value, false, 'linkedin.com') }
  ];

  let firstInvalid = null;
  validations.forEach(({ el, err }) => {
    if (el) {
      if (err) {
        setAdminFieldError(el, err);
        if (!firstInvalid) firstInvalid = el;
      } else {
        clearAdminFieldError(el);
      }
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Please correct the highlighted profile fields.');
    return;
  }

  const currentData = await PortfolioAPI.getPortfolio();
  const existingAvatar = currentData.profile?.avatar || '';

  const profilePayload = {
    name: nameEl.value.trim(),
    role: roleEl.value.trim(),
    location: locEl.value.trim(),
    degreeTag: document.getElementById('prof-degree')?.value.trim() || '',
    contactHeadline: document.getElementById('prof-contact-headline')?.value.trim() || '',
    contactSubtext: document.getElementById('prof-contact-subtext')?.value.trim() || '',
    tagline: tagEl.value.trim(),
    bio: bioEl.value.trim(),
    email: emailEl.value.trim(),
    github: ghEl.value.trim(),
    linkedin: liEl.value.trim(),
    avatar: profileAvatarData || existingAvatar,
    resumeUrl: resumeDocData || currentData.profile?.resumeUrl || localStorage.getItem('portfolio_resume_doc') || '',
    resumeFilename: resumeDocFilename || currentData.profile?.resumeFilename || localStorage.getItem('portfolio_resume_filename') || ''
  };

  // 1. Save About Me (Quote, Narrative, 5 Qualities)
  const aboutQuoteInput = document.getElementById('prof-about-quote');
  const aboutNarrativeInput = document.getElementById('prof-about-narrative');
  const qualities = [];
  for (let i = 0; i < 5; i++) {
    const t = document.getElementById(`prof-q-title-${i}`)?.value.trim();
    const d = document.getElementById(`prof-q-desc-${i}`)?.value.trim();
    if (t || d) {
      qualities.push({ title: t || '', description: d || '' });
    }
  }

  const aboutMePayload = {
    title: 'About Me',
    subtitle: 'Reflection & Professional Philosophy',
    quote: aboutQuoteInput ? aboutQuoteInput.value.trim() : '',
    narrative: aboutNarrativeInput ? aboutNarrativeInput.value.trim() : '',
    qualities: qualities.length > 0 ? qualities : (currentData.aboutMe?.qualities || [])
  };
  await PortfolioAPI.updateAboutMe(aboutMePayload);

  // 2. Save QA Vision & Philosophy (Stage 7)
  const pillars = [];
  for (let i = 0; i < 4; i++) {
    const t = document.getElementById(`prof-p-title-${i}`)?.value.trim();
    const d = document.getElementById(`prof-p-desc-${i}`)?.value.trim();
    if (t || d) {
      pillars.push({ title: t || '', description: d || '' });
    }
  }

  const visionPayload = {
    title: document.getElementById('prof-vision-title')?.value.trim() || 'QA Vision & Philosophy',
    subtitle: 'CONTINUOUS GROWTH',
    badge: document.getElementById('prof-vision-badge')?.value.trim() || 'ENGINEERING EXCELLENCE',
    quote: document.getElementById('prof-vision-quote')?.value.trim() || '',
    narrative: document.getElementById('prof-vision-narrative')?.value.trim() || '',
    pillars: pillars.length > 0 ? pillars : (currentData.vision?.pillars || [])
  };
  await PortfolioAPI.updateVision(visionPayload);

  // 3. Save Profile
  const res = await PortfolioAPI.updateProfile(profilePayload);
  notifySaveResult('Profile, About Me & QA Vision updated', res);
}

/* ==========================================================================
   Skills Manager (CRUD via REST API)
   ========================================================================== */
async function renderSkillsManager() {
  const container = document.getElementById('admin-skills-container');
  if (!container) return;

  const data = await PortfolioAPI.getPortfolio();
  const skills = data.skills || {};

  // Populate Stage 06 header settings
  const hdr = data.skillsHeader || (data.profile && data.profile.skillsHeader) || {};
  const sTitle = document.getElementById('skill-hdr-title');
  const sStatus = document.getElementById('skill-hdr-status');
  const sSubtitle = document.getElementById('skill-hdr-subtitle');
  if (sTitle) sTitle.value = hdr.title || 'Technical Skill Garden';
  if (sStatus) sStatus.value = hdr.statusBadge || 'QUALITATIVE PROFICIENCY';
  if (sSubtitle) sSubtitle.value = hdr.subtitle || 'Honed through coursework, college engineering, and real internship delivery.';

  const categories = [
    { key: 'testing', title: 'Testing' },
    { key: 'automation', title: 'Automation' },
    { key: 'database', title: 'Database' },
    { key: 'tools', title: 'Tools' },
    { key: 'programming', title: 'Programming' }
  ];

  const catPlaceholders = {
    testing: 'e.g. Manual Testing, Test Case Design',
    automation: 'e.g. Selenium WebDriver, Playwright',
    database: 'e.g. PostgreSQL, MySQL, Supabase',
    tools: 'e.g. Postman, Git & GitHub, Jira',
    programming: 'e.g. Java, Python, JavaScript'
  };

  container.innerHTML = categories.map(cat => {
    const items = skills[cat.key]?.items || [];
    const ph = catPlaceholders[cat.key] || 'e.g. Selenium WebDriver';
    return `
      <div class="skill-category-box">
        <h4 class="skill-box-title">
          <span>${cat.title}</span>
          <span class="skill-count-badge">${items.length} ${items.length === 1 ? 'skill' : 'skills'}</span>
        </h4>
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <label class="form-label" for="add-skill-input-${cat.key}" style="font-size: 0.82rem; font-weight: 700; margin-bottom: 0;">
              Skill Name <span class="required-star">*</span>
            </label>
            <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-secondary);">
              Proficiency Level <span class="required-star">*</span>
            </span>
          </div>
          <div class="skill-add-row" style="display: flex; gap: 8px; align-items: flex-start;">
            <div style="flex: 1; position: relative;">
              <input type="text" id="add-skill-input-${cat.key}" class="form-input" placeholder="${ph}" minlength="2" maxlength="50" required autocomplete="off" />
            </div>
            <select id="add-skill-level-${cat.key}" class="form-input" style="width: 155px; flex-shrink: 0;" required>
              <option value="Strong">Strong / Expert</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Proficient">Proficient / Working</option>
            </select>
            <button class="btn-primary" style="flex-shrink: 0; padding: 11px 18px;" onclick="addSkill('${cat.key}')">Add</button>
          </div>
        </div>
        <div class="skill-tag-list" style="margin-top: 12px;">
          ${items.map((item, index) => {
            const name = typeof item === 'string' ? item : (item.name || item.title || '');
            const level = typeof item === 'object' && item.level ? item.level : 'Strong';
            const lvlClass = 'lvl-' + (level || 'strong').toLowerCase();
            return `
              <div class="skill-tag-item">
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                  <span class="skill-name-text">${escapeHtml(name)}</span>
                  <span class="skill-level-pill ${lvlClass}">${escapeHtml(level)}</span>
                </div>
                <button class="skill-delete-btn" onclick="deleteSkill('${cat.key}', ${index})" title="Delete Skill">
                  ${ADMIN_ICONS.trash}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Attach real-time validation and Enter-key listener to each category input
  categories.forEach(cat => {
    const input = document.getElementById(`add-skill-input-${cat.key}`);
    if (input) {
      input.addEventListener('blur', () => {
        if (input.value.trim().length > 0) {
          const err = AdminValidators.text(input.value, 'Skill Name', 2, 50, true);
          if (err) setAdminFieldError(input, err);
          else clearAdminFieldError(input);
        } else {
          clearAdminFieldError(input);
        }
      });
      input.addEventListener('input', () => {
        if (input.classList.contains('input-error')) {
          const err = AdminValidators.text(input.value, 'Skill Name', 2, 50, true);
          if (err) setAdminFieldError(input, err);
          else clearAdminFieldError(input);
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSkill(cat.key);
        }
      });
    }
  });
}

async function addSkill(catKey) {
  const input = document.getElementById(`add-skill-input-${catKey}`);
  const levelSelect = document.getElementById(`add-skill-level-${catKey}`);
  if (!input) return;

  const text = input.value.trim();
  const validationErr = AdminValidators.text(text, 'Skill Name', 2, 50, true);
  if (validationErr) {
    setAdminFieldError(input, validationErr);
    input.focus();
    return;
  }

  const data = await PortfolioAPI.getPortfolio();
  data.skills = data.skills || {};
  data.skills[catKey] = data.skills[catKey] || { title: catKey, items: [] };
  data.skills[catKey].items = data.skills[catKey].items || [];

  // Check duplicate skill in category
  const isDuplicate = data.skills[catKey].items.some(item => {
    const existingName = typeof item === 'string' ? item : (item.name || item.title || '');
    return existingName.toLowerCase() === text.toLowerCase();
  });

  if (isDuplicate) {
    setAdminFieldError(input, `"${text}" is already added in this category.`);
    input.focus();
    return;
  }

  clearAdminFieldError(input);
  const level = levelSelect ? levelSelect.value : 'Strong';

  data.skills[catKey].items.push({ name: text, level: level });
  await PortfolioAPI.updateSkills(data.skills);
  renderSkillsManager();
  showToast(`Added ${text} (${level})`);
}

async function deleteSkill(catKey, index) {
  const data = await PortfolioAPI.getPortfolio();
  if (data.skills && data.skills[catKey] && data.skills[catKey].items) {
    const removed = data.skills[catKey].items.splice(index, 1);
    await PortfolioAPI.updateSkills(data.skills);
    renderSkillsManager();
    const removedName = typeof removed[0] === 'string' ? removed[0] : (removed[0].name || 'Skill');
    showToast(`Removed ${removedName}`);
  }
}

async function saveSkillsHeaderForm(e) {
  e.preventDefault();
  const titleEl = document.getElementById('skill-hdr-title');
  const statusEl = document.getElementById('skill-hdr-status');
  const subtitleEl = document.getElementById('skill-hdr-subtitle');

  const titleErr = AdminValidators.text(titleEl?.value, 'Stage Title', 2, 80, true);
  const statusErr = AdminValidators.text(statusEl?.value, 'Status Badge', 2, 60, true);
  const subtitleErr = AdminValidators.text(subtitleEl?.value, 'Stage Subtitle', 5, 250, true);

  if (titleErr) setAdminFieldError(titleEl, titleErr);
  else clearAdminFieldError(titleEl);

  if (statusErr) setAdminFieldError(statusEl, statusErr);
  else clearAdminFieldError(statusEl);

  if (subtitleErr) setAdminFieldError(subtitleEl, subtitleErr);
  else clearAdminFieldError(subtitleEl);

  if (titleErr || statusErr || subtitleErr) {
    if (titleErr && titleEl) titleEl.focus();
    else if (statusErr && statusEl) statusEl.focus();
    else if (subtitleErr && subtitleEl) subtitleEl.focus();
    showToast('Please correct the highlighted settings.');
    return;
  }

  const headerPayload = {
    title: titleEl.value.trim(),
    statusBadge: statusEl.value.trim(),
    subtitle: subtitleEl.value.trim()
  };

  showToast('Saving Stage 06 settings...');
  const res = await PortfolioAPI.updateSkillsHeader(headerPayload);
  notifySaveResult('Stage 06 settings saved', res);
}

/* ==========================================================================
   Experience Manager (CRUD via REST API)
   ========================================================================== */
async function renderExperienceManager() {
  const container = document.getElementById('admin-exp-container');
  if (!container) return;

  const data = await PortfolioAPI.getPortfolio();
  const list = data.experience || [];

  if (list.length === 0) {
    container.innerHTML = `<p style="color: var(--text-secondary);">No experience records found.</p>`;
    return;
  }

  container.innerHTML = list.map((exp, index) => `
    <div class="exp-admin-card">
      <div class="exp-admin-info">
        <h4 class="exp-admin-role">${exp.role}</h4>
        <div class="exp-admin-meta">${exp.company} • ${exp.location} • ${exp.period}</div>
        <p class="exp-admin-desc">${exp.description}</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-card-edit" onclick="editExperience(${index})">
          ${ADMIN_ICONS.edit}
          <span>Edit</span>
        </button>
        <button class="btn-card-delete" onclick="deleteExperience(${index})" title="Delete">
          ${ADMIN_ICONS.trash}
        </button>
      </div>
    </div>
  `).join('');
}

function openExpModal(isEdit = false) {
  const modal = document.getElementById('exp-modal');
  const title = document.getElementById('modal-exp-title');
  const form = document.getElementById('exp-form');

  if (!modal || !form) return;

  if (!isEdit) {
    currentEditingExpIndex = null;
    title.textContent = 'Add Career Milestone';
    form.reset();
    const cTitle = document.getElementById('exp-card-title');
    const cBadge = document.getElementById('exp-card-badge');
    const cTakeaway = document.getElementById('exp-takeaway');
    if (cTitle) cTitle.value = '';
    if (cBadge) cBadge.value = '';
    if (cTakeaway) cTakeaway.value = '';
    document.getElementById('exp-metric1-val').value = '';
    document.getElementById('exp-metric1-lbl').value = '';
    document.getElementById('exp-metric2-val').value = '';
    document.getElementById('exp-metric2-lbl').value = '';
    document.getElementById('exp-narrative').value = '';
  } else {
    title.textContent = 'Edit Career Milestone';
  }

  modal.classList.add('active');
}

function closeExpModal() {
  const modal = document.getElementById('exp-modal');
  if (modal) modal.classList.remove('active');
}

async function editExperience(index) {
  const data = await PortfolioAPI.getPortfolio();
  const exp = (data.experience || [])[index];
  if (!exp) return;

  currentEditingExpIndex = index;
  const cTitle = document.getElementById('exp-card-title');
  const cBadge = document.getElementById('exp-card-badge');
  const cTakeaway = document.getElementById('exp-takeaway');
  if (cTitle) cTitle.value = exp.cardTitle || '';
  if (cBadge) cBadge.value = exp.badge || '';
  if (cTakeaway) cTakeaway.value = exp.takeaway || '';

  document.getElementById('exp-role').value = exp.role || '';
  document.getElementById('exp-company').value = exp.company || '';
  document.getElementById('exp-location').value = exp.location || '';
  document.getElementById('exp-period').value = exp.period || '';
  document.getElementById('exp-desc').value = exp.description || '';
  document.getElementById('exp-bullets').value = (exp.bullets || []).join('\n');

  // Load metrics & narrative
  const m1 = exp.metrics?.[0] || {};
  const m2 = exp.metrics?.[1] || {};
  document.getElementById('exp-metric1-val').value = m1.value || '';
  document.getElementById('exp-metric1-lbl').value = m1.label || '';
  document.getElementById('exp-metric2-val').value = m2.value || '';
  document.getElementById('exp-metric2-lbl').value = m2.label || '';
  document.getElementById('exp-narrative').value = exp.narrative || '';

  openExpModal(true);
}

async function saveExperienceForm(e) {
  e.preventDefault();

  const roleEl = document.getElementById('exp-role');
  const compEl = document.getElementById('exp-company');
  const locEl = document.getElementById('exp-location');
  const periodEl = document.getElementById('exp-period');
  const descEl = document.getElementById('exp-desc');

  const validations = [
    { el: roleEl, err: AdminValidators.text(roleEl?.value, 'Role Title', 2, 70, true) },
    { el: periodEl, err: AdminValidators.text(periodEl?.value, 'Active Period', 3, 50, true) },
    { el: compEl, err: AdminValidators.text(compEl?.value, 'Company', 2, 70, true) },
    { el: locEl, err: AdminValidators.text(locEl?.value, 'Location', 2, 70, true) },
    { el: descEl, err: AdminValidators.text(descEl?.value, 'Summary Description', 10, 600, true) }
  ];

  let firstInvalid = null;
  validations.forEach(({ el, err }) => {
    if (el) {
      if (err) {
        setAdminFieldError(el, err);
        if (!firstInvalid) firstInvalid = el;
      } else {
        clearAdminFieldError(el);
      }
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    showToast('Please correct the highlighted milestone fields.');
    return;
  }

  const data = await PortfolioAPI.getPortfolio();
  data.experience = data.experience || [];

  const cardTitle = document.getElementById('exp-card-title')?.value.trim() || '';
  const badge = document.getElementById('exp-card-badge')?.value.trim() || '';
  const takeaway = document.getElementById('exp-takeaway')?.value.trim() || '';

  const role = roleEl.value.trim();
  const company = compEl.value.trim();
  const location = locEl.value.trim();
  const period = periodEl.value.trim();
  const description = descEl.value.trim();
  const bulletsStr = document.getElementById('exp-bullets').value.trim();
  const narrative = document.getElementById('exp-narrative')?.value.trim() || '';

  const m1Val = document.getElementById('exp-metric1-val')?.value.trim() || '';
  const m1Lbl = document.getElementById('exp-metric1-lbl')?.value.trim() || '';
  const m2Val = document.getElementById('exp-metric2-val')?.value.trim() || '';
  const m2Lbl = document.getElementById('exp-metric2-lbl')?.value.trim() || '';

  const metrics = [];
  if (m1Val || m1Lbl) metrics.push({ label: m1Lbl || 'Pass Rate', value: m1Val || '99.8%' });
  if (m2Val || m2Lbl) metrics.push({ label: m2Lbl || 'Cycle Reduction', value: m2Val || '30%' });

  const bullets = bulletsStr ? bulletsStr.split('\n').map(s => s.trim()).filter(Boolean) : [];
  
  const existing = currentEditingExpIndex !== null ? data.experience[currentEditingExpIndex] : {};
  const entry = {
    ...existing,
    cardTitle: cardTitle || existing.cardTitle || '',
    badge: badge || existing.badge || '',
    takeaway: takeaway || existing.takeaway || '',
    role,
    company,
    location,
    period,
    description,
    narrative: narrative || existing.narrative || '',
    bullets,
    metrics: metrics.length > 0 ? metrics : (existing.metrics || [])
  };

  if (currentEditingExpIndex !== null) {
    data.experience[currentEditingExpIndex] = entry;
    showToast('Experience entry updated');
  } else {
    data.experience.push(entry);
    showToast('Experience entry added');
  }

  const res = await PortfolioAPI.updateExperience(data.experience);
  closeExpModal();
  renderExperienceManager();
  notifySaveResult('Experience saved', res);
}

async function deleteExperience(index) {
  if (!confirm('Are you sure you want to delete this experience record?')) return;

  const data = await PortfolioAPI.getPortfolio();
  data.experience = data.experience || [];
  data.experience.splice(index, 1);
  await PortfolioAPI.updateExperience(data.experience);
  renderExperienceManager();
  showToast('Experience record deleted');
}

/* ==========================================================================
   Education Manager (CRUD via REST API)
   ========================================================================== */
async function renderEducationManager() {
  const container = document.getElementById('admin-education-container');
  if (!container) return;

  const data = await PortfolioAPI.getPortfolio();
  const list = data.education || [];

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
        <p style="color: var(--text-secondary); margin-bottom: 14px;">No education milestones added yet.</p>
        <button class="btn-primary" onclick="openEducationModal()">+ Add Academic Qualification</button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((item, index) => `
    <div class="exp-admin-card">
      <div class="exp-admin-info">
        <div class="exp-admin-role">${escapeHtml(item.degree || 'Degree')}</div>
        <div class="exp-admin-company">${escapeHtml(item.institution || '')}${item.location ? ` • ${escapeHtml(item.location)}` : ''}</div>
        <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px; flex-wrap: wrap;">
          <span class="exp-admin-period">${escapeHtml(item.year || item.period || '')}</span>
          ${item.score ? `<span class="exp-admin-period" style="background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border-light); font-weight: 700;">${escapeHtml(item.score)}</span>` : ''}
        </div>
      </div>
      <div class="exp-admin-actions">
        <button class="btn-card-edit" onclick="editEducation(${index})" title="Edit">
          ${ADMIN_ICONS.edit}
          <span>Edit</span>
        </button>
        <button class="btn-card-delete" onclick="deleteEducation(${index})" title="Delete">
          ${ADMIN_ICONS.trash}
        </button>
      </div>
    </div>
  `).join('');
}

function openEducationModal(isEdit = false) {
  const modal = document.getElementById('education-modal');
  const title = document.getElementById('modal-education-title');
  const form = document.getElementById('education-form');

  if (!modal || !form) return;

  if (!isEdit) {
    currentEditingEduIndex = null;
    title.textContent = 'Add Education';
    form.reset();
    const idxInput = document.getElementById('education-index');
    if (idxInput) idxInput.value = '';
    const cTitleInput = document.getElementById('edu-card-title');
    if (cTitleInput) cTitleInput.value = '';
    const badgeInput = document.getElementById('edu-badge');
    if (badgeInput) badgeInput.value = '';
    const prefixInput = document.getElementById('edu-score-prefix');
    if (prefixInput) prefixInput.value = '';
    const detailsInput = document.getElementById('edu-details');
    if (detailsInput) detailsInput.value = '';
    const narrativeInput = document.getElementById('edu-narrative');
    if (narrativeInput) narrativeInput.value = '';
    const takeawayInput = document.getElementById('edu-takeaway');
    if (takeawayInput) takeawayInput.value = '';
  } else {
    title.textContent = 'Edit Education';
  }

  modal.classList.add('active');
}

function closeEducationModal() {
  const modal = document.getElementById('education-modal');
  if (modal) modal.classList.remove('active');
  currentEditingEduIndex = null;
}

async function editEducation(index) {
  const data = await PortfolioAPI.getPortfolio();
  const edu = (data.education || [])[index];
  if (!edu) return;

  currentEditingEduIndex = index;
  const cTitleInput = document.getElementById('edu-card-title');
  if (cTitleInput) cTitleInput.value = edu.cardTitle || '';
  const badgeInput = document.getElementById('edu-badge');
  if (badgeInput) badgeInput.value = edu.badge || '';
  const prefixInput = document.getElementById('edu-score-prefix');
  if (prefixInput) prefixInput.value = edu.scorePrefix || '';
  const detailsInput = document.getElementById('edu-details');
  if (detailsInput) detailsInput.value = edu.details || edu.specialization || '';

  document.getElementById('edu-degree').value = edu.degree || '';
  document.getElementById('edu-institution').value = edu.institution || '';
  document.getElementById('edu-year').value = edu.year || edu.period || '';
  document.getElementById('edu-score').value = edu.score || '';
  document.getElementById('edu-location').value = edu.location || '';
  
  const narrativeInput = document.getElementById('edu-narrative');
  if (narrativeInput) narrativeInput.value = edu.narrative || edu.description || '';
  const takeawayInput = document.getElementById('edu-takeaway');
  if (takeawayInput) takeawayInput.value = edu.takeaway || edu.keyLearning || '';

  openEducationModal(true);
}

async function saveEducationForm(e) {
  e.preventDefault();

  const degreeEl = document.getElementById('edu-degree');
  const instEl = document.getElementById('edu-institution');
  const yearEl = document.getElementById('edu-year');
  const scoreEl = document.getElementById('edu-score');

  const validations = [
    { el: degreeEl, err: AdminValidators.text(degreeEl?.value, 'Degree Title', 2, 80, true) },
    { el: instEl, err: AdminValidators.text(instEl?.value, 'University / School Name', 2, 90, true) },
    { el: yearEl, err: AdminValidators.yearOrPeriod(yearEl?.value, 'Year / Period', true) },
    { el: scoreEl, err: AdminValidators.score(scoreEl?.value, true) }
  ];

  let firstInvalid = null;
  validations.forEach(({ el, err }) => {
    if (el) {
      if (err) {
        setAdminFieldError(el, err);
        if (!firstInvalid) firstInvalid = el;
      } else {
        clearAdminFieldError(el);
      }
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    showToast('Please correct the highlighted education fields.');
    return;
  }

  const data = await PortfolioAPI.getPortfolio();
  data.education = data.education || [];

  const cardTitle = document.getElementById('edu-card-title')?.value.trim() || '';
  const badge = document.getElementById('edu-badge')?.value.trim() || '';
  const scorePrefix = document.getElementById('edu-score-prefix')?.value.trim() || '';
  const details = document.getElementById('edu-details')?.value.trim() || '';

  const degree = degreeEl.value.trim();
  const institution = instEl.value.trim();
  const year = yearEl.value.trim();
  const score = scoreEl.value.trim();
  const location = document.getElementById('edu-location').value.trim();
  const narrativeInput = document.getElementById('edu-narrative');
  const takeawayInput = document.getElementById('edu-takeaway');
  const narrative = narrativeInput ? narrativeInput.value.trim() : '';
  const takeaway = takeawayInput ? takeawayInput.value.trim() : '';

  const entry = {
    cardTitle,
    badge,
    scorePrefix,
    details,
    specialization: details,
    degree,
    institution,
    year,
    period: year,
    score,
    location,
    narrative,
    takeaway,
    description: narrative,
    keyLearning: takeaway
  };

  if (currentEditingEduIndex !== null && currentEditingEduIndex !== undefined) {
    data.education[currentEditingEduIndex] = { ...data.education[currentEditingEduIndex], ...entry };
    showToast('Education entry updated');
  } else {
    data.education.push(entry);
    showToast('Education entry added');
  }

  currentEditingEduIndex = null;
  const res = await PortfolioAPI.updateEducation(data.education);
  closeEducationModal();
  renderEducationManager();
  notifySaveResult('Education saved', res);
}

async function deleteEducation(index) {
  if (!confirm('Are you sure you want to delete this education record?')) return;

  const data = await PortfolioAPI.getPortfolio();
  data.education = data.education || [];
  data.education.splice(index, 1);
  await PortfolioAPI.updateEducation(data.education);
  renderEducationManager();
  showToast('Education record deleted');
}

/* ==========================================================================
   Courses & Certifications Manager (Milestone 4 CRUD)
   ========================================================================== */
let currentEditingCourseIndex = null;

async function renderCoursesManager() {
  const container = document.getElementById('admin-courses-container');
  if (!container) return;

  const data = await PortfolioAPI.getPortfolio();
  const list = data.courses || [];

  // Populate Stage 03 header form inputs
  const hdr = data.coursesHeader || (data.profile && data.profile.coursesHeader) || {};
  const eraEl = document.getElementById('course-hdr-era');
  const statusEl = document.getElementById('course-hdr-status');
  const titleEl = document.getElementById('course-hdr-title');
  const subEl = document.getElementById('course-hdr-subtitle');

  if (eraEl) eraEl.value = hdr.eraBadge || 'STAGE 03 • SPECIALIZED TRAINING';
  if (statusEl) statusEl.value = hdr.statusBadge || 'CERTIFIED • INDUSTRY-READY';
  if (titleEl) titleEl.value = hdr.title || 'What I Learned Along the Way';
  if (subEl) subEl.value = hdr.subtitle || 'Hands-on certifications & rigorous testing frameworks.';

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
        <p style="color: var(--text-secondary); margin-bottom: 14px;">No courses or certifications added yet.</p>
        <button class="btn-primary" onclick="openCourseModal()">+ Add Course / Certification</button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((item, index) => `
    <div class="exp-admin-card">
      <div class="exp-admin-info">
        <div class="exp-admin-role">${escapeHtml(item.name || 'Course Title')}</div>
        <div class="exp-admin-company">
          <span>${escapeHtml(item.platform || '')}</span>
          ${item.category ? `<span class="exp-admin-badge">${escapeHtml(item.category)}</span>` : ''}
        </div>
        <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px; flex-wrap: wrap;">
          ${item.year ? `<span class="exp-admin-period"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px; vertical-align: middle;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${escapeHtml(item.year)}</span>` : ''}
        </div>
        ${item.description ? `<p class="exp-admin-desc">${escapeHtml(item.description)}</p>` : ''}
      </div>
      <div class="exp-admin-actions">
        <button class="btn-card-edit" onclick="editCourse(${index})" title="Edit">
          ${ADMIN_ICONS.edit}
          <span>Edit</span>
        </button>
        <button class="btn-card-delete" onclick="deleteCourse(${index})" title="Delete">
          ${ADMIN_ICONS.trash}
        </button>
      </div>
    </div>
  `).join('');
}

function openCourseModal(isEdit = false) {
  const modal = document.getElementById('course-modal');
  const title = document.getElementById('modal-course-title');
  const form = document.getElementById('course-form');
  if (!modal || !form) return;

  if (!isEdit) {
    currentEditingCourseIndex = null;
    title.textContent = 'Add Course / Certification';
    form.reset();
  } else {
    title.textContent = 'Edit Course / Certification';
  }
  modal.classList.add('active');
}

function closeCourseModal() {
  const modal = document.getElementById('course-modal');
  if (modal) modal.classList.remove('active');
  currentEditingCourseIndex = null;
}

async function editCourse(index) {
  const data = await PortfolioAPI.getPortfolio();
  const c = (data.courses || [])[index];
  if (!c) return;

  currentEditingCourseIndex = index;
  document.getElementById('course-name').value = c.name || '';
  document.getElementById('course-platform').value = c.platform || '';
  document.getElementById('course-year').value = c.year || '';
  document.getElementById('course-category').value = c.category || 'Automation';
  document.getElementById('course-desc').value = c.description || '';
  openCourseModal(true);
}

async function saveCourseForm(e) {
  e.preventDefault();

  const nameEl = document.getElementById('course-name');
  const platEl = document.getElementById('course-platform');
  const yearEl = document.getElementById('course-year');
  const descEl = document.getElementById('course-desc');

  const validations = [
    { el: nameEl, err: AdminValidators.text(nameEl?.value, 'Course Title', 2, 90, true) },
    { el: platEl, err: AdminValidators.text(platEl?.value, 'Platform / Institute', 2, 80, true) },
    { el: yearEl, err: AdminValidators.yearOrPeriod(yearEl?.value, 'Completion Year', true) },
    { el: descEl, err: AdminValidators.text(descEl?.value, 'Description', 10, 500, true) }
  ];

  let firstInvalid = null;
  validations.forEach(({ el, err }) => {
    if (el) {
      if (err) {
        setAdminFieldError(el, err);
        if (!firstInvalid) firstInvalid = el;
      } else {
        clearAdminFieldError(el);
      }
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    showToast('Please correct the highlighted course fields.');
    return;
  }

  const data = await PortfolioAPI.getPortfolio();
  data.courses = data.courses || [];

  const name = nameEl.value.trim();
  const platform = platEl.value.trim();
  const year = yearEl.value.trim();
  const category = document.getElementById('course-category').value.trim();
  const description = descEl.value.trim();

  const entry = {
    id: `course-${Date.now()}`,
    name,
    platform,
    year,
    category,
    description
  };

  if (currentEditingCourseIndex !== null && currentEditingCourseIndex !== undefined) {
    data.courses[currentEditingCourseIndex] = { ...data.courses[currentEditingCourseIndex], ...entry };
    showToast('Course updated');
  } else {
    data.courses.push(entry);
    showToast('Course added');
  }

  currentEditingCourseIndex = null;
  const res = await PortfolioAPI.updateCourses(data.courses);
  closeCourseModal();
  renderCoursesManager();
  notifySaveResult('Course saved', res);
}

async function deleteCourse(index) {
  if (!confirm('Are you sure you want to delete this course?')) return;
  const data = await PortfolioAPI.getPortfolio();
  data.courses = data.courses || [];
  data.courses.splice(index, 1);
  await PortfolioAPI.updateCourses(data.courses);
  renderCoursesManager();
  showToast('Course deleted');
}

async function saveCoursesHeaderForm(e) {
  e.preventDefault();
  const eraEl = document.getElementById('course-hdr-era');
  const statusEl = document.getElementById('course-hdr-status');
  const titleEl = document.getElementById('course-hdr-title');
  const subtitleEl = document.getElementById('course-hdr-subtitle');

  const eraErr = AdminValidators.text(eraEl?.value, 'Era Badge', 2, 60, true);
  const statusErr = AdminValidators.text(statusEl?.value, 'Status Badge', 2, 60, true);
  const titleErr = AdminValidators.text(titleEl?.value, 'Stage Title', 2, 80, true);
  const subtitleErr = AdminValidators.text(subtitleEl?.value, 'Stage Subtitle', 5, 250, true);

  if (eraErr) setAdminFieldError(eraEl, eraErr);
  else clearAdminFieldError(eraEl);

  if (statusErr) setAdminFieldError(statusEl, statusErr);
  else clearAdminFieldError(statusEl);

  if (titleErr) setAdminFieldError(titleEl, titleErr);
  else clearAdminFieldError(titleEl);

  if (subtitleErr) setAdminFieldError(subtitleEl, subtitleErr);
  else clearAdminFieldError(subtitleEl);

  if (eraErr || statusErr || titleErr || subtitleErr) {
    if (eraErr && eraEl) eraEl.focus();
    else if (statusErr && statusEl) statusEl.focus();
    else if (titleErr && titleEl) titleEl.focus();
    else if (subtitleErr && subtitleEl) subtitleEl.focus();
    showToast('Please correct the highlighted course stage settings.');
    return;
  }

  const headerPayload = {
    eraBadge: eraEl.value.trim(),
    statusBadge: statusEl.value.trim(),
    title: titleEl.value.trim(),
    subtitle: subtitleEl.value.trim()
  };

  showToast('Saving Stage 03 settings...');
  const res = await PortfolioAPI.updateCoursesHeader(headerPayload);
  notifySaveResult('Stage 03 settings saved', res);
}

/* ==========================================================================
   Admin Security & Password Management
   ========================================================================== */
function updateAdminPassword(e) {
  e.preventDefault();

  const currentInput = document.getElementById('current-pass-input');
  const newInput = document.getElementById('new-pass-input');
  const confirmInput = document.getElementById('confirm-pass-input');
  const errorMsg = document.getElementById('password-error-msg');

  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
  }
  clearAdminFieldError(currentInput);
  clearAdminFieldError(newInput);
  clearAdminFieldError(confirmInput);

  const currentPass = currentInput ? currentInput.value.trim() : '';
  const newPass = newInput ? newInput.value.trim() : '';
  const confirmPass = confirmInput ? confirmInput.value.trim() : '';

  let hasError = false;

  if (!currentPass) {
    setAdminFieldError(currentInput, 'Current password is required.');
    hasError = true;
  } else if (currentPass !== getStoredPin()) {
    setAdminFieldError(currentInput, 'Current password does not match.');
    hasError = true;
  }

  const newPassErr = AdminValidators.password(newPass, true);
  if (newPassErr) {
    setAdminFieldError(newInput, newPassErr);
    hasError = true;
  }

  if (!confirmPass) {
    setAdminFieldError(confirmInput, 'Confirmation password is required.');
    hasError = true;
  } else if (newPass && confirmPass !== newPass) {
    setAdminFieldError(confirmInput, 'Confirmation password does not match new password.');
    hasError = true;
  }

  if (hasError) {
    if (!currentPass || currentPass !== getStoredPin()) currentInput?.focus();
    else if (newPassErr) newInput?.focus();
    else confirmInput?.focus();
    return;
  }

  // Save updated password
  localStorage.setItem(PIN_KEY, newPass);
  if (currentInput) currentInput.value = '';
  if (newInput) newInput.value = '';
  if (confirmInput) confirmInput.value = '';
  clearAdminFieldError(currentInput);
  clearAdminFieldError(newInput);
  clearAdminFieldError(confirmInput);

  showToast('Admin password updated successfully');
}

/* ==========================================================================
   Toast Notification
   ========================================================================== */
function showToast(text) {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = 'admin-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `${ADMIN_ICONS.check} <span>${text}</span>`;
  toast.style.display = 'flex';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

/* ==========================================================================
   Password Visibility Toggle (Eye Toggle)
   ========================================================================== */
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  const eyeIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeOffIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  btn.innerHTML = isPassword ? eyeOffIcon : eyeIcon;
  btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  btn.title = isPassword ? 'Hide password' : 'Show password';
}

/* ==========================================================================
   Export / Download Updated JSON (For Vercel / GitHub Sync)
   ========================================================================== */
async function exportPortfolioJson() {
  try {
    const data = await PortfolioAPI.getPortfolio();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded portfolio.json');
    alert('Exported portfolio.json!\n\nTo make your updates visible to everyone on Vercel:\n1. Replace the file in portfolio/data/portfolio.json with this downloaded file.\n2. Push to GitHub (git add . && git commit -m "Update portfolio" && git push).\n3. Vercel will automatically redeploy with your latest info!');
  } catch (err) {
    console.error('Export failed:', err);
    alert('Failed to export data: ' + err.message);
  }
}

/* ==========================================================================
   Save & Publish Notification Helper
   ========================================================================== */
function notifySaveResult(actionText, res) {
  if (res?.savedToDatabase) {
    showToast(`${actionText} & updated live database! (Reflecting immediately for visitors)`);
  } else if (res?.dbError) {
    showToast(`${actionText} locally, but database save failed: ${res.dbError}`);
  } else if (res?.publishedToGitHub) {
    showToast(`${actionText} & published to GitHub!`);
  } else if (!PortfolioAPI.isServerActive && !PortfolioAPI.isDatabaseConnected()) {
    showToast(`${actionText} in browser! Connect Supabase in Database tab for live visitor updates.`);
  } else {
    showToast(`${actionText} successfully`);
  }
}

/* ==========================================================================
   Cloud Database (Supabase PostgreSQL) Controller
   ========================================================================== */
function renderDatabaseStatus() {
  const dot = document.getElementById('db-pill-dot');
  const label = document.getElementById('db-header-label');
  const isConnected = DatabaseManager.isConnected();

  if (dot) {
    dot.className = isConnected ? 'cloud-pill-status online' : 'cloud-pill-status';
  }
  if (label) {
    label.textContent = isConnected ? 'Database Live' : 'Database';
  }

  const banner = document.getElementById('db-status-banner');
  const bannerText = document.getElementById('db-status-text');
  if (banner && bannerText) {
    if (isConnected) {
      banner.className = 'sync-status-banner connected';
      bannerText.innerHTML = `<strong>Connected &amp; Permanently Configured:</strong> <code>${escapeHtml(DatabaseManager.getUrl())}</code>. Saved in <code>js/db-config.js</code> so you never need to enter keys again! All edits reflect live for all visitors worldwide.`;
    } else {
      banner.className = 'sync-status-banner disconnected';
      bannerText.innerHTML = `<strong>Database Not Connected:</strong> Enter your Supabase Project URL and Public Anon Key below once. They will be saved permanently to <code>js/db-config.js</code> so you never have to re-enter them!`;
    }
  }
}

function renderDatabaseTab() {
  renderDatabaseStatus();

  const urlInput = document.getElementById('sb-url-input');
  const keyInput = document.getElementById('sb-key-input');
  if (urlInput) urlInput.value = DatabaseManager.getUrl();
  if (keyInput) keyInput.value = DatabaseManager.getKey();

  const repoInput = document.getElementById('gh-repo-input');
  const branchInput = document.getElementById('gh-branch-input');
  const tokenInput = document.getElementById('gh-token-input');
  if (repoInput) repoInput.value = GitHubSync.getRepo();
  if (branchInput) branchInput.value = GitHubSync.getBranch();
  if (tokenInput && GitHubSync.hasToken()) tokenInput.value = GitHubSync.getToken();
}

async function saveDatabaseConfig(e) {
  e.preventDefault();

  const urlInput = document.getElementById('sb-url-input');
  const keyInput = document.getElementById('sb-key-input');
  const alertBox = document.getElementById('db-config-alert');
  const saveBtn = document.getElementById('btn-save-db');

  const rawUrl = urlInput ? urlInput.value.trim() : '';
  const url = DatabaseManager.cleanSupabaseUrl(rawUrl);
  const key = keyInput ? keyInput.value.trim() : '';

  const urlErr = AdminValidators.supabaseUrl(rawUrl, true);
  const keyErr = AdminValidators.token(key, 'Supabase Public Anon Key', 20, true);

  if (urlErr) setAdminFieldError(urlInput, urlErr);
  else clearAdminFieldError(urlInput);

  if (keyErr) setAdminFieldError(keyInput, keyErr);
  else clearAdminFieldError(keyInput);

  if (urlErr || keyErr) {
    if (urlErr && urlInput) urlInput.focus();
    else if (keyErr && keyInput) keyInput.focus();
    showToast('Please provide valid Supabase database configuration.');
    return;
  }

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Verifying database connection...</span>';
    }
    if (alertBox) alertBox.style.display = 'none';

    const test = await DatabaseManager.testConnection(url, key);

    // Save permanently to disk (js/db-config.js) and memory
    await DatabaseManager.saveConfigToServer(url, key);

    if (urlInput) urlInput.value = url;
    if (keyInput) keyInput.value = key;

    renderDatabaseStatus();
    showToast('Connected to Supabase Database & permanently saved!');

    if (!test.tableExists) {
      alert('Connected to Supabase successfully and saved permanently to js/db-config.js!\n\nNote: The "portfolio" table does not exist yet. Click "1-Click Initialize & Seed Database" or run schema.sql in Supabase SQL editor to create it.');
    } else {
      alert('Connected to Supabase successfully!\n\nYour database credentials are now permanently saved to js/db-config.js. You will NEVER need to enter them again! Any updates you save in this Admin Portal will immediately update PostgreSQL and show live for all visitors worldwide.');
    }
  } catch (err) {
    if (alertBox) {
      alertBox.textContent = `Connection failed: ${err.message}`;
      alertBox.style.display = 'block';
    }
    showToast('Failed to connect to database');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>Save &amp; Test Connection</span>';
    }
  }
}

async function seedDatabaseInitialData() {
  if (!DatabaseManager.isConnected()) {
    alert('Please enter and save your Supabase URL and Anon Key first.');
    return;
  }

  const seedBtn = document.getElementById('btn-seed-db');
  try {
    if (seedBtn) {
      seedBtn.disabled = true;
      seedBtn.innerHTML = '<span>Uploading data to database...</span>';
    }

    const localData = await PortfolioAPI.getPortfolio();
    await DatabaseManager.seedDatabase(localData);

    showToast('Database initialized & seeded with portfolio data!');
    alert('Database successfully initialized!\n\nAll current projects, profile details, skills, experience, and education records have been uploaded to your Supabase PostgreSQL database.');
  } catch (err) {
    console.error('Seed error:', err);
    alert('Failed to seed database: ' + err.message + '\n\nMake sure you have run schema.sql in your Supabase SQL Editor first!');
  } finally {
    if (seedBtn) {
      seedBtn.disabled = false;
      seedBtn.innerHTML = '<span>1-Click Initialize &amp; Seed Database</span>';
    }
  }
}

async function disconnectDatabase() {
  if (!confirm('Are you sure you want to disconnect the cloud database? (Site will revert to local storage mode)')) return;
  await DatabaseManager.saveConfigToServer('', '');
  DatabaseManager.setUrl('');
  DatabaseManager.setKey('');
  const urlInput = document.getElementById('sb-url-input');
  const keyInput = document.getElementById('sb-key-input');
  if (urlInput) urlInput.value = '';
  if (keyInput) keyInput.value = '';
  renderDatabaseStatus();
  showToast('Database disconnected');
}

function toggleSqlSchemaModal() {
  const modal = document.getElementById('schema-modal');
  if (modal) {
    modal.classList.toggle('active');
  }
}

function copySqlSchemaText() {
  const pre = document.getElementById('schema-sql-text');
  if (pre) {
    navigator.clipboard.writeText(pre.textContent).then(() => {
      showToast('SQL schema copied to clipboard!');
    }).catch(() => {
      showToast('Please select and copy the SQL text manually.');
    });
  }
}

/* ==========================================================================
   Visitor Inquiries & Messages Controller
   ========================================================================== */
async function updateInquiriesBadge() {
  const badge = document.getElementById('inquiries-badge-count');
  if (!badge) return;

  try {
    const messages = await PortfolioAPI.getMessages();
    const unreadCount = messages.filter(m => !m.is_read).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {
    badge.style.display = 'none';
  }
}

async function renderInquiriesManager() {
  const container = document.getElementById('inquiries-container');
  if (!container) return;

  container.innerHTML = `<div style="text-align:center; padding: 32px; color: var(--text-muted);">Loading inquiries...</div>`;

  const messages = await PortfolioAPI.getMessages();
  await updateInquiriesBadge();

  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
        <p style="color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">No inquiries received yet.</p>
        <p style="color: var(--text-muted); font-size: 0.88rem;">When recruiters or clients send messages from your website contact form, they will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = messages.map(msg => {
    const dateStr = msg.created_at ? new Date(msg.created_at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Recent';

    const isUnread = !msg.is_read;

    return `
      <div class="inquiry-card ${isUnread ? 'unread' : ''}">
        <div class="inquiry-head">
          <div>
            <span class="inquiry-sender">${escapeHtml(msg.name || 'Anonymous Visitor')}</span>
            <a href="mailto:${escapeHtml(msg.email)}?subject=Re:%20Portfolio%20Inquiry" class="inquiry-email">
              &lt;${escapeHtml(msg.email)}&gt;
            </a>
          </div>
          <div class="inquiry-meta">
            <span class="inquiry-badge ${isUnread ? 'new' : 'read'}">${isUnread ? 'New' : 'Read'}</span>
            <span class="inquiry-date">${dateStr}</span>
          </div>
        </div>

        <div class="inquiry-body">${escapeHtml(msg.message || '')}</div>

        <div class="inquiry-actions">
          <a href="mailto:${escapeHtml(msg.email)}?subject=Re:%20Portfolio%20Inquiry&body=${encodeURIComponent('\n\n--- Original Inquiry ---\n' + (msg.message || ''))}" class="btn-inquiry-reply">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Reply via Email</span>
          </a>

          ${isUnread ? `
            <button class="btn-inquiry-action" onclick="markInquiryAsRead('${msg.id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 7 17l-5-5"/>
                <path d="m22 10-7.5 7.5-1.5-1.5"/>
              </svg>
              <span>Mark as Read</span>
            </button>
          ` : ''}

          <button class="btn-inquiry-action" style="color: var(--accent-danger);" onclick="deleteInquiryRecord('${msg.id}')" title="Delete Inquiry">
            ${ADMIN_ICONS.trash}
            <span>Delete</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function markInquiryAsRead(id) {
  await PortfolioAPI.markMessageRead(id);
  renderInquiriesManager();
  showToast('Marked as read');
}

async function deleteInquiryRecord(id) {
  if (!confirm('Are you sure you want to delete this message?')) return;
  await PortfolioAPI.deleteMessage(id);
  renderInquiriesManager();
  showToast('Inquiry deleted');
}

/* ==========================================================================
   Legacy GitHub Cloud Sync Controller
   ========================================================================== */
function renderCloudSyncStatus() {
  renderDatabaseStatus();
}

function renderCloudSyncTab() {
  renderDatabaseTab();
}

async function saveGitHubSyncSettings(e) {
  e.preventDefault();

  const repoInput = document.getElementById('gh-repo-input');
  const branchInput = document.getElementById('gh-branch-input');
  const tokenInput = document.getElementById('gh-token-input');

  const repo = repoInput ? repoInput.value.trim() : '';
  const branch = branchInput ? branchInput.value.trim() : '';
  const token = tokenInput ? tokenInput.value.trim() : '';

  const repoErr = AdminValidators.repo(repo, true);
  const branchErr = AdminValidators.branch(branch, true);
  const tokenErr = AdminValidators.token(token, 'GitHub Personal Access Token', 15, true);

  if (repoErr) setAdminFieldError(repoInput, repoErr);
  else clearAdminFieldError(repoInput);

  if (branchErr) setAdminFieldError(branchInput, branchErr);
  else clearAdminFieldError(branchInput);

  if (tokenErr) setAdminFieldError(tokenInput, tokenErr);
  else clearAdminFieldError(tokenInput);

  if (repoErr || branchErr || tokenErr) {
    if (repoErr && repoInput) repoInput.focus();
    else if (branchErr && branchInput) branchInput.focus();
    else if (tokenErr && tokenInput) tokenInput.focus();
    showToast('Please correct the highlighted GitHub configuration fields.');
    return;
  }

  try {
    await GitHubSync.testConnection(token, repo);
    GitHubSync.setRepo(repo);
    GitHubSync.setBranch(branch);
    GitHubSync.setToken(token);
    showToast(`Connected to GitHub repository ${repo}!`);
    alert(`Connected to GitHub successfully!\n\nRepository: ${repo}\nBranch: ${branch}`);
  } catch (err) {
    alert(`GitHub connection failed: ${err.message}`);
  }
}

async function triggerManualCloudPublish() {
  if (!GitHubSync.hasToken()) {
    alert('Please enter and save your GitHub Personal Access Token first.');
    return;
  }

  try {
    const data = await PortfolioAPI.getPortfolio();
    const result = await GitHubSync.publishPortfolio(data, 'Manual publish from Portfolio Admin Portal');
    showToast('Published commit to GitHub successfully!');
    alert(`Published successfully to GitHub!\nCommit: ${result.commit?.sha?.slice(0, 7) || 'latest'}`);
  } catch (err) {
    alert('Publish failed: ' + err.message);
  }
}

function disconnectGitHubSync() {
  if (!confirm('Are you sure you want to disconnect GitHub Sync?')) return;
  GitHubSync.setToken('');
  const tokenInput = document.getElementById('gh-token-input');
  if (tokenInput) tokenInput.value = '';
  showToast('GitHub Sync disconnected');
}

/* ==========================================================================
   Visitor Inquiries & Messages Controller
   ========================================================================== */
async function updateInquiriesBadge(cachedMessages) {
  const badge = document.getElementById('inquiries-badge-count');
  if (!badge) return;

  try {
    const messages = cachedMessages || await PortfolioAPI.getMessages();
    const unreadCount = Array.isArray(messages) ? messages.filter(m => !m.is_read).length : 0;
    
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  } catch (err) {
    console.warn('Could not update inquiries badge:', err);
    badge.style.display = 'none';
  }
}

async function renderInquiriesManager() {
  const container = document.getElementById('inquiries-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
      <span>Loading inquiries...</span>
    </div>
  `;

  try {
    const messages = await PortfolioAPI.getMessages();
    updateInquiriesBadge(messages);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      container.innerHTML = `
        <div class="admin-card-box" style="text-align: center; padding: 60px 24px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 16px; color: var(--text-muted);">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px; color: var(--text-main);">No Inquiries Yet</h3>
          <p style="color: var(--text-secondary); max-width: 460px; margin: 0 auto; font-size: 0.92rem; line-height: 1.6;">
            When recruiters, companies, or visitors submit the contact form on your live portfolio, their inquiries will appear here in real time.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = messages.map(msg => {
      const isUnread = !msg.is_read;
      const dateStr = msg.created_at ? new Date(msg.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }) : 'Recent';

      const subject = encodeURIComponent(`Re: Inquiry from ${msg.name || 'Visitor'}`);
      const body = encodeURIComponent(`\n\n--- Original Message from ${msg.name || 'Visitor'} ---\n${msg.message || ''}`);
      const replyMailto = `mailto:${encodeURIComponent(msg.email || '')}?subject=${subject}&body=${body}`;

      return `
        <div class="inquiry-card ${isUnread ? 'unread' : ''}" id="inquiry-${msg.id}">
          <div class="inquiry-head">
            <div>
              <span class="inquiry-sender">${escapeHtml(msg.name || 'Anonymous Visitor')}</span>
              <a href="mailto:${escapeHtml(msg.email || '')}" class="inquiry-email">${escapeHtml(msg.email || '')}</a>
            </div>
            <div class="inquiry-meta">
              <span class="inquiry-badge ${isUnread ? 'new' : 'read'}">
                ${!isUnread ? `
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -1px;">
                    <path d="M18 6 7 17l-5-5"/>
                    <path d="m22 10-7.5 7.5-1.5-1.5"/>
                  </svg>
                ` : ''}
                ${isUnread ? 'New' : 'Read'}
              </span>
              <span class="inquiry-date">${dateStr}</span>
            </div>
          </div>
          <div class="inquiry-body">${escapeHtml(msg.message || '')}</div>
          <div class="inquiry-actions">
            <a href="${replyMailto}" class="btn-inquiry-reply" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <span>Reply via Email</span>
            </a>
            ${isUnread ? `
              <button type="button" class="btn-inquiry-action btn-mark-read" onclick="markMessageAsRead('${msg.id}')" title="Mark as Read">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 7 17l-5-5"/>
                  <path d="m22 10-7.5 7.5-1.5-1.5"/>
                </svg>
                <span>Mark as Read</span>
              </button>
            ` : ''}
            <button type="button" class="btn-inquiry-action" style="color: var(--accent-danger);" onclick="removeInquiry('${msg.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error rendering inquiries:', err);
    container.innerHTML = `
      <div class="admin-card-box" style="color: var(--accent-danger); padding: 24px; text-align: center;">
        Failed to load inquiries: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

async function markMessageAsRead(id) {
  try {
    await PortfolioAPI.markMessageRead(id, true);
    showToast('Marked as read');
    await renderInquiriesManager();
  } catch (err) {
    console.error('Error updating message:', err);
    showToast('Failed to mark message as read');
  }
}

async function toggleMessageRead(id, newStatus = true) {
  return markMessageAsRead(id);
}

async function removeInquiry(id) {
  if (!confirm('Are you sure you want to delete this message?')) return;

  try {
    await PortfolioAPI.deleteMessage(id);
    showToast('Message deleted');
    await renderInquiriesManager();
  } catch (err) {
    console.error('Error deleting message:', err);
    showToast('Failed to delete message');
  }
}

