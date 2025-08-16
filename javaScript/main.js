// /js/main.js
import {
  mount,
  start,
  setDesiredCamera,
  setCameraTarget,
  setWorldTransform,
  setWorldSpin,
  addToWorld,
  removeAndDispose,
} from './threeScene.js';

import { camPresets } from './cameraPresets.js';
import { initScrollSnap } from './scroll.js';
import { initProjects } from './projectsSection.js';
import { initCertificates } from './certificatesSection.js';

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
let currentCertGroup    = null;

// ---------- helpers ----------
function applyPreset(index) {
  const p = camPresets[index] ?? camPresets[0];
  setDesiredCamera(p.pos);
  setCameraTarget(p.target ?? [0, 0, 0]);
  setWorldTransform(p.world ?? { pos: [0, 0, 0], yaw: 0, scale: 1 });
  setWorldSpin(!prefersReduced && !!p.rotate, 0.001);
  lastPresetIndex = index;
}

// universal dynamic load helper that supports both new & legacy loader signatures
async function loadWithCompat(mod, section, item) {
  // Preferred: universal loader expects the entire project/cert object
  //   await mod.load(item)
  // Fallback: legacy signature
  //   await mod.load(addToWorld, item.opts)

  if (typeof mod.load !== 'function') {
    throw new Error('Loader module has no load() export');
  }

  let obj = null;

  // Try universal signature first
  try {
    const maybe = await mod.load(item);
    if (maybe) obj = maybe;
  } catch (e) {
    // If the module explicitly throws because it expects legacy args, ignore
    // and try the legacy path below.
  }

  // Legacy fallback if nothing returned yet
  if (!obj) {
    try {
      obj = await mod.load(addToWorld, item?.opts);
    } catch (e2) {
      // If still failing, rethrow the original problem
      throw e2;
    }
  }

  // If the loader didn’t return an object (it may have added directly),
  // try a conventional getter if provided.
  if (!obj && typeof mod.getCurrent === 'function') {
    obj = mod.getCurrent();
  }

  // If there’s an explicit unload() export, wire it into our cleanup hook.
  if (obj && typeof mod.unload === 'function' && !obj.__cleanup) {
    obj.__cleanup = () => {
      try { mod.unload(); } catch {}
    };
  }

  return obj;
}

function cleanupIfNeeded(kind) {
  if (kind === 'projects' && currentProjectGroup) {
    currentProjectGroup.__cleanup?.();
    removeAndDispose(currentProjectGroup);
    currentProjectGroup = null;
  }
  if (kind === 'certificates' && currentCertGroup) {
    currentCertGroup.__cleanup?.();
    removeAndDispose(currentCertGroup);
    currentCertGroup = null;
  }
}

// ---------- Section snap scrolling ----------
const sections = Array.from(document.querySelectorAll('main > section'));

initScrollSnap({
  sections,
  onSectionChange: async (visibleIndex, sectionEl) => {
    const id = sectionEl?.id || '';

    // dispose content when leaving a section
    if (activeSectionId && activeSectionId !== id) {
      if (activeSectionId === 'projects') cleanupIfNeeded('projects');
      if (activeSectionId === 'certificates') cleanupIfNeeded('certificates');
    }

    // apply the camera/world preset for the new section
    const v = Number.parseInt(sectionEl?.dataset?.camIndex, 10);
    const presetIdx = Number.isFinite(v) ? v : visibleIndex;
    applyPreset(presetIdx);

    activeSectionId = id;
  },
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

// ---------- Carousels ----------
const projectsRoot = document.getElementById('projects-root');
if (projectsRoot) {
  initProjects(projectsRoot, {
    onActivate: (i, project) => {
      if (typeof project.presetIndex === 'number') applyPreset(project.presetIndex);
    },
    onOpen: async (i, project) => {
      try {
        cleanupIfNeeded('projects');

        const mod = await import(project.loader);
        // Load model (universal first, legacy fallback inside helper)
        const obj = await loadWithCompat(mod, 'projects', project);

        // Ensure we track something to clean up; if loader added directly,
        // try to find a returned/group reference, otherwise we can’t clean it.
        if (obj) {
          currentProjectGroup = obj;
        } else {
          // last resort: don’t block UI if a loader didn’t return a handle
          console.warn('[main] Loader did not return an object; cleanup may be limited:', project?.id);
        }
      } catch (err) {
        console.error('[main] Project loader failed:', project?.loader, err);
      }
    }
  });
}

const certsRoot = document.getElementById('certs-root');
if (certsRoot) {
  initCertificates(certsRoot, {
    onActivate: (i, cert) => {
      if (typeof cert.presetIndex === 'number') applyPreset(cert.presetIndex);
    },
    onOpen: async (i, cert) => {
      try {
        cleanupIfNeeded('certificates');

        const mod = await import(cert.loader);
        const obj = await loadWithCompat(mod, 'certificates', cert);

        if (obj) {
          currentCertGroup = obj;
        } else {
          console.warn('[main] Certificate loader did not return an object; cleanup may be limited:', cert?.id);
        }
      } catch (err) {
        console.error('[main] Certificate loader failed:', cert?.loader, err);
      }
    }
  });
}

// ---------- Initial preset ----------
(function initInitialPreset() {
  if (!sections.length) return;
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
  applyPreset(presetIdx);
  activeSectionId = sections[bestIdx]?.id || null;
})();

// expose for quick tweaking in console
window.__applyPreset = applyPreset;

