// events.js
// Handles global DOM events and delegates to modelManager

import { applyPreset } from './cameraController.js';
import { handleTagClick } from './modelManager.js';
import { projects as projectsData } from '../projectsSection/projectsData.js';
import { getActiveSectionId } from './scrollManager.js';
import { sectionPresets } from './cameraPresets.js';

// ---------- anchor smoothing ----------
export function setupAnchorSmoothing(prefersReduced) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start'
    });

    const presetIdx = sectionPresets[id];
    if (presetIdx !== undefined) {
      applyPreset(presetIdx, prefersReduced);
    }
  });
}

// ---------- reduced motion ----------
export function setupReducedMotion(mediaReduced) {
  mediaReduced?.addEventListener?.('change', (ev) => {
    const prefersReduced = !!ev.matches;
    applyPreset(0, prefersReduced); // reapply current preset
  });
}

// ---------- tab visibility ----------
export function setupVisibilityChange(prefersReduced, getLastPresetIndex, camPresets, setWorldSpin) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      setWorldSpin(false);
    } else {
      const p = camPresets[getLastPresetIndex()] ?? camPresets[0];
      setWorldSpin(!prefersReduced && !!p.rotate, 0.001);
    }
  });
}

// ---------- tag click events ----------
export function setupTagEvents() {
  document.addEventListener('click', async (e) => {
    const tag = e.target.closest('.tag[data-type][data-src]');
    if (!tag) return;

    const activeSectionId = getActiveSectionId();
    await handleTagClick(tag, projectsData, activeSectionId);
  });
}