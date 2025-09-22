// scrollManager.js
// Handles scroll snapping and fallback preset switching

import { initScrollSnap } from '../scroll.js';
import { safeApplyPreset, getLastPresetIndex } from './cameraController.js';
import { cleanupIfNeeded } from './modelManager.js';
import { sectionPresets } from './cameraPresets.js';

let activeSectionId = null;

// ---------- main initializer ----------
export function initScrollManager(sections) {
  console.log("Tracking sections:", sections.map(s => s.id));

  // Debounced callback
  let __scrollSnapTimeout;
  initScrollSnap({
    sections,
    onSectionChange: (visibleIndex, sectionEl) => {
      clearTimeout(__scrollSnapTimeout);
      __scrollSnapTimeout = setTimeout(() => {
        const id = sectionEl?.id || '';

        if (activeSectionId && activeSectionId !== id) {
          if (activeSectionId === 'projects') {
            cleanupIfNeeded('projects', id);
          } else if (activeSectionId === 'certificates') {
            cleanupIfNeeded('certificates', id);
          } else if (activeSectionId === 'education') {
            cleanupIfNeeded('education', id);
          }
        }

        const presetIdx = sectionPresets[id] ?? visibleIndex;

        if (presetIdx !== getLastPresetIndex()) {
          safeApplyPreset(presetIdx);
        }

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
      const id = sections[bestIdx]?.id || '';
      const presetIdx = sectionPresets[id] ?? bestIdx;

      if (presetIdx !== getLastPresetIndex()) {
        safeApplyPreset(presetIdx);
      }
      activeSectionId = id || null;
    }, 20); // short debounce
  });
}

// ---------- getters ----------
export function getActiveSectionId() {
  return activeSectionId;
}