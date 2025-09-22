// loaders/loaderDEMO.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { addToModels, removeAndDispose, setWorldTransform, setWorldSpin, registerMixer } from '../three/threeScene.js';

let currentObj = null;
let currentProjectId = null;
const cache = new Map(); // id -> { obj }

// Helper to get project key
function getProjectKey(project){
  return project?.id ?? project?.model ?? null;
}

// ----------------------
// Helpers
// ----------------------
function applyTransformFrom(project, target) {
  const t = project.transform || {};
  const pos   = t.pos   ?? [0,0,0];
  const yaw   = t.yaw   ?? 0;
  const scale = t.scale ?? 1;

  if (target) {
    target.position.set(...pos);
    target.rotation.set(0, yaw, 0);
    target.scale.setScalar(scale);
  } else {
    setWorldTransform({ pos, yaw, scale });
  }
  setWorldSpin(!!t.spin, t.spinSpeed ?? undefined);
}

// Auto-center + rescale object so it fits into targetSize box
function normalizeObject(obj, targetSize = 50) {
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
  // Allow both signatures: { model, transform } or full project object
  let normalized = project;
  if (project && project.model && !project.hasOwnProperty('id')) {
    normalized = { id: project.model, ...project };
  }

  const key = getProjectKey(normalized);
  if (!key) {
    throw new Error('[loaderDemo] load() called without a valid model');
  }

  // guard: already loaded?
  if (currentProjectId === key && currentObj) {
    applyTransformFrom(normalized, currentObj);
    return currentObj;
  }

  // one-at-a-time
  unload();

  // cache?
  if (cache.has(key)) {
    const { obj } = cache.get(key);
    currentObj = obj;
    currentProjectId = key;
    addToModels(obj);
    applyTransformFrom(normalized, currentObj);
    return obj;
  }

  // fresh load
  const loader = new GLTFLoader();
  const gltf = await new Promise((resolve, reject) => {
    loader.load(
      normalized.model,
      (gltf) => resolve(gltf),
      undefined,
      reject
    );
  });

  const obj = gltf.scene || gltf.scenes?.[0];
  console.log("[loaderDemo] loaded gltf:", gltf);
  console.log("[loaderDemo] scene children:", obj?.children);
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  console.log("[loaderDemo] bounding box size:", size, "center:", center);

  // Create a wrapper group, normalize and add obj to it
  const wrapper = new THREE.Group();
  wrapper.name = `project_wrapper_${key || 'unnamed'}`;
  normalizeObject(obj, 150); // re-enabled
  wrapper.add(obj);

  if (gltf.animations && gltf.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(wrapper);
    gltf.animations.forEach(clip => {
      mixer.clipAction(clip).play();
    });
    registerMixer(mixer);
  }

  applyTransformFrom(normalized, wrapper);

  cache.set(key, { obj: wrapper });
  currentObj = wrapper;
  currentProjectId = key;
  addToModels(wrapper);
  return wrapper;
}

export function unload() {
  if (!currentObj) return;
  removeAndDispose(currentObj); // full dispose
  cache.delete(currentProjectId); // ensure disposed objects are removed from cache
  currentObj = null;
  currentProjectId = null;
}
