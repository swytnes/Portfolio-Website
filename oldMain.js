import {
  mount,
  start,
  setDesiredCamera,
  setCameraTarget,
  setWorldTransform,
  setWorldSpin,
  addToWorld,
  removeAndDispose,
  world,
  modelsGroup,
  addToModels,
  clearModels,
  animateHelpersOpacity,
  animateGridsOpacity,
} from './threeScene.js';

import { camPresets } from './cameraPresets.js';
import { initScrollSnap } from '../scroll.js';
import { unload as unloadLoaderDemo } from '../loaders/loaderDemo.js'; // Added import for unload
import { projects as projectsData } from '../projectsSection/projectsData.js'; // Updated import for projectsData

// --- smooth transition state ---
const originalOpacityMap = new WeakMap();
let lastCamPos = [0, 0, 5];
let lastTarget = [0, 0, 0];

let animToken = 0;
let fadeToken = 0;

// ---------- helpers ----------
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function animateVector3(current, target, duration, onUpdate, onComplete) {
  const myToken = animToken;
  const start = { x: current[0], y: current[1], z: current[2] };
  const end = { x: target[0], y: target[1], z: target[2] };
  const startTime = performance.now();

  function animate() {
    if (myToken !== animToken) return;
    const now = performance.now();
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);

    const x = lerp(start.x, end.x, t);
    const y = lerp(start.y, end.y, t);
    const z = lerp(start.z, end.z, t);

    onUpdate([x, y, z]);

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      if (onComplete) onComplete();
    }
  }

  animate();
}

function animateWorldOpacity(targetVisible, duration = 1000) {
  const myToken = ++fadeToken;
  if (targetVisible) {
    world.visible = true;
  }

  const mats = [];
  world.traverse((child) => {
    const material = child.material;
    if (!material) return;

    const pushMat = (mat) => {
      if (mat && 'opacity' in mat) {
        if (!originalOpacityMap.has(mat)) {
          originalOpacityMap.set(mat, typeof mat.opacity === 'number' ? mat.opacity : 1);
        }
        mat.transparent = true;
        mat.depthWrite = false;
        mats.push(mat);
      }
    };

    if (Array.isArray(material)) {
      material.forEach(pushMat);
    } else {
      pushMat(material);
    }
  });

  const startOpacities = mats.map((m) => m.opacity);
  const endOpacities = mats.map((m) => (targetVisible ? originalOpacityMap.get(m) ?? 1 : 0));
  const startTime = performance.now();

  function animate() {
    if (myToken !== fadeToken) return;
    const now = performance.now();
    const t = Math.min((now - startTime) / duration, 1);
    for (let i = 0; i < mats.length; i++) {
      mats[i].opacity = startOpacities[i] + (endOpacities[i] - startOpacities[i]) * t;
    }
    if (t < 1) {
      requestAnimationFrame(animate);
    } else if (!targetVisible) {
      world.visible = false;
    }
  }

  animate();
}

// New helper function to fade opacity of all materials in an object
function fadeObject(obj, targetOpacity, duration = 800, onComplete) {
  if (!obj) {
    if (onComplete) onComplete();
    return;
  }
  const mats = [];
  obj.traverse((child) => {
    const material = child.material;
    if (!material) return;

    const pushMat = (mat) => {
      if (mat && 'opacity' in mat) {
        if (!originalOpacityMap.has(mat)) {
          originalOpacityMap.set(mat, typeof mat.opacity === 'number' ? mat.opacity : 1);
        }
        mat.transparent = true;
        mat.depthWrite = false;
        mats.push(mat);
      }
    };

    if (Array.isArray(material)) {
      material.forEach(pushMat);
    } else {
      pushMat(material);
    }
  });

  const startOpacities = mats.map(m => m.opacity);
  const endOpacities = mats.map(m => targetOpacity);
  const startTime = performance.now();

  function animate() {
    const now = performance.now();
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    for (let i = 0; i < mats.length; i++) {
      mats[i].opacity = lerp(startOpacities[i], endOpacities[i], t);
    }
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      if (onComplete) onComplete();
    }
  }

  animate();
}

