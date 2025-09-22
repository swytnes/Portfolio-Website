// modelManager.js
// Handles loading/unloading of Blender + PDF models

import { addToModels, removeAndDispose } from './threeScene.js';
import { fadeObject, animateWorldOpacity, fadeGrids, fadeHelpers } from './fadeController.js';

let currentProjectGroup = null;
let currentCertGroup = null;
let modelActive = false;

// ---------- universal dynamic loader ----------
// ---------- universal dynamic loader ----------
export async function loadWithCompat(mod, item) {
  if (typeof mod.load !== 'function') {
    throw new Error('Loader module has no load() export');
  }

  let obj = null;

  // 1) Try modern single-arg signature: load({ model, transform })
  try {
    obj = await mod.load(item);
    console.log("[loadWithCompat] load(item) result:", obj);
  } catch (e) {
    console.warn("[loadWithCompat] load(item) failed:", e);
  }

  // 2) Fallback: legacy signature load(addToModels, opts/transform)
  if (!obj) {
    const secondArg = item?.opts ?? item?.transform ?? item;
    try {
      obj = await mod.load(addToModels, secondArg);
      console.log("[loadWithCompat] load(addToModels, secondArg) result:", obj);
    } catch (e2) {
      console.warn("[loadWithCompat] legacy load failed:", e2);
    }
  }

  // 3) Fallback: getCurrent() if available
  if (!obj && typeof mod.getCurrent === 'function') {
    obj = mod.getCurrent();
    console.log("[loadWithCompat] getCurrent() result:", obj);
  }

  // Attach optional cleanup and ensure it’s in the scene
  if (obj && typeof mod.unload === 'function' && !obj.__cleanup) {
    obj.__cleanup = () => { try { mod.unload(); } catch {} };
  }
  if (obj && !obj.parent) {
    addToModels(obj); // <-- actually attach to scene graph
    console.log("[loadWithCompat] added object to scene:", obj);
  }

  console.log("[loadWithCompat] final return:", obj);
  return obj;
}

// ---------- cleanup ----------
export function cleanupIfNeeded(kind, activeSectionId) {
  if (kind === 'projects' && currentProjectGroup) {
    fadeObject(currentProjectGroup, 0, 800, () => {
      if (currentProjectGroup && typeof currentProjectGroup.__cleanup === 'function') {
        currentProjectGroup.__cleanup();
      }
      removeAndDispose(currentProjectGroup);
      currentProjectGroup = null;
      modelActive = false;
    });
  }
  if (kind === 'certificates' && currentCertGroup) {
    fadeObject(currentCertGroup, 0, 800, () => {
      if (currentCertGroup && typeof currentCertGroup.__cleanup === 'function') {
        currentCertGroup.__cleanup();
      }
      removeAndDispose(currentCertGroup);
      currentCertGroup = null;
      modelActive = false;
    });
  }

  if (kind === 'education') {
    animateWorldOpacity(true, 1000);
    fadeGrids(true, 1000);
    fadeHelpers(true, 1000);
  }

  // If no models left and we’re in hero, reset scene
  if (!currentProjectGroup && !currentCertGroup && activeSectionId === 'hero') {
    animateWorldOpacity(true, 1000);
    fadeGrids(true, 1000);
    fadeHelpers(true, 1000);
  }
}

// ---------- tag click handling ----------
export async function handleTagClick(tag, projectsData, activeSectionId) {
  try {
    if (tag.dataset.type === 'blender') {
      // Unload if clicking same tag again
      if (currentProjectGroup && currentProjectGroup.__sourceTag === tag) {
        fadeObject(currentProjectGroup, 0, 800, () => {
          if (currentProjectGroup && typeof currentProjectGroup.__cleanup === 'function') {
            currentProjectGroup.__cleanup();
          }
          removeAndDispose(currentProjectGroup);
          currentProjectGroup = null;
          resetSceneAfterUnload(activeSectionId);
        });
        return;
      }

      // Cleanup PDFs
      if (currentCertGroup) {
        cleanupIfNeeded('certificates', activeSectionId);
      }

      const mod = await import('../loaders/loaderDemo.js');
      cleanupIfNeeded('projects', activeSectionId);

      const project = projectsData.find(p => p.model === tag.dataset.src);
      console.log("[handleTagClick] tag src:", tag.dataset.src);
      console.log("[handleTagClick] matching project:", project);

      const gltf = await loadWithCompat(mod, {
        model: tag.dataset.src,
        transform: project?.transform ?? { pos: [0,0,0], yaw: 0, scale: 5, spin: true }
      });

      console.log("[handleTagClick] gltf loaded:", gltf);
      if (gltf) {
        console.log("[handleTagClick] gltf children:", gltf.children);
        currentProjectGroup = gltf;
        currentProjectGroup.__sourceTag = tag;
        applyHideMode(project?.hideMode || 'grid');
        fadeObject(gltf, 1, 800); // fade in only
        modelActive = true;
      }
    }

    else if (tag.dataset.type === 'pdf') {
      // Unload if clicking same tag again
      if (currentCertGroup && currentCertGroup.__sourceUrl === tag.dataset.src) {
        fadeObject(currentCertGroup, 0, 800, () => {
          if (currentCertGroup && typeof currentCertGroup.__cleanup === 'function') {
            currentCertGroup.__cleanup();
          }
          removeAndDispose(currentCertGroup);
          currentCertGroup = null;
          resetSceneAfterUnload(activeSectionId);
        });
        return;
      }

      // Cleanup Blender
      if (currentProjectGroup) {
        cleanupIfNeeded('projects', activeSectionId);
      }

      const mod = await import('../loaders/loaderPDF.js');
      cleanupIfNeeded('certificates', activeSectionId);

      const obj = await loadWithCompat(mod, {
        opts: { url: tag.dataset.src, pageNumber: 1, width: 80 }
      });

      if (obj) {
        fadeObject(obj, 0, 0); // start hidden
        currentCertGroup = obj;
        currentCertGroup.__sourceUrl = tag.dataset.src;
        applyHideMode('grid'); // default for PDFs
        fadeObject(obj, 1, 800);
        modelActive = true;
      }
    }
  } catch (err) {
    console.error('[modelManager] Tag loader failed:', tag.dataset.type, err);
  }
}

// ---------- helper ----------
function applyHideMode(hideMode) {
  const fadeDuration = 1000;
  if (hideMode === 'grid') {
    animateWorldOpacity(false, fadeDuration);
    fadeGrids(false, fadeDuration);
    fadeHelpers(true, fadeDuration);
  } else if (hideMode === 'all') {
    animateWorldOpacity(false, fadeDuration);
    fadeGrids(false, fadeDuration);
    fadeHelpers(false, fadeDuration);
  } else if (hideMode === 'none') {
    animateWorldOpacity(true, fadeDuration);
    fadeGrids(true, fadeDuration);
    fadeHelpers(true, fadeDuration);
  }
}

function resetSceneAfterUnload(activeSectionId) {
  const fadeDuration = 1000;
  animateWorldOpacity(true, fadeDuration);
  fadeGrids(true, fadeDuration);
  fadeHelpers(true, fadeDuration);
  modelActive = false;
}

// ---------- state getters ----------
export function isModelActive() {
  return modelActive;
}