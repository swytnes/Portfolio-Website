// loaders/loaderDEMO.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { addToWorld, removeAndDispose, setWorldTransform, setWorldSpin } from '../threeScene.js';

let currentObj = null;
let currentProjectId = null;
const cache = new Map(); // id -> { obj }

// ----------------------
// Helpers
// ----------------------
function applyTransformFrom(project) {
  const t = project.transform || {};
  const pos   = t.pos   ?? [0,0,0];
  const yaw   = t.yaw   ?? 0;
  const scale = t.scale ?? 1;
  setWorldTransform({ pos, yaw, scale });
  setWorldSpin(!!t.spin, t.spinSpeed ?? undefined);
}

// Auto-center + rescale object so it fits into targetSize box
function normalizeObject(obj, targetSize = 10) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);

  if (maxDim === 0) return; // prevent div by zero

  const scale = targetSize / maxDim;
  obj.scale.setScalar(scale);

  // re-center at origin
  const center = new THREE.Vector3();
  box.getCenter(center);
  obj.position.sub(center.multiplyScalar(scale));
}

// ----------------------
// Public API
// ----------------------
export async function load(project) {
  // guard: already loaded?
  if (currentProjectId === project.id && currentObj) {
    applyTransformFrom(project);
    return currentObj;
  }

  // one-at-a-time
  unload();
  applyTransformFrom(project);

  // cache?
  if (cache.has(project.id)) {
    const { obj } = cache.get(project.id);
    currentObj = obj;
    currentProjectId = project.id;
    addToWorld(obj);
    return obj;
  }

  // fresh load
  const loader = new GLTFLoader();
  const obj = await new Promise((resolve, reject) => {
    loader.load(
      project.model,
      (gltf) => resolve(gltf.scene || gltf.scenes?.[0]),
      undefined,
      reject
    );
  });

  // normalize before adding
  normalizeObject(obj, 10);

  cache.set(project.id, { obj });
  currentObj = obj;
  currentProjectId = project.id;
  addToWorld(obj);
  return obj;
}

export function unload() {
  if (!currentObj) return;
  removeAndDispose(currentObj); // full dispose
  cache.delete(currentProjectId); // comment this out if you want persistent cache
  currentObj = null;
  currentProjectId = null;
}