// ---------- Three.js layer ----------
const container = document.getElementById('three-container');
if (!container) {
  console.warn('[main] #three-container not found');
} else {
  mount(container);
  start();
}

// ---------- app state ----------
const mediaReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
let prefersReduced      = !!mediaReduced?.matches;
let lastPresetIndex     = 0;
let activeSectionId     = null;
let currentProjectGroup = null;
let currentCertGroup    = null; // now used for both certificates and pdfs
// let currentPdfGroup     = null; // removed: unified with currentCertGroup
let modelActive         = false;

// ---------- helpers ----------
function applyPreset(index) {
  animToken++;
  fadeToken++; // Increment fadeToken to cancel previous fades
  const myFadeToken = fadeToken;
  const p = camPresets[index] ?? camPresets[0];

  // Fall back safely if world.camera/controls aren’t ready yet
  const fromPos = (world?.camera?.position?.toArray?.()) || lastCamPos || p.pos;
  const fromTarget = (world?.controls?.target?.toArray?.()) || lastTarget || (p.target ?? [0, 0, 0]);

  if (prefersReduced) {
    setDesiredCamera(p.pos);
    setCameraTarget(p.target ?? [0, 0, 0]);
    setWorldTransform(p.world ?? { pos: [0, 0, 0], yaw: 0, scale: 1 });
    lastCamPos = p.pos.slice();
    lastTarget = (p.target ?? [0, 0, 0]).slice();
  } else {
    // animate camera position
    animateVector3(fromPos, p.pos, 1000, (pos) => {
      setDesiredCamera(pos);
      lastCamPos = pos.slice();
    });

    // animate camera target
    animateVector3(fromTarget, p.target ?? [0, 0, 0], 1000, (target) => {
      setCameraTarget(target);
      lastTarget = target.slice();
    });

    // world transform still applied immediately (yaw/scale/pos)
    setWorldTransform(p.world ?? { pos: [0, 0, 0], yaw: 0, scale: 1 });
  }

  setWorldSpin(!prefersReduced && !!p.rotate, 0.001);

  // Unified fade logic with guards to prevent duplicate fades
  const fadeDuration = 1000;
  const shouldWorldBeVisible   = (p.showWorld ?? true) && !modelActive;
  const shouldHelpersBeVisible = (p.showHelpers ?? true) && !modelActive;

  // Wrap fade functions with fade token logic
  if (world.visible !== shouldWorldBeVisible) {
    (function() {
      const localToken = myFadeToken;
      animateWorldOpacity = (function(orig) {
        return function(targetVisible, duration) {
          const fadeCallToken = ++fadeToken;
          const mats = [];
          if (targetVisible) world.visible = true;
          world.traverse((child) => {
            const material = child.material;
            if (!material) return;
            const pushMat = (mat) => {
              if (mat && 'opacity' in mat) {
                if (!originalOpacityMap.has(mat)) {
                  originalOpacityMap.set(mat, typeof mat.opacity === 'number' ? mat.opacity : 1);
                }
                mat.transparent = true;
                mat.depthWrite = false;
                mats.push(mat);
              }
            };
            if (Array.isArray(material)) material.forEach(pushMat);
            else pushMat(material);
          });
          const startOpacities = mats.map((m) => m.opacity);
          const endOpacities = mats.map((m) => (targetVisible ? originalOpacityMap.get(m) ?? 1 : 0));
          const startTime = performance.now();
          function animate() {
            if (fadeCallToken !== fadeToken) return;
            const now = performance.now();
            const t = Math.min((now - startTime) / duration, 1);
            for (let i = 0; i < mats.length; i++) {
              mats[i].opacity = startOpacities[i] + (endOpacities[i] - startOpacities[i]) * t;
            }
            if (t < 1) {
              requestAnimationFrame(animate);
            } else if (!targetVisible) {
              world.visible = false;
            }
          }
          animate();
        };
      })(animateWorldOpacity);
      animateWorldOpacity(shouldWorldBeVisible, fadeDuration);
    })();
  }
  if (true) {
    (function() {
      const localToken = myFadeToken;
      animateGridsOpacity = (function(orig) {
        return function(targetVisible, duration) {
          const fadeCallToken = ++fadeToken;
          orig(targetVisible, duration, fadeCallToken);
        };
      })(animateGridsOpacity);
      animateGridsOpacity(shouldWorldBeVisible, fadeDuration);
    })();
  }
  if (true) {
    (function() {
      const localToken = myFadeToken;
      animateHelpersOpacity = (function(orig) {
        return function(targetVisible, duration) {
          const fadeCallToken = ++fadeToken;
          orig(targetVisible, duration, fadeCallToken);
        };
      })(animateHelpersOpacity);
      animateHelpersOpacity(shouldHelpersBeVisible, fadeDuration);
    })();
  }

  lastPresetIndex = index;
}

