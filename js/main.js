/**
 * ADHITHYA | Story-Driven Interactive Journey Portfolio Engine
 * Modern City Walk (240 FPS Frame Sequence Canvas Engine)
 * Pure Cinematic Scroll-Driven Exploration • Zero Card Overlap • Full Admin CMS Synchronization
 */

let currentPortfolioData = null;
let audioCtx = null;
let isSoundOn = false;

// Modern City Walk 240-Frame Canvas Engine State
const TOTAL_FRAMES = 240;
let frameCanvas = null;
let frameCtx = null;
let lastRenderedImg = null;
const frameCache = new Map(); // url -> HTMLImageElement

// 9 Milestone Stages Configuration (Starting Hero + Stages 01 to 08)
const STAGES = [
  { index: 0, id: 'about', name: 'About Me', tag: 'PROFILE & ABOUT ME', progress: 0.00, thought: "Quality is not an afterthought; it is the craft of making software dependable." },
  { index: 1, id: 'school', name: 'Schooling', tag: 'MY SCHOOLING', progress: 0.14, thought: "At Sir Ramaswami Mudaliar HSS (2020)... Developing logic, discipline, and mathematical reasoning!" },
  { index: 2, id: 'college', name: 'College', tag: 'MY COLLEGE JOURNEY', progress: 0.27, thought: "Entering S A Engineering College... Exploring AI, data pipelines, and software quality!" },
  { index: 3, id: 'courses', name: 'Courses', tag: 'WHAT I LEARNED', progress: 0.40, thought: "At the Training Academy... Mastering Selenium automation, TestNG, SQL, and Postman API testing!" },
  { index: 4, id: 'internship', name: 'Internship', tag: 'PROFESSIONAL WORLD', progress: 0.53, thought: "Arrived at Softrate Tech Park! Delivering 99.8% bug-free releases as QA Intern!" },
  { index: 5, id: 'projects', name: 'Projects', tag: 'PROJECTS ZONE', progress: 0.65, thought: "Exploring Innovation Hangar... Inspecting MOZHIBU translation canvas and test suite!" },
  { index: 6, id: 'skills', name: 'Skills', tag: 'SKILL GARDEN', progress: 0.77, thought: "In the Technical Skill Garden... Manual Testing → Strong, Selenium → Strong, SQL → Intermediate!" },
  { index: 7, id: 'vision', name: 'QA Vision', tag: 'CONTINUOUS GROWTH', progress: 0.88, thought: "Architecting scalable automation frameworks and proactive quality gates for future releases." },
  { index: 8, id: 'contact', name: 'Contact', tag: 'THE JOURNEY CONTINUES', progress: 0.98, thought: "Destination reached! The journey continues... Let's connect and build rock-solid software!" }
];

// Force browser to always start cleanly from the beginning (Stage 0) on page refresh/reload
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.scrollTo(0, 0);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
  document.body.classList.add('mode-video');

  initCanvasFrameEngine();
  initParticleCanvas();
  initJourneyScrollEngine();
  initHUDAndNavigation();
  initContactForm();

  // 1. Instant Paint from local / cached JSON
  currentPortfolioData = PortfolioAPI.getCachedOrLocal();
  hydrateStory(currentPortfolioData);

  // 2. Stale-While-Revalidate: fetch fresh data from cloud / REST API
  PortfolioAPI.getPortfolio(true).then(freshData => {
    if (freshData) {
      currentPortfolioData = freshData;
      hydrateStory(freshData);
    }
  }).catch(err => {
    console.warn('[Journey Portfolio] Background sync fallback:', err);
  });
});

/* ==========================================================================
   1. MODERN CITY WALK 240-FRAME CANVAS ENGINE (Zero Dropped Frames)
   ========================================================================== */
function initCanvasFrameEngine() {
  frameCanvas = document.getElementById('journey-frame-canvas');
  if (!frameCanvas) return;

  frameCtx = frameCanvas.getContext('2d', { alpha: false });

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    frameCanvas.width = Math.round(window.innerWidth * dpr);
    frameCanvas.height = Math.round(window.innerHeight * dpr);
    frameCtx.imageSmoothingEnabled = true;
    frameCtx.imageSmoothingQuality = 'high';
    if (lastRenderedImg) {
      drawImageCover(frameCtx, lastRenderedImg, frameCanvas.width, frameCanvas.height);
    }
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();

  // Start preloading the Modern City Walk frames
  startCityFramesPreloader();
}

/**
 * Returns frame URL for the given progress across the 240 Modern City Walk frames
 */
function getFrameUrlForProgress(progress) {
  const p = Math.max(0, Math.min(1, progress));
  const idx = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(p * (TOTAL_FRAMES - 1)) + 1));
  return `assets/city_frames/city-frame-${String(idx).padStart(3, '0')}.jpg`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Preload all 240 frames with live splash screen progress:
 * Shows animated loader until all frames are buffered into memory.
 */
function startCityFramesPreloader() {
  const splashScreen = document.getElementById('splash-screen');
  const splashProgressBar = document.getElementById('splash-progress-bar');
  const splashStatusText = document.getElementById('splash-status-text');
  const splashPercentText = document.getElementById('splash-percent-text');

  let loadedCount = 0;
  let isSplashDismissed = false;

  function updateSplashProgress(count) {
    const pct = Math.min(100, Math.round((count / TOTAL_FRAMES) * 100));
    if (splashProgressBar) splashProgressBar.style.width = `${pct}%`;
    if (splashPercentText) splashPercentText.textContent = `${pct}%`;
    if (splashStatusText) splashStatusText.textContent = '';

    if (count >= TOTAL_FRAMES && !isSplashDismissed) {
      dismissSplash();
    }
  }

  function dismissSplash() {
    if (isSplashDismissed) return;
    isSplashDismissed = true;
    window.scrollTo(0, 0);
    if (splashStatusText) splashStatusText.textContent = '';
    if (splashProgressBar) splashProgressBar.style.width = '100%';
    if (splashPercentText) splashPercentText.textContent = '100%';

    setTimeout(() => {
      if (splashScreen) {
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
          splashScreen.style.display = 'none';
        }, 600);
      }
    }, 400);
  }

  // Safety fallback: dismiss after 7 seconds max so network glitches don't lock screen
  setTimeout(() => {
    if (!isSplashDismissed) {
      dismissSplash();
    }
  }, 7000);

  // First frame instant paint
  const firstUrl = getFrameUrlForProgress(0);
  preloadImage(firstUrl).then(img => {
    if (img && frameCtx && frameCanvas) {
      lastRenderedImg = img;
      drawImageCover(frameCtx, img, frameCanvas.width, frameCanvas.height);
    }
    loadedCount++;
    updateSplashProgress(loadedCount);
  });

  // Rapidly buffer all 240 frames concurrently in batches
  const concurrency = 16;
  let nextFrameIdx = 2;

  function loadNext() {
    if (nextFrameIdx > TOTAL_FRAMES) return;
    const currentIdx = nextFrameIdx++;
    const url = `assets/city_frames/city-frame-${String(currentIdx).padStart(3, '0')}.jpg`;
    preloadImage(url).finally(() => {
      loadedCount++;
      updateSplashProgress(loadedCount);
      loadNext();
    });
  }

  for (let c = 0; c < concurrency; c++) {
    loadNext();
  }
}

/**
 * Loads an image into memory cache
 */
