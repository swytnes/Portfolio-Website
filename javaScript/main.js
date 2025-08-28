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
      obj = await mod.load(addToWorld, item?.opts);
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

    if (activeSectionId && activeSectionId !== id) {
      if (activeSectionId === 'projects') cleanupIfNeeded('projects');
      if (activeSectionId === 'certificates') cleanupIfNeeded('certificates');
    }

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

// ---------- Projects carousel ----------
const projectsRoot = document.getElementById('projects-root');
if (projectsRoot) {
  initProjects(projectsRoot, {
    onActivate: (i, project) => {
      if (typeof project.presetIndex === 'number') applyPreset(project.presetIndex);
    },
    onOpen: async (i, project, targetEl) => {
      // targetEl is defined if projectsSection.js created an overlay (mobile)
      if (targetEl) {
        targetEl.innerHTML = `<p style="color:white; text-align:center;">Loading ${project.title}…</p>`;
        // TODO: extend loaders so they can render into targetEl
      } else {
        try {
          cleanupIfNeeded('projects');
          const mod = await import(project.loader);
          const obj = await loadWithCompat(mod, 'projects', project);
          if (obj) currentProjectGroup = obj;
          else console.warn('[main] Loader did not return object:', project?.id);
        } catch (err) {
          console.error('[main] Project loader failed:', project?.loader, err);
        }
      }
    }
  });
}

// ---------- Certificates carousel ----------
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
        if (obj) currentCertGroup = obj;
        else console.warn('[main] Certificate loader did not return object:', cert?.id);
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