function safeApplyPreset(index) {
  applyPreset(index);
}

// universal dynamic load helper
async function loadWithCompat(mod, section, item) {
  if (typeof mod.load !== 'function') {
    throw new Error('Loader module has no load() export');
  }

  let obj = null;

  try {
    const maybe = await mod.load(item);
    if (maybe) obj = maybe;
  } catch (e) { /* try fallback */ }

  if (!obj) {
    try {
      obj = await mod.load(addToModels, item?.opts);
    } catch (e2) {
      throw e2;
    }
  }

  if (!obj && typeof mod.getCurrent === 'function') {
    obj = mod.getCurrent();
  }

  if (obj && typeof mod.unload === 'function' && !obj.__cleanup) {
    obj.__cleanup = () => {
      try { mod.unload(); } catch {}
    };
  }

  if (obj && !modelsGroup.children.includes(obj)) {
    addToModels(obj);
  }

  return obj;
}

function cleanupIfNeeded(kind) {
  if (kind === 'projects' && currentProjectGroup) {
    fadeObject(currentProjectGroup, 0, 800, () => {
      currentProjectGroup.__cleanup?.();
      removeAndDispose(currentProjectGroup);
      currentProjectGroup = null;
      modelActive = false;
    });
  }
  if (kind === 'certificates' && currentCertGroup) {
    fadeObject(currentCertGroup, 0, 800, () => {
      currentCertGroup.__cleanup?.();
      removeAndDispose(currentCertGroup);
      currentCertGroup = null;
      modelActive = false;
    });
  }
  if (!currentProjectGroup && !currentCertGroup && activeSectionId === 'hero') {
    animateWorldOpacity(true, 1000);
    animateGridsOpacity(true, 1000);
    animateHelpersOpacity(true, 1000);
  }
}

// ---------- Section snap scrolling ----------
const sections = Array.from(document.querySelectorAll('main section[id]'));
console.log("Tracking sections:", sections.map(s => s.id));

let __scrollSnapTimeout;
initScrollSnap({
  sections,
  onSectionChange: async (visibleIndex, sectionEl) => {
    clearTimeout(__scrollSnapTimeout);
    __scrollSnapTimeout = setTimeout(() => {
      const id = sectionEl?.id || '';
      if (activeSectionId && activeSectionId !== id) {
        if (activeSectionId === 'projects') cleanupIfNeeded('projects');
        if (activeSectionId === 'certificates') cleanupIfNeeded('certificates');
      }
      const v = Number.parseInt(sectionEl?.dataset?.camIndex, 10);
      const presetIdx = Number.isFinite(v) ? v : visibleIndex;
      if (presetIdx === lastPresetIndex) return;
      safeApplyPreset(presetIdx);
      // After changing sections (and possibly cleaning up models),
      // rely on applyPreset to handle grid/helpers visibility.
      modelActive = !!(currentProjectGroup || currentCertGroup);
      activeSectionId = id;
    }, 80);
  },
});

// --- scroll fallback safeguard ---
window.addEventListener('scroll', () => {
  clearTimeout(window.__scrollTimeout);
  window.__scrollTimeout = setTimeout(() => {
    const center = window.innerHeight / 2;
    let bestIdx = 0, bestDist = Infinity;
    sections.forEach((sec, i) => {
      const r = sec.getBoundingClientRect();
      const dist = Math.abs(r.top + r.height/2 - center);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });
    const dataIdx = Number.parseInt(sections[bestIdx]?.dataset?.camIndex, 10);
    const presetIdx = Number.isFinite(dataIdx) ? dataIdx : bestIdx;
    if (presetIdx !== lastPresetIndex) {
      safeApplyPreset(presetIdx); // use safe wrapper, avoids double fade
    }
  }, 20); // very short debounce for faster response
});