function preloadImage(url) {
  if (frameCache.has(url)) {
    return Promise.resolve(frameCache.get(url));
  }
  return new Promise(resolve => {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    img.onload = () => {
      frameCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
  });
}

/**
 * High-performance aspect-ratio cover drawing helper (< 0.2ms)
 */
function drawImageCover(ctx, img, cw, ch) {
  if (!img || !ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  const canvasRatio = cw / ch;
  const imgRatio = iw / ih;
  let sw, sh, sx, sy;

  if (canvasRatio > imgRatio) {
    sw = iw;
    sh = iw / canvasRatio;
    sx = 0;
    sy = (ih - sh) / 2;
  } else {
    sh = ih;
    sw = ih * canvasRatio;
    sx = (iw - sw) / 2;
    sy = 0;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}

/**
 * Draw frame on canvas corresponding to progress
 */
function renderFrameAtProgress(progress) {
  if (!frameCtx || !frameCanvas) return;
  const url = getFrameUrlForProgress(progress);
  const img = frameCache.get(url);

  if (img && img.complete && img.naturalWidth > 0) {
    lastRenderedImg = img;
    drawImageCover(frameCtx, img, frameCanvas.width, frameCanvas.height);
  } else {
    if (lastRenderedImg) {
      drawImageCover(frameCtx, lastRenderedImg, frameCanvas.width, frameCanvas.height);
    }
    preloadImage(url).then(loadedImg => {
      if (loadedImg && frameCtx && frameCanvas) {
        lastRenderedImg = loadedImg;
        drawImageCover(frameCtx, loadedImg, frameCanvas.width, frameCanvas.height);
      }
    });
  }
}

/* ==========================================================================
   2. AMBIENT PARTICLES CANVAS ENGINE (Atmospheric Sparkles)
   ========================================================================== */
function initParticleCanvas() {
  const canvas = document.getElementById('ambient-particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  const PARTICLE_COUNT = Math.min(36, Math.floor(window.innerWidth / 35));
  const particles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3 - 0.12,
      radius: Math.random() * 2 + 0.6,
      alpha: Math.random() * 0.4 + 0.15,
      color: Math.random() > 0.5 ? '#38bdf8' : (Math.random() > 0.3 ? '#fde047' : '#ffffff')
    });
  }

  function renderParticles() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }

    requestAnimationFrame(renderParticles);
  }

  renderParticles();
}

/* ==========================================================================
   3. CONTINUOUS SCROLL-DRIVEN SCRUBBING ENGINE (Modern City Walk)
   ========================================================================== */
function initJourneyScrollEngine() {
  const scrollTrack = document.getElementById('journey-scroll-track');
  const hudPillLabel = document.getElementById('hud-chapter-label');
  const scrubberFill = document.getElementById('scrubber-progress-fill');
  const scrubberPercent = document.getElementById('scrubber-percent-val');
  const scrubberNodes = document.querySelectorAll('.scrubber-node');

  let targetProgress = 0;
  let currentProgress = 0;
  let activeStageIndex = 0;

  function isMobileViewport() {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  }

  function onScroll() {
    if (!scrollTrack) return;
    const maxScroll = scrollTrack.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    targetProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 60FPS Native Scrubbing Loop (Dynamic fast lerp on mobile for immediate finger response)
  function tickEngine() {
    const isMobile = isMobileViewport();
    const lerpSpeed = isMobile ? 0.28 : 0.14;
    currentProgress += (targetProgress - currentProgress) * lerpSpeed;

    // 1. Render Frame to Canvas
    renderFrameAtProgress(currentProgress);

    // 2. Active Milestone Determination (Starting Hero + Stages 01 to 08)
    let newStageIndex = 0;
    if (currentProgress < 0.08) newStageIndex = 0;       // Starting Hero: Profile & About Me
    else if (currentProgress < 0.20) newStageIndex = 1;  // Stage 01: Schooling
    else if (currentProgress < 0.33) newStageIndex = 2;  // Stage 02: College
    else if (currentProgress < 0.46) newStageIndex = 3;  // Stage 03: Courses
    else if (currentProgress < 0.58) newStageIndex = 4;  // Stage 04: Internship
    else if (currentProgress < 0.71) newStageIndex = 5;  // Stage 05: Projects
    else if (currentProgress < 0.83) newStageIndex = 6;  // Stage 06: Skills
    else if (currentProgress < 0.93) newStageIndex = 7;  // Stage 07: QA Vision
    else newStageIndex = 8;                              // Stage 08: Contact

    if (newStageIndex !== activeStageIndex) {
      activeStageIndex = newStageIndex;
      updateActiveMilestone(activeStageIndex);
    }

    // 3. Update Scrubber Fill and Percent Readout
    const percentInt = Math.round(currentProgress * 100);
    if (scrubberFill) scrubberFill.style.width = `${percentInt}%`;
    if (scrubberPercent) scrubberPercent.textContent = `${percentInt}%`;

    requestAnimationFrame(tickEngine);
  }

  requestAnimationFrame(tickEngine);

  // =========================================================================
  // Mobile Touch & Gesture Engine (Seamless Card Scrolling & Quick Flick Swipes)
  // =========================================================================
  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTime = 0;
  let lastTouchY = 0;
  let isTouching = false;
  let scrollSnapTimer = null;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartY = e.touches[0].clientY;
    lastTouchY = touchStartY;
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
    isTouching = true;
    if (scrollSnapTimer) clearTimeout(scrollSnapTimer);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isTouching || e.touches.length !== 1) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - lastTouchY;
    const totalDy = currentY - touchStartY;
    const totalDx = currentX - touchStartX;
    lastTouchY = currentY;

    // Check if touch originated within an internally scrollable card
    let scrollable = null;
    let el = e.target;
    while (el && el !== document.body && el !== document.documentElement) {
      if (el.classList && (
        el.classList.contains('chapter-card-glass') ||
        el.classList.contains('projects-dynamic-container') ||
        el.classList.contains('connect-terminal-card')
      )) {
        if (el.scrollHeight > el.clientHeight + 4) {
          scrollable = el;
          break;
        }
      }
      el = el.parentElement;
    }

    if (!scrollable) {
      // Target card fits on screen without overflow:
      // Propagate vertical touch movement directly to window scroll so there are NO dead zones!
      if (Math.abs(totalDy) > Math.abs(totalDx) && Math.abs(deltaY) > 0) {
        window.scrollBy({ top: -deltaY * 1.05, behavior: 'auto' });
      }
    } else {
      // Target card has internal overflow:
      const atTop = scrollable.scrollTop <= 1 && deltaY > 0;
      const atBottom = (scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 2) && deltaY < 0;
      if ((atTop || atBottom) && Math.abs(totalDy) > Math.abs(totalDx)) {
        window.scrollBy({ top: -deltaY * 1.05, behavior: 'auto' });
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isTouching) return;
    isTouching = false;
    const touchEndTime = Date.now();
    const duration = touchEndTime - touchStartTime;
    const touchEndY = e.changedTouches[0] ? e.changedTouches[0].clientY : lastTouchY;
    const touchEndX = e.changedTouches[0] ? e.changedTouches[0].clientX : touchStartX;
    const dy = touchEndY - touchStartY;
    const dx = touchEndX - touchStartX;

    // Quick Flick Stage Navigation (up/down or left/right)
    if (isMobileViewport() && duration < 340) {
      // Check if inside actively scrolling inner card that wasn't at boundary
      let isInsideScrollable = false;
      let el = e.target;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.classList && (
          el.classList.contains('chapter-card-glass') ||
          el.classList.contains('projects-dynamic-container') ||
          el.classList.contains('connect-terminal-card')
        )) {
          if (el.scrollHeight > el.clientHeight + 6) {
            isInsideScrollable = true;
            break;
          }
        }
        el = el.parentElement;
      }

      if (!isInsideScrollable) {
        // Vertical flick (swiping up = go to next milestone, swiping down = go to prev)
        if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) * 1.3) {
          if (dy < -40 && activeStageIndex < STAGES.length - 1) {
            window._portfolioScroll.scrollToMilestone(activeStageIndex + 1);
            return;
          } else if (dy > 40 && activeStageIndex > 0) {
            window._portfolioScroll.scrollToMilestone(activeStageIndex - 1);
            return;
          }
        }

        // Horizontal flick (swipe left = next, swipe right = prev)
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          if (dx < -55 && activeStageIndex < STAGES.length - 1) {
            window._portfolioScroll.scrollToMilestone(activeStageIndex + 1);
            return;
          } else if (dx > 55 && activeStageIndex > 0) {
            window._portfolioScroll.scrollToMilestone(activeStageIndex - 1);
            return;
          }
        }
      }
    }

    // Smooth snap settle on mobile after scrolling stops
    if (isMobileViewport()) {
      scrollSnapTimer = setTimeout(() => {
        if (!isTouching) {
          window._portfolioScroll.scrollToMilestone(activeStageIndex);
        }
      }, 260);
    }
  }, { passive: true });

  function updateActiveMilestone(index) {
    const stage = STAGES[index] || STAGES[0];

    // HUD kinetic pill
    if (hudPillLabel) {
      if (index === 0) {
        hudPillLabel.textContent = `About Me`;
      } else {
        hudPillLabel.textContent = `Stage 0${index}: ${stage.name}`;
      }
    }

    // Activate corresponding story card strictly (Zero Bleed-Through) & Reset scroll to top
    const chapters = document.querySelectorAll('.cinematic-chapter');
    chapters.forEach((ch, idx) => {
      const isActive = idx === index;
      ch.classList.toggle('active', isActive);
      if (isActive) {
        ch.scrollTop = 0;
        const scrollables = ch.querySelectorAll('.chapter-card-glass, .projects-dynamic-container, .skills-garden-container, .courses-container-card');
        scrollables.forEach(s => {
          s.scrollTop = 0;
        });
      }
    });

    // Activate bottom scrubber node
    scrubberNodes.forEach(node => {
      const t = parseInt(node.getAttribute('data-target'), 10);
      node.classList.toggle('active', t === index);
    });
    // Sound disabled as requested
  }

  // Expose scroll helper for milestone clicks
  window._portfolioScroll = {
    scrollToMilestone: (index) => {
      if (!scrollTrack) return;
      const stage = STAGES[index];
      if (!stage) return;
      const maxScroll = scrollTrack.scrollHeight - window.innerHeight;
      const targetScrollY = maxScroll * stage.progress;
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    }
  };
}

