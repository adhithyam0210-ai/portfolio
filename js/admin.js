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
    await PortfolioAPI.updateProject(currentEditingProjectId, projectPayload);
    showToast('Project updated successfully');
  } else {
    await PortfolioAPI.createProject(projectPayload);
    showToast('Project created successfully');
  }

  closeProjectModal();
  renderProjectsList();
}

async function deleteProject(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;

  await PortfolioAPI.deleteProject(id);
  renderProjectsList();
  showToast('Project deleted');
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

  await PortfolioAPI.updateProfile(profilePayload);
  showToast('Profile saved successfully! Redirecting to home page...');

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1100);
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

  await PortfolioAPI.updateExperience(data.experience);
  closeExpModal();
  renderExperienceManager();
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
  await PortfolioAPI.updateEducation(data.education);
  closeEducationModal();
  renderEducationManager();
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
