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

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initTabs();
  initImagePicker();
  initProfileAvatarPicker();
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
  if (target === 'experience') renderExperienceManager();
  if (target === 'projects') renderProjectsList();
  if (target === 'skills') renderSkillsManager();
  if (target === 'profile') renderProfileForm();
  if (target === 'messages') renderInquiriesManager();
  if (target === 'database') renderDatabaseTab();
  if (target === 'cloud-sync') renderDatabaseTab();
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      switchTab(target, true);
    });
  });

  // Check URL hash on initial load (e.g. #skills or #projects)
  const hash = window.location.hash.replace('#', '').trim();
  if (hash) {
    switchTab(hash, false);
  }

  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '').trim();
    if (currentHash) {
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

  const title = document.getElementById('project-title').value.trim();
  const rawCategory = document.getElementById('project-category').value;
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
  const summary = document.getElementById('project-summary').value.trim();
  const techStr = document.getElementById('project-tech').value.trim();
  const liveUrl = document.getElementById('project-live').value.trim();
  const githubUrl = document.getElementById('project-github').value.trim();

  const tech = techStr ? techStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const projectPayload = {
    title,
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

  const avatarImg = document.getElementById('profile-avatar-preview-img');
  const placeholder = document.getElementById('profile-avatar-placeholder');
  const photoName = document.getElementById('profile-photo-name');
  if (p.avatar && avatarImg) {
    avatarImg.src = p.avatar;
    avatarImg.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    if (photoName) photoName.textContent = 'Custom photo set';
  }
}

async function saveProfileForm(e) {
  e.preventDefault();

  const currentData = await PortfolioAPI.getPortfolio();
  const existingAvatar = currentData.profile?.avatar || '';

  const profilePayload = {
    name: document.getElementById('prof-name').value.trim(),
    role: document.getElementById('prof-role').value.trim(),
    location: document.getElementById('prof-location').value.trim(),
    tagline: document.getElementById('prof-tagline').value.trim(),
    bio: document.getElementById('prof-bio').value.trim(),
    email: document.getElementById('prof-email').value.trim(),
    github: document.getElementById('prof-github').value.trim(),
    linkedin: document.getElementById('prof-linkedin').value.trim(),
    avatar: profileAvatarData || existingAvatar
  };

  const res = await PortfolioAPI.updateProfile(profilePayload);
  notifySaveResult('Profile updated', res);
}

/* ==========================================================================
   Skills Manager (CRUD via REST API)
   ========================================================================== */
async function renderSkillsManager() {
  const container = document.getElementById('admin-skills-container');
  if (!container) return;

  const data = await PortfolioAPI.getPortfolio();
  const skills = data.skills || {};

  const categories = [
    { key: 'frontend', title: 'Frontend Engineering' },
    { key: 'backend', title: 'Backend & Databases' },
    { key: 'tools', title: 'Tools & DevOps' }
  ];

  container.innerHTML = categories.map(cat => {
    const items = skills[cat.key]?.items || [];
    return `
      <div class="skill-category-box">
        <h4 class="skill-box-title">${cat.title} (${items.length})</h4>
        <div class="skill-add-row">
          <input type="text" id="add-skill-input-${cat.key}" class="form-input" placeholder="Add skill (e.g. Next.js)..." />
          <button class="btn-primary" onclick="addSkill('${cat.key}')">Add</button>
        </div>
        <div class="skill-tag-list">
          ${items.map((item, index) => `
            <div class="skill-tag-item">
              <span>${item}</span>
              <button class="skill-delete-btn" onclick="deleteSkill('${cat.key}', ${index})" title="Delete Skill">
                ${ADMIN_ICONS.trash}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function addSkill(catKey) {
  const input = document.getElementById(`add-skill-input-${catKey}`);
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const data = await PortfolioAPI.getPortfolio();
  data.skills = data.skills || {};
  data.skills[catKey] = data.skills[catKey] || { title: catKey, items: [] };
  data.skills[catKey].items = data.skills[catKey].items || [];

  data.skills[catKey].items.push(text);
  await PortfolioAPI.updateSkills(data.skills);
  renderSkillsManager();
  showToast(`Added ${text}`);
}

async function deleteSkill(catKey, index) {
  const data = await PortfolioAPI.getPortfolio();
  if (data.skills && data.skills[catKey] && data.skills[catKey].items) {
    const removed = data.skills[catKey].items.splice(index, 1);
    await PortfolioAPI.updateSkills(data.skills);
    renderSkillsManager();
    showToast(`Removed ${removed[0]}`);
  }
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
  document.getElementById('exp-role').value = exp.role || '';
  document.getElementById('exp-company').value = exp.company || '';
  document.getElementById('exp-location').value = exp.location || '';
  document.getElementById('exp-period').value = exp.period || '';
  document.getElementById('exp-desc').value = exp.description || '';
  document.getElementById('exp-bullets').value = (exp.bullets || []).join('\n');

  openExpModal(true);
}

async function saveExperienceForm(e) {
  e.preventDefault();

  const data = await PortfolioAPI.getPortfolio();
  data.experience = data.experience || [];

  const role = document.getElementById('exp-role').value.trim();
  const company = document.getElementById('exp-company').value.trim();
  const location = document.getElementById('exp-location').value.trim();
  const period = document.getElementById('exp-period').value.trim();
  const description = document.getElementById('exp-desc').value.trim();
  const bulletsStr = document.getElementById('exp-bullets').value.trim();

  const bullets = bulletsStr ? bulletsStr.split('\n').map(s => s.trim()).filter(Boolean) : [];
  const entry = { role, company, location, period, description, bullets };

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
  document.getElementById('edu-degree').value = edu.degree || '';
  document.getElementById('edu-institution').value = edu.institution || '';
  document.getElementById('edu-year').value = edu.year || edu.period || '';
  document.getElementById('edu-score').value = edu.score || '';
  document.getElementById('edu-location').value = edu.location || '';

  openEducationModal(true);
}

async function saveEducationForm(e) {
  e.preventDefault();

  const data = await PortfolioAPI.getPortfolio();
  data.education = data.education || [];

  const degree = document.getElementById('edu-degree').value.trim();
  const institution = document.getElementById('edu-institution').value.trim();
  const year = document.getElementById('edu-year').value.trim();
  const score = document.getElementById('edu-score').value.trim();
  const location = document.getElementById('edu-location').value.trim();

  const entry = { degree, institution, year, period: year, score, location };

  if (currentEditingEduIndex !== null && currentEditingEduIndex !== undefined) {
    data.education[currentEditingEduIndex] = entry;
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
   Admin Security & Password Management
   ========================================================================== */
function updateAdminPassword(e) {
  e.preventDefault();

  const currentInput = document.getElementById('current-pass-input');
  const newInput = document.getElementById('new-pass-input');
  const confirmInput = document.getElementById('confirm-pass-input');
  const errorMsg = document.getElementById('password-error-msg');

  const currentPass = currentInput.value.trim();
  const newPass = newInput.value.trim();
  const confirmPass = confirmInput.value.trim();

  function showError(msg) {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
    }
  }

  function hideError() {
    if (errorMsg) {
      errorMsg.textContent = '';
      errorMsg.style.display = 'none';
    }
  }

  hideError();

  // 1. Mandatory fields check
  if (!currentPass || !newPass || !confirmPass) {
    showError('All password fields are mandatory.');
    if (!currentPass) currentInput.focus();
    else if (!newPass) newInput.focus();
    else confirmInput.focus();
    return;
  }

  // 2. Verify previous / current password
  if (currentPass !== getStoredPin()) {
    showError('Current password does not match.');
    currentInput.focus();
    return;
  }

  // 3. Standards for new password:
  // - Minimum 8 characters
  if (newPass.length < 8) {
    showError('New password must be at least 8 characters long.');
    newInput.focus();
    return;
  }

  // - At least 1 uppercase letter
  if (!/[A-Z]/.test(newPass)) {
    showError('New password must contain at least 1 uppercase letter (A-Z).');
    newInput.focus();
    return;
  }

  // - At least 1 number
  if (!/[0-9]/.test(newPass)) {
    showError('New password must contain at least 1 number (0-9).');
    newInput.focus();
    return;
  }

  // - At least 1 special character
  if (!/[^A-Za-z0-9]/.test(newPass)) {
    showError('New password must contain at least 1 special character (e.g. !@#$%^&*).');
    newInput.focus();
    return;
  }

  // 4. Confirm password matches
  if (newPass !== confirmPass) {
    showError('New password and confirmation password do not match.');
    confirmInput.focus();
    return;
  }

  // Save updated password
  localStorage.setItem(PIN_KEY, newPass);
  currentInput.value = '';
  newInput.value = '';
  confirmInput.value = '';

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
      bannerText.innerHTML = `<strong>Connected to Supabase PostgreSQL:</strong> <code>${escapeHtml(DatabaseManager.getUrl())}</code>. Any updates you save in this Admin Portal write directly to the database and reflect live for all visitors worldwide!`;
    } else {
      banner.className = 'sync-status-banner disconnected';
      bannerText.innerHTML = `<strong>Database Not Connected:</strong> You are currently running in local storage mode. Connect your free Supabase database below so updates reflect for other people visiting your site!`;
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

  const url = urlInput.value.trim();
  const key = keyInput.value.trim();

  if (!url || !key) {
    if (alertBox) {
      alertBox.textContent = 'Please enter both Supabase Project URL and Public Anon Key.';
      alertBox.style.display = 'block';
    }
    return;
  }

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Verifying database connection...</span>';
    }
    if (alertBox) alertBox.style.display = 'none';

    const test = await DatabaseManager.testConnection(url, key);

    DatabaseManager.setUrl(url);
    DatabaseManager.setKey(key);

    renderDatabaseStatus();
    showToast('Connected to Supabase Database successfully!');

    if (!test.tableExists) {
      alert('Connected to Supabase successfully!\n\nNote: The "portfolio" table does not exist yet. Click "1-Click Initialize & Seed Database" or run schema.sql in Supabase SQL editor to create it.');
    } else {
      alert('Connected to Supabase successfully!\n\nYour portfolio is now dynamic. Any changes you save in this Admin Portal will immediately update PostgreSQL and show live for all visitors worldwide!');
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

function disconnectDatabase() {
  if (!confirm('Are you sure you want to disconnect the cloud database? (Site will revert to local storage mode)')) return;
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
              ${ADMIN_ICONS.check}
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

  const repo = document.getElementById('gh-repo-input').value.trim();
  const branch = document.getElementById('gh-branch-input').value.trim();
  const token = document.getElementById('gh-token-input').value.trim();

  if (!token) {
    alert('Please enter a GitHub Personal Access Token.');
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