// ---------- Anchor smoothing ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
});

// ---------- Reduced motion & tab visibility ----------
mediaReduced?.addEventListener?.('change', (ev) => {
  prefersReduced = !!ev.matches;
  applyPreset(lastPresetIndex);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    setWorldSpin(false);
  } else {
    const p = camPresets[lastPresetIndex] ?? camPresets[0];
    setWorldSpin(!prefersReduced && !!p.rotate, 0.001);
  }
});

// ---------- Dynamic tag loader for Blender and PDF ----------
document.addEventListener('click', async (e) => {
  const tag = e.target.closest('.tag[data-type][data-src]');
  if (!tag) return;

  try {
    if (tag.dataset.type === 'blender') {
      // Toggle unload if clicking same tag again
      if (currentProjectGroup && currentProjectGroup.__sourceTag === tag) {
        fadeObject(currentProjectGroup, 0, 800, () => {
          currentProjectGroup.__cleanup?.();
          removeAndDispose(currentProjectGroup);
          currentProjectGroup = null;
          const fadeDuration = 1000;
          animateWorldOpacity(true, fadeDuration);  // bring grid back with fade
          animateGridsOpacity(true, fadeDuration);
          animateHelpersOpacity(true, fadeDuration);
          modelActive = false;
          const sectionEl = document.getElementById(activeSectionId);
          const idx = Number.parseInt(sectionEl?.dataset?.camIndex, 10);
          if (Number.isFinite(idx)) {
            applyPreset(idx);
          }
        });
        return;
      }
      // Cross-cleanup PDFs (now handled as certificates)
      if (currentCertGroup) {
        fadeObject(currentCertGroup, 0, 800, () => {
          currentCertGroup.__cleanup?.();
          removeAndDispose(currentCertGroup);
          currentCertGroup = null;
        });
      }
      const mod = await import('../loaders/loaderDemo.js');
      cleanupIfNeeded('projects'); // clear old before loading new

      // Find project matching tag.dataset.src for hideMode
      const project = projectsData.find(p => p.model === tag.dataset.src);

      const gltf = await loadWithCompat(mod, 'blender', {
        model: tag.dataset.src,
        transform: { pos: [0, 0, 0], yaw: 0, scale: 5, spin: true }
      });
      if (gltf) {
        // Set initial opacity 0
        fadeObject(gltf, 0, 0);
        currentProjectGroup = gltf;
        currentProjectGroup.__sourceTag = tag;
        const hideMode = project?.hideMode || 'grid';
        const fadeDuration = 1000;
        if (hideMode === 'grid') {
          animateWorldOpacity(false, fadeDuration);
          animateGridsOpacity(false, fadeDuration);
          animateHelpersOpacity(true, fadeDuration);
        } else if (hideMode === 'all') {
          animateWorldOpacity(false, fadeDuration);
          animateGridsOpacity(false, fadeDuration);
          animateHelpersOpacity(false, fadeDuration);
        } else if (hideMode === 'none') {
          animateWorldOpacity(true, fadeDuration);
          animateGridsOpacity(true, fadeDuration);
          animateHelpersOpacity(true, fadeDuration);
        }
        fadeObject(gltf, 1, 800);
        modelActive = true;
      }
    } else if (tag.dataset.type === 'pdf') {
      // Toggle unload if clicking same tag again
      if (currentCertGroup && currentCertGroup.__sourceUrl === tag.dataset.src) {
        fadeObject(currentCertGroup, 0, 800, () => {
          currentCertGroup.__cleanup?.();
          removeAndDispose(currentCertGroup);
          currentCertGroup = null;
          const fadeDuration = 1000;
          animateWorldOpacity(true, fadeDuration);  // bring grid back with fade
          animateGridsOpacity(true, fadeDuration);
          animateHelpersOpacity(true, fadeDuration);
          modelActive = false;
          const sectionEl = document.getElementById(activeSectionId);
          const idx = Number.parseInt(sectionEl?.dataset?.camIndex, 10);
          if (Number.isFinite(idx)) {
            applyPreset(idx);
          }
        });
        return;
      }
      // Cross-cleanup Blender
      if (currentProjectGroup) {
        fadeObject(currentProjectGroup, 0, 800, () => {
          currentProjectGroup.__cleanup?.();
          removeAndDispose(currentProjectGroup);
          currentProjectGroup = null;
        });
      }
      const mod = await import('../loaders/loaderPDF.js');
      cleanupIfNeeded('certificates'); // clear old before loading new (now handles pdfs too)
      const obj = await loadWithCompat(mod, 'pdf', {
        opts: { url: tag.dataset.src, pageNumber: 1, width: 80 }
      });
      if (obj) {
        // Set initial opacity 0
        fadeObject(obj, 0, 0);
        currentCertGroup = obj;
        currentCertGroup.__sourceUrl = tag.dataset.src;
        // For PDFs, no project data, fallback to 'grid'
        const hideMode = 'grid';
        const fadeDuration = 1000;
        if (hideMode === 'grid') {
          animateWorldOpacity(false, fadeDuration);
          animateGridsOpacity(false, fadeDuration);
          animateHelpersOpacity(true, fadeDuration);
        } else if (hideMode === 'all') {
          animateWorldOpacity(false, fadeDuration);
          animateGridsOpacity(false, fadeDuration);
          animateHelpersOpacity(false, fadeDuration);
        } else if (hideMode === 'none') {
          animateWorldOpacity(true, fadeDuration);
          animateGridsOpacity(true, fadeDuration);
          animateHelpersOpacity(true, fadeDuration);
        }
        fadeObject(obj, 1, 800);
        modelActive = true;
      }
    }
  } catch (err) {
    console.error('[main] Tag loader failed:', tag.dataset.type, err);
  }
});