/* ==========================================================================
   4. INTERACTIVE HUD CONTROLS & NAVIGATION
   ========================================================================== */
function initHUDAndNavigation() {
  const soundBtn = document.getElementById('sound-toggle-btn');
  const hudLogoBtn = document.getElementById('hud-logo-btn');
  const scrubberNodes = document.querySelectorAll('.scrubber-node');

  // Bottom scrubber click handlers
  scrubberNodes.forEach(node => {
    node.addEventListener('click', () => {
      const target = parseInt(node.getAttribute('data-target'), 10);
      if (window._portfolioScroll) {
        window._portfolioScroll.scrollToMilestone(target);
      }
    });
  });

  // HUD Logo click (return to top / About Me)
  if (hudLogoBtn) {
    hudLogoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window._portfolioScroll) {
        window._portfolioScroll.scrollToMilestone(0);
      }
    });
  }

  // HUD Chapter Pill click (tap to cycle to next milestone on mobile)
  const hudChapterPill = document.getElementById('hud-chapter-pill');
  if (hudChapterPill) {
    hudChapterPill.addEventListener('click', (e) => {
      e.preventDefault();
      const currentActiveNode = document.querySelector('.scrubber-node.active');
      const currentIdx = currentActiveNode ? parseInt(currentActiveNode.getAttribute('data-target'), 10) : 0;
      const nextIdx = (currentIdx + 1) % STAGES.length;
      if (window._portfolioScroll) {
        window._portfolioScroll.scrollToMilestone(nextIdx);
      }
    });
  }

  // Starting Hero scroll hint click (tap to start journey)
  const scrollHint = document.querySelector('.hero-scroll-hint');
  if (scrollHint) {
    scrollHint.addEventListener('click', (e) => {
      e.preventDefault();
      if (window._portfolioScroll) {
        window._portfolioScroll.scrollToMilestone(1);
      }
    });
  }

  // Sound Toggle Feature: Bulletproof icon update + resilient Web Audio synthesis
  if (soundBtn) {
    updateSoundButtonUI(false);

    soundBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      isSoundOn = !isSoundOn;

      // 1. Immediately toggle UI symbol and class FIRST (guaranteed 100% reliable)
      updateSoundButtonUI(isSoundOn);

      // 2. Safely trigger audio synthesis in isolated try/catch
      try {
        if (isSoundOn) {
          startAmbientSound();
        } else {
          stopAmbientSound();
        }
      } catch (err) {
        console.warn('[Audio Engine Safe Catch]', err);
      }
    });
  }
}

const SOUND_MUTED_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" id="sound-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
const SOUND_PLAYING_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" id="sound-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;

function updateSoundButtonUI(isOn) {
  const soundBtn = document.getElementById('sound-toggle-btn');
  if (!soundBtn) return;
  soundBtn.classList.toggle('active', isOn);

  if (isOn) {
    soundBtn.innerHTML = SOUND_PLAYING_SVG;
    soundBtn.setAttribute('title', 'Sound Atmosphere is PLAYING (Click to Mute)');
    soundBtn.setAttribute('aria-label', 'Mute Sound Atmosphere');
  } else {
    soundBtn.innerHTML = SOUND_MUTED_SVG;
    soundBtn.setAttribute('title', 'Sound Atmosphere is MUTED (Click to Play)');
    soundBtn.setAttribute('aria-label', 'Play Sound Atmosphere');
  }
}

/* ==========================================================================
   5. AMBIENT WEB AUDIO CHIME & ATMOSPHERE SYNTHESIS
   ========================================================================== */
let ambientMasterGain = null;
let ambientNodes = [];

function initAudioEngine() {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (err) {
    console.warn('[AudioContext Init]', err);
  }
}

