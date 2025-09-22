// fadeController.js
// Handles fading of world, grid, helpers, and objects

import { world, modelsGroup, animateGridsOpacity, animateHelpersOpacity } from './threeScene.js';

const originalOpacityMap = new WeakMap();
let fadeToken = 0;

// ---------- utilities ----------
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Fade all materials in a group/object
export function fadeObject(obj, targetOpacity, duration = 800, onComplete) {
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
  console.log("[fadeObject] materials found:", mats.length, "targetOpacity:", targetOpacity);

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
      console.log("[fadeObject] completed fade to", targetOpacity, "for", mats.length, "materials");
      if (onComplete) onComplete();
    }
  }

  animate();
}

// Helper to check if child is a descendant of parent in the scene graph
function isDescendant(child, parent) {
  let node = child;
  while (node) {
    if (node === parent) return true;
    node = node.parent;
  }
  return false;
}

// Fade the full world object (grid + helpers inside world group)
export function animateWorldOpacity(targetVisible, duration = 1000) {
  animateGridsOpacity(targetVisible, duration);
  animateHelpersOpacity(targetVisible, duration);
}

// Fade grids specifically
export function fadeGrids(targetVisible, duration = 1000) {
  animateGridsOpacity(targetVisible, duration);
}

// Fade helpers specifically
export function fadeHelpers(targetVisible, duration = 1000) {
  animateHelpersOpacity(targetVisible, duration);
}