// ---------- Initial preset ----------
(function initInitialPreset() {
  if (!sections.length) return;
  const heroSection = document.querySelector('#hero[data-cam-index="0"]');
  if (heroSection) {
    const presetIdx = 0;
    safeApplyPreset(presetIdx);
    lastCamPos = (camPresets[presetIdx]?.pos ?? lastCamPos).slice ? (camPresets[presetIdx].pos).slice() : lastCamPos;
    lastTarget = (camPresets[presetIdx]?.target ?? lastTarget).slice ? (camPresets[presetIdx].target).slice() : lastTarget;
    activeSectionId = 'hero';
  } else {
    // fallback: old nearest-center logic
    const center = window.innerHeight / 2;
    let bestIdx = 0, bestDist = Infinity;
    sections.forEach((sec, i) => {
      const r = sec.getBoundingClientRect();
      const inRange = r.top <= center && r.bottom >= center;
      const dist = inRange ? 0 : Math.abs(r.top);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });
    const dataIdx = Number.parseInt(sections[bestIdx]?.dataset?.camIndex, 10);
    const presetIdx = Number.isFinite(dataIdx) ? dataIdx : bestIdx;
    safeApplyPreset(presetIdx);
    lastCamPos = (camPresets[presetIdx]?.pos ?? lastCamPos).slice ? (camPresets[presetIdx].pos).slice() : lastCamPos;
    lastTarget = (camPresets[presetIdx]?.target ?? lastTarget).slice ? (camPresets[presetIdx].target).slice() : lastTarget;
    activeSectionId = sections[bestIdx]?.id || null;
  }
})();

// expose for quick tweaking in console
window.__applyPreset = applyPreset;

// Force Hero preset on full load (ignore cooldown)
window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    const heroPresetIdx = 0;
    applyPreset(heroPresetIdx); // direct apply without cooldown
    lastCamPos = (camPresets[heroPresetIdx]?.pos ?? lastCamPos).slice
      ? (camPresets[heroPresetIdx].pos).slice()
      : lastCamPos;
    lastTarget = (camPresets[heroPresetIdx]?.target ?? lastTarget).slice
      ? (camPresets[heroPresetIdx].target).slice()
      : lastTarget;
    activeSectionId = 'hero';
  });
});