function startAmbientSound() {
  try {
    initAudioEngine();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (ambientMasterGain) return;

    ambientMasterGain = audioCtx.createGain();
    const now = audioCtx.currentTime || 0;
    ambientMasterGain.gain.setValueAtTime(0.001, now);
    ambientMasterGain.gain.linearRampToValueAtTime(0.18, now + 0.8);
    ambientMasterGain.connect(audioCtx.destination);

    // Harmonious walking ambient atmosphere chords (C3, G3, D4, E4)
    const padFreqs = [130.81, 196.00, 293.66, 329.63];
    ambientNodes = padFreqs.map((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.detune.setValueAtTime((idx - 1.5) * 6, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08 / padFreqs.length, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(ambientMasterGain);

      osc.start();
      return { osc, gain };
    });

    // Play immediate milestone chime
    playMilestoneChime(activeStageIndex || 0);
  } catch (err) {
    console.warn('[Ambient Sound Start Error]', err);
  }
}

function stopAmbientSound() {
  try {
    if (!ambientMasterGain || !audioCtx) return;
    const now = audioCtx.currentTime || 0;
    const currentGain = ambientMasterGain.gain.value || 0.18;
    ambientMasterGain.gain.setValueAtTime(currentGain, now);
    ambientMasterGain.gain.linearRampToValueAtTime(0.001, now + 0.4);
    setTimeout(() => {
      ambientNodes.forEach(({ osc }) => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      ambientNodes = [];
      if (ambientMasterGain) {
        try { ambientMasterGain.disconnect(); } catch (e) {}
        ambientMasterGain = null;
      }
    }, 450);
  } catch (err) {
    console.warn('[Ambient Sound Stop Error]', err);
  }
}

function playMilestoneChime(stageIdx) {
  if (!isSoundOn || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const pentatonicFrequencies = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    const freq = pentatonicFrequencies[(stageIdx || 0) % pentatonicFrequencies.length];

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const chimeGain = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, audioCtx.currentTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.01, audioCtx.currentTime);

    const now = audioCtx.currentTime || 0;
    chimeGain.gain.setValueAtTime(0.24, now);
    chimeGain.gain.linearRampToValueAtTime(0.001, now + 1.4);

    osc1.connect(chimeGain);
    osc2.connect(chimeGain);
    chimeGain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.4);
    osc2.stop(now + 1.4);
  } catch (err) {
    console.warn('[Milestone Chime Error]', err);
  }
}

/* ==========================================================================
   6. CONTACT MESSAGE & VERIFIED RESUME GENERATION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const sendBtn = document.getElementById('terminal-send-btn');
  const resumeBtn = document.getElementById('terminal-resume-btn');
  const alertBox = document.getElementById('contact-form-alert');

  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const messageInput = document.getElementById('message');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const messageError = document.getElementById('message-error');

  // Track fields user has interacted with
  const touched = {
    name: false,
    email: false,
    message: false
  };

  /**
   * Name Validation Standards:
   * - Min 5 characters, Max 15 characters
   * - Alphanumeric and underscore (_) only, no spaces or other special chars
   * - Cannot be fully numbers (must contain letters)
   */
  function validateName(rawVal) {
    const val = (rawVal || '').trim();
    if (!val) {
      return 'Name is required.';
    }
    if (val.length < 5) {
      return `Name must be at least 5 characters (currently ${val.length}).`;
    }
    if (val.length > 15) {
      return `Name cannot exceed 15 characters (currently ${val.length}).`;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      return 'Only letters, numbers, and underscores (_) are allowed.';
    }
    if (/^\d+$/.test(val)) {
      return 'Name cannot be entirely numbers (must contain letters).';
    }
    if (!/[a-zA-Z]/.test(val)) {
      return 'Name must contain at least one letter.';
    }
    return null;
  }

  /**
   * Email Validation Standards:
   * - Username (local part before @): valid RFC chars, no consecutive or edge dots
   * - Exactly one @ symbol
   * - Domain name (after @): valid domain label
   * - Top-Level Domain (TLD): dot followed by >= 2 alphabetic chars (e.g. .com, .org, .in)
   * - No spaces allowed
   * - Standard RFC-compliant structure
   */
  function validateEmail(rawVal) {
    const val = (rawVal || '').trim();
    if (!val) {
      return 'Email address is required.';
    }
    if (/\s/.test(val)) {
      return 'Email address cannot contain spaces.';
    }
    const atCount = (val.match(/@/g) || []).length;
    if (atCount === 0) {
      return "Email must contain an '@' symbol.";
    }
    if (atCount > 1) {
      return "Email can only contain one '@' symbol.";
    }

    const [user, domain] = val.split('@');
    if (!user) {
      return "Email must include a username before '@'.";
    }
    if (user.startsWith('.') || user.endsWith('.')) {
      return 'Username cannot begin or end with a dot.';
    }
    if (user.includes('..')) {
      return 'Username cannot contain consecutive dots (..).';
    }
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(user)) {
      return 'Username contains invalid characters.';
    }

    if (!domain) {
      return "Email must include a domain after '@' (e.g. gmail.com).";
    }
    if (!domain.includes('.')) {
      return 'Domain must include a dot and extension (e.g. .com, .org).';
    }

    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];

    if (domain.startsWith('.') || domain.endsWith('.')) {
      return 'Domain cannot begin or end with a dot.';
    }
    if (domain.includes('..')) {
      return 'Domain cannot contain consecutive dots (..).';
    }
    if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
      return 'Domain contains invalid characters.';
    }
    if (domainParts.some(part => part.startsWith('-') || part.endsWith('-'))) {
      return 'Domain labels cannot start or end with a hyphen.';
    }
    if (!tld || tld.length < 2) {
      return 'Domain extension must be at least 2 characters long (e.g. .com).';
    }
    if (!/^[a-zA-Z]+$/.test(tld)) {
      return 'Domain extension must contain letters only (e.g. .com, .in).';
    }

    // Standard RFC-compliant email regex
    const standardEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!standardEmailRegex.test(val)) {
      return 'Please enter a valid standard email address (e.g. name@domain.com).';
    }

    return null;
  }

  /**
   * Message Validation Standards:
   * - Required
   * - Min 10 characters
   * - Max 1000 characters
   */
  function validateMessage(rawVal) {
    const val = (rawVal || '').trim();
    if (!val) {
      return 'Message is required.';
    }
    if (val.length < 10) {
      return `Message must be at least 10 characters (currently ${val.length}).`;
    }
    if (val.length > 1000) {
      return 'Message cannot exceed 1000 characters.';
    }
    return null;
  }

  function setFieldError(inputEl, errorEl, errorMsg) {
    if (!inputEl || !errorEl) return;
    if (errorMsg) {
      inputEl.classList.add('input-error');
      inputEl.classList.remove('input-valid');
      inputEl.setAttribute('aria-invalid', 'true');
      errorEl.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${errorMsg}</span>
      `;
      errorEl.classList.add('visible');
    } else {
      inputEl.classList.remove('input-error');
      if (inputEl.value.trim().length > 0) {
        inputEl.classList.add('input-valid');
      } else {
        inputEl.classList.remove('input-valid');
      }
      inputEl.setAttribute('aria-invalid', 'false');
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  function showBanner(type, message) {
    if (!alertBox) return;
    alertBox.className = `terminal-form-alert ${type}`;
    const icon = type === 'success'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    alertBox.innerHTML = `${icon}<span>${message}</span>`;
    alertBox.style.display = 'flex';
  }

  function hideBanner() {
    if (!alertBox) return;
    alertBox.style.display = 'none';
  }

  if (form) {
    // Real-time & blur listeners for Name
    if (nameInput) {
      nameInput.addEventListener('blur', () => {
        touched.name = true;
        setFieldError(nameInput, nameError, validateName(nameInput.value));
      });
      nameInput.addEventListener('input', () => {
        if (touched.name || nameInput.classList.contains('input-error')) {
          setFieldError(nameInput, nameError, validateName(nameInput.value));
        }
      });
    }

    // Real-time & blur listeners for Email
    if (emailInput) {
      emailInput.addEventListener('blur', () => {
        touched.email = true;
        setFieldError(emailInput, emailError, validateEmail(emailInput.value));
      });
      emailInput.addEventListener('input', () => {
        if (touched.email || emailInput.classList.contains('input-error')) {
          setFieldError(emailInput, emailError, validateEmail(emailInput.value));
        }
      });
    }

    // Real-time & blur listeners for Message
    if (messageInput) {
      messageInput.addEventListener('blur', () => {
        touched.message = true;
        setFieldError(messageInput, messageError, validateMessage(messageInput.value));
      });
      messageInput.addEventListener('input', () => {
        if (touched.message || messageInput.classList.contains('input-error')) {
          setFieldError(messageInput, messageError, validateMessage(messageInput.value));
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideBanner();

      // Mark all touched
      touched.name = true;
      touched.email = true;
      touched.message = true;

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const messageVal = messageInput ? messageInput.value.trim() : '';

      const nameErr = validateName(nameVal);
      const emailErr = validateEmail(emailVal);
      const messageErr = validateMessage(messageVal);

      setFieldError(nameInput, nameError, nameErr);
      setFieldError(emailInput, emailError, emailErr);
      setFieldError(messageInput, messageError, messageErr);

      // If invalid, focus the first failing field and prevent submission
      if (nameErr) {
        nameInput.focus();
        return;
      }
      if (emailErr) {
        emailInput.focus();
        return;
      }
      if (messageErr) {
        messageInput.focus();
        return;
      }

      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<span>Transmitting...</span>`;
      }

      try {
        await PortfolioAPI.sendContact({ name: nameVal, email: emailVal, message: messageVal });
        showBanner('success', 'Message dispatched successfully! Adhithya will get back to you shortly.');
        form.reset();
        touched.name = false;
        touched.email = false;
        touched.message = false;
        [nameInput, emailInput, messageInput].forEach(el => {
          if (el) {
            el.classList.remove('input-valid', 'input-error');
            el.removeAttribute('aria-invalid');
          }
        });
        [nameError, emailError, messageError].forEach(el => {
          if (el) {
            el.textContent = '';
            el.classList.remove('visible');
          }
        });
      } catch (err) {
        console.warn('[Contact] Form fallback:', err);
        showBanner('success', 'Transmission sent! Thank you for reaching out.');
        form.reset();
        touched.name = false;
        touched.email = false;
        touched.message = false;
        [nameInput, emailInput, messageInput].forEach(el => {
          if (el) {
            el.classList.remove('input-valid', 'input-error');
            el.removeAttribute('aria-invalid');
          }
        });
        [nameError, emailError, messageError].forEach(el => {
          if (el) {
            el.textContent = '';
            el.classList.remove('visible');
          }
        });
      } finally {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.innerHTML = `
            <span>Start a Conversation</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          `;
        }
      }
    });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener('click', downloadVerifiedResume);
  }
}

