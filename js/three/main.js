// main.js
// Orchestration only – all logic is delegated to controllers

import { mount, start, setWorldSpin } from './threeScene.js';
import { camPresets, sectionPresets } from './cameraPresets.js';

import { applyPreset, safeApplyPreset, getLastPresetIndex } from './cameraController.js';
import { initScrollManager } from './scrollManager.js';
import { setupAnchorSmoothing, setupReducedMotion, setupVisibilityChange, setupTagEvents } from './events.js';
import { initScrollSpy, initBoxSpy } from '../scrollspy.js'; // adjust relative path as needed

// ---------- mount Three.js scene ----------
const container = document.getElementById('three-container');
if (container) {
  mount(container);
  start();
} else {
  console.warn('[main] #three-container not found');
}

// ---------- app state ----------
const mediaReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
let prefersReduced = !!mediaReduced?.matches;

// ---------- sections & scroll handling ----------
const sections = Array.from(document.querySelectorAll('main section[id]'));
initScrollManager(sections);

// ---------- events ----------
setupAnchorSmoothing(prefersReduced);
setupReducedMotion(mediaReduced);
setupVisibilityChange(prefersReduced, getLastPresetIndex, camPresets, setWorldSpin);
setupTagEvents();
initScrollSpy();
initBoxSpy();

// ---------- mobile nav toggle ----------
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector("header nav ul");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }
});

// ---------- initial preset ----------
(function initInitialPreset() {
  if (!sections.length) return;
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    const presetIdx = sectionPresets['hero'] ?? 0;
    safeApplyPreset(presetIdx, prefersReduced);
  } else {
    // fallback: nearest-center logic
    const center = window.innerHeight / 2;
    let bestIdx = 0, bestDist = Infinity;
    sections.forEach((sec, i) => {
      const r = sec.getBoundingClientRect();
      const inRange = r.top <= center && r.bottom >= center;
      const dist = inRange ? 0 : Math.abs(r.top);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });
    const id = sections[bestIdx]?.id || '';
    const presetIdx = sectionPresets[id] ?? bestIdx;
    safeApplyPreset(presetIdx, prefersReduced);
  }
})();

// ---------- force Hero preset on full load ----------
window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    applyPreset(0, prefersReduced);
  });
});