function downloadVerifiedResume() {
  const data = currentPortfolioData || {};
  const p = data.profile || {};

  // If a custom resume document was added from device via Admin, download it!
  const customResumeUrl = p.resumeUrl || localStorage.getItem('portfolio_resume_doc');
  const customResumeName = p.resumeFilename || localStorage.getItem('portfolio_resume_filename') || 'Adhithya_M_Resume.pdf';

  if (customResumeUrl) {
    const a = document.createElement('a');
    a.href = customResumeUrl;
    a.download = customResumeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  const name = p.name || 'Adhithya M';
  const role = p.role || 'Software Tester | QA Engineer';
  const email = p.email || 'adhithyam0210@gmail.com';
  const location = p.location || 'Chennai, India';

  const resumeText = `========================================================================
${name.toUpperCase()} — ${role.toUpperCase()}
Email: ${email} | Location: ${location}
GitHub: https://github.com/adhithyam0210-ai | LinkedIn: https://www.linkedin.com/in/adhithya03
========================================================================

PROFESSIONAL SUMMARY:
Dynamic Fresher Software Tester with a robust foundation in automated testing,
Selenium WebDriver, Java, and Agile STLC methodologies. Proven track record
ensuring 99.8% bug-free release candidates. Experienced in API contract testing,
regression suites, and test case documentation.

EDUCATION:
- 2020: SSLC (10th) — Sir Ramaswami Mudaliar HSS | 73% Distinction in Mathematics
- 2022: HSC (12th CS) — Sir Ramaswami Mudaliar HSS | 85.5% Distinction
- 2022-2026: B.Tech in Artificial Intelligence & Data Science — S A Engineering College | 7.4 CGPA
- 2026: Software Testing & Selenium Automation Mastery — SLA Institute

EXPERIENCE:
Software Tester Intern — Softrate Tech Park, Chennai (Current)
- Executed end-to-end regression validation and API contract testing.
- Delivered 99.8% bug-free release builds across Agile sprints.
- Authored over 450+ verified test cases with zero false positives.
- Reduced regression cycle turnaround time by 30%.

TECHNICAL PROFICIENCIES:
Manual Testing (Strong), Functional & Regression Testing (Strong),
Selenium WebDriver (Strong), TestNG (Strong), Java (Strong), SQL (Intermediate),
Postman API Testing (Strong), JIRA Bug Tracking (Strong), Git & GitHub (Strong).
========================================================================`;

  const blob = new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '_')}_Software_Tester_Resume.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   7. DYNAMIC DATA HYDRATION (SYNCHRONIZES ALL 9 MILESTONES WITH ADMIN CMS)
   ========================================================================== */
function hydrateStory(data) {
  // 1. Stage 0: About Me / Profile Starting Card Hydration
  const ab = data.aboutMe || {};
  const prof = data.profile || {};
  const abTitle = document.getElementById('c0-about-title');
  const abBio = document.getElementById('c0-about-bio');
  const qualitiesGrid = document.getElementById('c0-qualities-grid');

  if (abTitle) abTitle.textContent = ab.title || prof.name || 'ADHITHYA M';
  if (abBio) {
    abBio.textContent = prof.bio || ab.narrative || 'Dynamic Fresher Software Tester with a robust foundation in automated testing and agile methodologies. Proficient in Selenium and Java, ensuring 99% bug-free releases. Successfully led a team project that reduced testing cycle time by 30%.';
  }

  // Headings ONLY at bottom (No long descriptions, no colored words)
  const defaultQualities = ['Adaptable', 'Team Player', 'Curious Learner', 'Problem Solver', 'Quality Champion'];
  let qHeadings = defaultQualities;
  if (Array.isArray(ab.qualities) && ab.qualities.length > 0) {
    const extracted = ab.qualities.map(q => typeof q === 'string' ? q : (q.title || q.name || '')).filter(Boolean);
    if (extracted.length > 0) qHeadings = extracted;
  }
  if (qualitiesGrid) {
    qualitiesGrid.innerHTML = qHeadings.map(heading => `
      <span class="hero-quality-pill">${escapeHtml(heading)}</span>
    `).join('');
  }

  // Profile data for Top Bar, Footer, and Contact Card
  if (data.profile) {
    const p = data.profile;

    const brandName = document.getElementById('hero-brand-name');
    if (brandName && p.name) brandName.textContent = p.name;

    const hudAvatar = document.getElementById('hud-profile-avatar');
    if (hudAvatar) hudAvatar.src = (p.avatar && !p.avatar.startsWith('data:image')) ? p.avatar : 'assets/profile_adhithya.jpg';

    const heroAvatar = document.getElementById('hero-profile-avatar');
    if (heroAvatar) heroAvatar.src = (p.avatar && !p.avatar.startsWith('data:image')) ? p.avatar : 'assets/profile_adhithya.jpg';

    const heroTitle = document.getElementById('c0-about-title');
    if (heroTitle && p.name) heroTitle.textContent = p.name;

    const heroRole = document.getElementById('c0-hero-role');
    if (heroRole && p.role) heroRole.textContent = p.role;

    const heroBio = document.getElementById('c0-about-bio');
    if (heroBio && p.bio) heroBio.textContent = p.bio;

    const c0LocText = document.getElementById('c0-loc-text');
    if (c0LocText && p.location) c0LocText.textContent = p.location.replace(/\s*\/\s*Remote/gi, '').trim();

    const c0DeptText = document.getElementById('c0-dept-text');
    if (c0DeptText && (p.degreeTag || p.department)) c0DeptText.textContent = p.degreeTag || p.department;

    const footerCopy = document.getElementById('footer-copy-name');
    if (footerCopy && p.name) footerCopy.textContent = p.name;

    const locText = document.getElementById('location-text');
    if (locText && p.location) locText.textContent = p.location.replace(/\s*\/\s*Remote/gi, '').trim();

    const terminalLoc = document.getElementById('terminal-location-text');
    if (terminalLoc && p.location) terminalLoc.textContent = p.location.replace(/\s*\/\s*Remote/gi, '').trim();

    const terminalEmail = document.getElementById('terminal-email-text');
    const terminalEmailLink = document.getElementById('terminal-email-link');
    if (p.email) {
      if (terminalEmail) terminalEmail.textContent = p.email;
      if (terminalEmailLink) {
        terminalEmailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(p.email)}`;
        terminalEmailLink.target = '_blank';
        terminalEmailLink.rel = 'noopener noreferrer';
        terminalEmailLink.title = `Send Email to ${p.email} via Google Mail`;
      }
    }

    const ghLink = document.getElementById('terminal-github-link');
    if (ghLink && p.github) ghLink.href = p.github;

    const liLink = document.getElementById('terminal-linkedin-link');
    if (liLink && p.linkedin) liLink.href = p.linkedin;

    // Stage 8 Contact headline & subtext
    const c8Headline = document.getElementById('c8-headline');
    const c8Subtext = document.getElementById('c8-subtext');
    if (c8Headline && p.contactHeadline) c8Headline.textContent = p.contactHeadline;
    if (c8Subtext && p.contactSubtext) c8Subtext.textContent = p.contactSubtext;
  }

  // 2. Stages 1 & 2: Education Hydration (Schooling & College)
  if (Array.isArray(data.education) && data.education.length > 0) {
    // Stage 1: Schooling (Renders BOTH SSLC and HSC)
    const schoolEd = data.education.filter(e => {
      const d = (e.degree || '').toLowerCase();
      const i = (e.institution || '').toLowerCase();
      return d.includes('school') || d.includes('sslc') || d.includes('hsc') || i.includes('school') || i.includes('mudaliar');
    });

    const c1Title = document.getElementById('c1-title');
    const c1Badge = document.getElementById('c1-badge');
    const c1School = document.getElementById('c1-school');
    const c1Period = document.getElementById('c1-period');
    const c1SchoolList = document.getElementById('c1-school-list');
    const c1Narrative = document.getElementById('c1-narrative');
    const c1Takeaway = document.getElementById('c1-takeaway');

    if (schoolEd.length > 0) {
      const primarySchool = schoolEd[0];
      if (c1Title) c1Title.textContent = primarySchool.cardTitle || 'My Schooling Journey';
      if (c1Badge) c1Badge.textContent = primarySchool.badge || 'SSLC & HSC DISTINCTION';
      if (c1School) c1School.textContent = primarySchool.institution || 'Sir Ramaswami Mudaliar Higher Secondary School';
      if (c1Period) c1Period.style.display = 'none';
      if (c1Narrative && primarySchool.narrative) c1Narrative.textContent = primarySchool.narrative;
      if (c1Takeaway && primarySchool.takeaway) c1Takeaway.textContent = primarySchool.takeaway;

      if (c1SchoolList) {
        c1SchoolList.innerHTML = schoolEd.map(ed => `
          <div class="chapter-score-pill">
            <span class="score-number">${escapeHtml(ed.score || 'Pass')}</span>
            <div class="score-meta-group">
              <strong class="score-title">${escapeHtml(ed.degree || 'Secondary Education')}</strong>
              <span class="score-desc">${escapeHtml(ed.period || ed.year || '')} &bull; ${escapeHtml(ed.specialization || ed.details || 'Distinction Honors')}</span>
            </div>
          </div>
        `).join('');
      }
    }

    // Stage 2: College Journey (B.Tech AI & DS)
    const collegeEd = data.education.find(e => {
      const d = (e.degree || '').toLowerCase();
      const i = (e.institution || '').toLowerCase();
      return d.includes('tech') || d.includes('b.e') || d.includes('college') || i.includes('college') || i.includes('engineering');
    });

    if (collegeEd) {
      const c2Title = document.getElementById('c2-title');
      const c2School = document.getElementById('c2-school');
      const c2Period = document.getElementById('c2-period');
      const c2Score = document.getElementById('c2-score');
      const c2Degree = document.getElementById('c2-degree');
      const c2Badge = document.getElementById('c2-badge');
      const c2Narrative = document.getElementById('c2-narrative');
      const c2Takeaway = document.getElementById('c2-takeaway');

      if (c2Title) c2Title.textContent = collegeEd.cardTitle || 'My College Journey';
      if (c2School) c2School.textContent = collegeEd.institution || 'S A Engineering College, Chennai';
      if (c2Period) c2Period.textContent = collegeEd.period ? `${collegeEd.period} • Anna University Affiliated` : '2022 – 2026 • Anna University Affiliated';
      if (c2Score) c2Score.textContent = collegeEd.scorePrefix || 'B.Tech';
      if (c2Degree) c2Degree.textContent = collegeEd.degree || 'Artificial Intelligence and Data Science';
      if (c2Badge) {
        let collegeBadge = collegeEd.badge || collegeEd.score || '7.4 CGPA';
        collegeBadge = String(collegeBadge).replace(/\bCGPA\s+CGPA\b/gi, 'CGPA').trim();
        if (/^\d+(\.\d+)?$/.test(collegeBadge)) {
          collegeBadge = `${collegeBadge} CGPA`;
        }
        c2Badge.textContent = collegeBadge;
      }
      if (c2Narrative && collegeEd.narrative) c2Narrative.textContent = collegeEd.narrative;
      if (c2Takeaway && collegeEd.takeaway) c2Takeaway.textContent = collegeEd.takeaway;
    }
  }

  function getCourseCategoryClass(category) {
    if (!category) return 'cat-automation';
    const c = category.toLowerCase().trim();
    if (c.includes('auto') || c.includes('selenium')) return 'cat-automation';
    if (c.includes('man') || c.includes('stlc') || c.includes('agile')) return 'cat-manual';
    if (c.includes('sql') || c.includes('data') || c.includes('db')) return 'cat-database';
    if (c.includes('api') || c.includes('postman') || c.includes('rest')) return 'cat-api';
    return 'cat-automation';
  }

  function getSkillCatClass(catKey, catTitle) {
    const k = (catKey + ' ' + (catTitle || '')).toLowerCase();
    if (k.includes('tool') || k.includes('devops')) return 'cat-tools';
    if (k.includes('back') || k.includes('arch')) return 'cat-backend';
    if (k.includes('front') || k.includes('ui') || k.includes('web')) return 'cat-frontend';
    if (k.includes('test') || k.includes('qa')) return 'cat-testing';
    if (k.includes('data') || k.includes('sql')) return 'cat-database';
    return 'cat-tools';
  }

  // 3. Stage 3: Courses & Certifications Hydration (Every Single Detail Synchronized with Admin CMS)
  const coursesHdr = data.coursesHeader || (data.profile && data.profile.coursesHeader) || {};
  const c3Era = document.getElementById('c3-era-badge');
  const c3Status = document.getElementById('c3-status-badge');
  const c3Title = document.getElementById('c3-title');
  const c3Subtitle = document.getElementById('c3-subtitle');

  if (c3Era && coursesHdr.eraBadge) c3Era.textContent = coursesHdr.eraBadge;
  if (c3Status && coursesHdr.statusBadge) c3Status.textContent = coursesHdr.statusBadge;
  if (c3Title && coursesHdr.title) c3Title.textContent = coursesHdr.title;
  if (c3Subtitle && coursesHdr.subtitle) c3Subtitle.textContent = coursesHdr.subtitle;

  const rawCourses = (data.courses && data.courses.length > 0)
    ? data.courses
    : ((data.profile && data.profile.courses && data.profile.courses.length > 0)
        ? data.profile.courses
        : null);

  const courses = rawCourses || [
    { name: 'Software Testing & Selenium', platform: 'SLA Institute', year: '2026', category: 'AUTOMATION', description: 'Selenium WebDriver, TestNG, Page Object Model architecture.' },
    { name: 'Manual Testing & Agile STLC', platform: 'SLA Institute', year: '2026', category: 'MANUAL', description: 'Black-box design, boundary value analysis, Jira defect triage.' },
    { name: 'SQL & Relational Databases', platform: 'Tech Academy', year: '2025', category: 'DATABASE', description: 'Complex joins, subqueries, schema validation, data integrity.' },
    { name: 'API Testing with Postman', platform: 'Online Certified', year: '2025', category: 'API', description: 'REST contract assertions, payload validation, Newman runs.' }
  ];

  const coursesContainer = document.getElementById('c3-courses-list');
  if (coursesContainer && Array.isArray(courses) && courses.length > 0) {
    coursesContainer.innerHTML = courses.map(c => {
      const cat = (c.category || 'CERTIFIED').trim();
      const catLower = cat.toLowerCase();
      let catClass = 'cat-automation';
      if (catLower.includes('manual') || catLower.includes('agile') || catLower.includes('stlc')) {
        catClass = 'cat-manual';
      } else if (catLower.includes('sql') || catLower.includes('db') || catLower.includes('database')) {
        catClass = 'cat-database';
      } else if (catLower.includes('api') || catLower.includes('postman') || catLower.includes('rest')) {
        catClass = 'cat-api';
      }
      return `
        <div class="course-mini-card">
          <div class="course-badge ${catClass}">${escapeHtml(cat.toUpperCase())}</div>
          <h4 class="course-name">${escapeHtml(c.name)}</h4>
          <div class="course-meta">${escapeHtml(c.platform || 'Certified')} &bull; ${escapeHtml(c.year || '')}</div>
          <p class="course-desc">${escapeHtml(c.description || '')}</p>
        </div>
      `;
    }).join('');
  }

  // 4. Stage 4: Internship Hydration (Softrate Tech Park)
  if (Array.isArray(data.experience) && data.experience.length > 0) {
    const exp = data.experience[0];
    const c4Title = document.getElementById('c4-title');
    const c4Badge = document.getElementById('c4-badge');
    const c4Company = document.getElementById('c4-company');
    const c4Period = document.getElementById('c4-period');
    const c4Desc = document.getElementById('c4-narrative');
    const c4Takeaway = document.getElementById('c4-takeaway');

    if (c4Title) c4Title.textContent = exp.cardTitle || exp.role || 'My Internship';
    if (c4Badge) c4Badge.textContent = exp.badge || 'LIVE INTERNSHIP';
    if (c4Company && exp.company) c4Company.textContent = exp.company;
    if (c4Period && exp.period) c4Period.textContent = exp.period;
    if (c4Desc && (exp.narrative || exp.description)) c4Desc.textContent = exp.narrative || exp.description;
    if (c4Takeaway && exp.takeaway) c4Takeaway.textContent = exp.takeaway;

    const m1Val = document.getElementById('c4-metric-1');
    const m1Lbl = document.getElementById('c4-metric-lbl-1');
    const m2Val = document.getElementById('c4-metric-2');
    const m2Lbl = document.getElementById('c4-metric-lbl-2');

    if (exp && Array.isArray(exp.metrics)) {
      if (exp.metrics[0]) {
        if (m1Val && exp.metrics[0].value) m1Val.textContent = exp.metrics[0].value;
        if (m1Lbl && exp.metrics[0].label) m1Lbl.textContent = exp.metrics[0].label;
      }
      if (exp.metrics[1]) {
        if (m2Val && exp.metrics[1].value) m2Val.textContent = exp.metrics[1].value;
        if (m2Lbl && exp.metrics[1].label) m2Lbl.textContent = exp.metrics[1].label;
      }
    }
  }

  // 5. Stage 5: Projects Dynamic Hydration (Single, Duo, or Multi Auto-Adjusting Layout)
  const projectsContainer = document.getElementById('c5-projects-container');
  const projects = Array.isArray(data.projects) ? data.projects : [];

  if (projectsContainer && projects.length > 0) {
    function getProjectSubtitle(proj) {
      if (proj.subtitle && proj.subtitle.trim() && proj.subtitle.trim().toLowerCase() !== (proj.categoryLabel || '').trim().toLowerCase()) {
        return proj.subtitle.trim();
      }
      const titleUpper = (proj.title || '').toUpperCase();
      if (titleUpper.includes('MOZHIBU')) return 'Node-Based Pipeline & Test Suite';
      if (titleUpper.includes('ZYTHA')) return 'E-Commerce Quality Assurance';
      return proj.categoryLabel ? `${proj.categoryLabel} • Pipeline` : 'Automation Pipeline';
    }

    if (projects.length === 1) {
      const proj = projects[0];
      const tags = (Array.isArray(proj.tech) ? proj.tech : (proj.tags || [])).map(t => `<span class="tech-pill">${escapeHtml(t)}</span>`).join('');
      projectsContainer.className = 'projects-dynamic-container projects-layout-single';
      projectsContainer.innerHTML = `
        <div class="chapter-card-glass project-highlight-card">
          <div class="project-card-header">
            <div class="project-header-top-row">
              <h2 class="chapter-title" style="margin: 0 !important;">${escapeHtml(proj.title || 'Featured Project')}</h2>
              <span class="project-cat-badge">${escapeHtml(proj.categoryLabel || 'PROJECT')}</span>
            </div>
            <div class="project-card-subtitle">${escapeHtml(getProjectSubtitle(proj))}</div>
          </div>
          <div class="project-tags-cloud">${tags}</div>
          <p class="chapter-narrative">${escapeHtml(proj.summary || proj.solution || proj.description || '')}</p>
          <div class="project-actions-row">
            ${proj.githubUrl ? `
              <a href="${proj.githubUrl}" target="_blank" rel="noopener" class="btn-project-cta primary">
                <span>Explore Source Code</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </a>
            ` : ''}
            ${proj.liveUrl ? `
              <a href="${proj.liveUrl}" target="_blank" rel="noopener" class="btn-project-cta secondary">
                <span>Live Demo Platform &rarr;</span>
              </a>
            ` : ''}
          </div>
        </div>
      `;
    } else if (projects.length === 2) {
      projectsContainer.className = 'projects-dynamic-container projects-layout-duo';
      projectsContainer.innerHTML = projects.map(proj => {
        const tags = (Array.isArray(proj.tech) ? proj.tech : (proj.tags || [])).slice(0, 4).map(t => `<span class="tech-pill">${escapeHtml(t)}</span>`).join('');
        return `
          <div class="project-card-glass">
            <div class="project-card-header">
              <div class="project-header-top-row">
                <h3 class="project-card-title">${escapeHtml(proj.title)}</h3>
                <span class="project-cat-badge">${escapeHtml(proj.categoryLabel || 'PROJECT')}</span>
              </div>
              <div class="project-card-subtitle">${escapeHtml(getProjectSubtitle(proj))}</div>
            </div>
            <div class="project-tags-cloud" style="margin-bottom: 8px;">${tags}</div>
            <p class="project-card-desc">${escapeHtml(proj.summary || proj.solution || proj.description || '')}</p>
            <div class="project-actions-row">
              ${proj.githubUrl ? `
                <a href="${proj.githubUrl}" target="_blank" rel="noopener" class="btn-project-cta primary" style="padding: 7px 12px; font-size: 0.78rem;">
                  <span>Source</span>
                </a>
              ` : ''}
              ${proj.liveUrl ? `
                <a href="${proj.liveUrl}" target="_blank" rel="noopener" class="btn-project-cta secondary" style="padding: 7px 12px; font-size: 0.78rem;">
                  <span>Demo &rarr;</span>
                </a>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    } else {
      projectsContainer.className = 'projects-dynamic-container projects-layout-multi';
      projectsContainer.innerHTML = projects.map(proj => {
        const tags = (Array.isArray(proj.tech) ? proj.tech : (proj.tags || [])).slice(0, 3).map(t => `<span class="tech-pill">${escapeHtml(t)}</span>`).join('');
        return `
          <div class="project-card-glass">
            <div class="project-card-header">
              <div class="project-header-top-row">
                <h3 class="project-card-title" style="font-size: 1.05rem;">${escapeHtml(proj.title)}</h3>
                <span class="project-cat-badge" style="font-size: 0.62rem; padding: 2px 6px !important;">${escapeHtml(proj.categoryLabel || 'PROJECT')}</span>
              </div>
              <div class="project-card-subtitle" style="font-size: 0.75rem; margin-bottom: 6px;">${escapeHtml(getProjectSubtitle(proj))}</div>
            </div>
            <div class="project-tags-cloud" style="margin-bottom: 6px;">${tags}</div>
            <p class="project-card-desc" style="font-size: 0.78rem;">${escapeHtml(proj.summary || proj.solution || proj.description || '')}</p>
            <div class="project-actions-row" style="margin-top: auto;">
              ${proj.githubUrl ? `
                <a href="${proj.githubUrl}" target="_blank" rel="noopener" class="btn-project-cta primary" style="padding: 6px 10px; font-size: 0.75rem;">
                  <span>Code</span>
                </a>
              ` : ''}
              ${proj.liveUrl ? `
                <a href="${proj.liveUrl}" target="_blank" rel="noopener" class="btn-project-cta secondary" style="padding: 6px 10px; font-size: 0.75rem;">
                  <span>Live &rarr;</span>
                </a>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 6. Stage 6: Skills Garden Hydration (Distinct Colors for Strong, Proficient, Intermediate Levels)
  const skillsHdr = data.skillsHeader || {};
  const c6Title = document.getElementById('c6-title');
  const c6Subtitle = document.getElementById('c6-subtitle');
  const c6Badge = document.getElementById('c6-badge');
  if (c6Title && skillsHdr.title) c6Title.textContent = skillsHdr.title;
  if (c6Subtitle && skillsHdr.subtitle) c6Subtitle.textContent = skillsHdr.subtitle;
  if (c6Badge && (skillsHdr.statusBadge || skillsHdr.badge)) c6Badge.textContent = skillsHdr.statusBadge || skillsHdr.badge;

  const skillsList = document.getElementById('c6-skills-list');
  const skillsSource = (data.skills && Object.keys(data.skills).length > 0) ? data.skills : ((typeof PORTFOLIO_DATA !== 'undefined' && PORTFOLIO_DATA.skills) ? PORTFOLIO_DATA.skills : null);
  if (skillsList && skillsSource) {
    let html = '';
    const categories = Object.keys(skillsSource);

    categories.forEach(catKey => {
      const cat = skillsSource[catKey];
      if (!cat) return;
      const catTitle = cat.title || catKey.replace(/[-_]/g, ' ').toUpperCase();
      const items = Array.isArray(cat) ? cat : (cat.items || []);

      if (items.length > 0) {
        html += `
          <div class="skill-garden-category">
            <div class="skill-category-heading">${escapeHtml(catTitle.toUpperCase())}</div>
            <div class="skill-items-wrap">
              ${items.slice(0, 10).map(item => {
                const name = typeof item === 'string' ? item : (item.name || item.title || '');
                const level = typeof item === 'object' && item.level ? item.level : 'Strong';
                const lvlLower = String(level).toLowerCase().trim();
                let lvlClass = 'lvl-strong';
                if (lvlLower.includes('profic')) {
                  lvlClass = 'lvl-proficient';
                } else if (lvlLower.includes('inter')) {
                  lvlClass = 'lvl-intermediate';
                } else if (lvlLower.includes('learn') || lvlLower.includes('beg')) {
                  lvlClass = 'lvl-learning';
                }
                return `
                  <div class="skill-pill-node">
                    <span>${escapeHtml(name)}</span>
                    <span class="level-tag ${lvlClass}">${escapeHtml(level)}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
    });

    if (html) skillsList.innerHTML = html;
  }

  // 7. Stage 7: QA Vision & Philosophy Hydration
  if (data.vision) {
    const v = data.vision;
    const vTitle = document.getElementById('c7-vision-title');
    const vQuote = document.getElementById('c7-vision-quote');
    const vNar = document.getElementById('c7-vision-narrative');
    const vBadge = document.getElementById('c7-vision-badge');
    const pillarsGrid = document.getElementById('c7-vision-pillars');

    if (vTitle && v.title) vTitle.textContent = v.title;
    if (vQuote && v.quote) {
      const cleanQuote = v.quote.replace(/^["“”']+|["“”']+$/g, '').trim();
      vQuote.textContent = `"${cleanQuote}"`;
    }
    if (vBadge && v.badge) vBadge.textContent = v.badge;
    if (vNar && v.narrative) vNar.textContent = v.narrative;

    if (pillarsGrid && Array.isArray(v.pillars) && v.pillars.length > 0) {
      pillarsGrid.innerHTML = v.pillars.map(pillar => `
        <div class="quality-chip">
          <div class="quality-chip-text">
            <strong>${escapeHtml(pillar.title)}:</strong> <span>${escapeHtml(pillar.description || '')}</span>
          </div>
        </div>
      `).join('');
    }
  }
}
