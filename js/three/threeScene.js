// threeScene.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

// Shared fade duration for helpers and grids
const FADE_DURATION = 1000;

const mixers = [];
const helpers = [];
const grids = [];
const axes = [];

export const scene    = new THREE.Scene();
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
export const camera   = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);

// ── Group hierarchy: scene → worldRoot → spinGroup → world (your grids/axes/models go in `world`)
// Helpers (grids and axes) are separate from world so they are not hidden when fading the world
export const worldRoot = new THREE.Group();
const spinGroup = new THREE.Group();
export const world = new THREE.Group();
export const modelsGroup = new THREE.Group();
export const gridsGroup = new THREE.Group();
export const axesGroup = new THREE.Group();
worldRoot.add(spinGroup);
spinGroup.add(world);
world.add(modelsGroup);
scene.add(worldRoot);
scene.add(gridsGroup);
scene.add(axesGroup);

// transparent BG
renderer.setClearColor(0x000000, 0);
scene.background = null;

// --- build your grids/axes into `gridsGroup` and `axesGroup` exactly like before ------------------
(function buildGridsAndAxes() {
  const size = 200, divisions = 30;
  const colorMain = 0x333333, colorGrid = 0x111111;

  const gridXY = new THREE.GridHelper(size, divisions, colorMain, colorGrid);
  gridXY.rotation.x = -Math.PI/2;
  const gridXZ = new THREE.GridHelper(size, divisions, colorMain, colorGrid);
  gridXZ.rotation.y = -Math.PI/2;
  const gridYZ = new THREE.GridHelper(size, divisions, colorMain, colorGrid);
  gridYZ.rotation.z =  Math.PI/2;

  [gridXY, gridXZ, gridYZ].forEach(g => {
    g.material.opacity = 1; g.material.transparent = true; g.material.depthWrite = false; gridsGroup.add(g);
    grids.push(g);
  });

  const axisLength = 100, radius = 0.5, radialSegs = 8;
  const cyl = new THREE.CylinderGeometry(radius, radius, axisLength, radialSegs);
  const x = new THREE.Mesh(cyl, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  x.rotation.z = -Math.PI/2; x.position.x = axisLength/2;
  const y = new THREE.Mesh(cyl.clone(), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
  y.position.y = axisLength/2;
  const z = new THREE.Mesh(cyl.clone(), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
  z.rotation.x =  Math.PI/2; z.position.z = axisLength/2;
  axesGroup.add(x, y, z);
  axes.push(x, y, z);
})();

// lights
scene.add(new THREE.AmbientLight(0x888888));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(50, 100, 50);
scene.add(dirLight);

// ---- state we can steer from presets ---------------------------------------
const v3 = (x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

let desiredCam     = v3(200,100,100);
let desiredTarget  = v3(0,0,0);
let currentTarget  = v3(0,0,0);

let desiredWorldPos   = v3(0,0,0);
let desiredWorldYaw   = 0;         // radians
let desiredWorldPitch = 0;         // radians
let desiredWorldRoll  = 0;         // radians
let desiredWorldScale = 1;

let spinEnabled = true;
let spinSpeed   = 0.001;

const clock = new THREE.Clock();

// mount & start
export function mount(containerEl) {
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  containerEl.appendChild(renderer.domElement);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  camera.position.copy(desiredCam);
  currentTarget.copy(desiredTarget);
  camera.lookAt(currentTarget);

  window.addEventListener('resize', onResize);
}
export function start() { requestAnimationFrame(animate); }

function animate(t) {
  requestAnimationFrame(animate);

  // smooth camera position & target
  camera.position.lerp(desiredCam, 0.05);
  currentTarget.lerp(desiredTarget, 0.08);
  camera.lookAt(currentTarget);

  // world placement (no-spin transforms live on `world`; spin lives on `spinGroup`)
  world.position.lerp(desiredWorldPos, 0.06);
  // yaw lerp
  world.rotation.y += (desiredWorldYaw - world.rotation.y) * 0.06;
  // pitch lerp
  world.rotation.x += (desiredWorldPitch - world.rotation.x) * 0.06;
  // roll lerp
  world.rotation.z += (desiredWorldRoll - world.rotation.z) * 0.06;
  // scale lerp
  const cs = world.scale.x;
  const ns = cs + (desiredWorldScale - cs) * 0.06;
  world.scale.setScalar(ns);

  // optional spin
  if (spinEnabled) spinGroup.rotation.y += spinSpeed;

  const delta = clock.getDelta();
  mixers.forEach(mixer => mixer.update(delta));

  renderer.render(scene, camera);
}

function onResize() {
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

// ---- public setters you’ll call from your presets ---------------------------
export function setDesiredCamera(pos) {
  if (Array.isArray(pos)) desiredCam.set(pos[0], pos[1], pos[2]);
  else desiredCam.copy(pos);
}
export function setCameraTarget(target=[0,0,0]) {
  if (Array.isArray(target)) desiredTarget.set(target[0], target[1], target[2]);
  else desiredTarget.copy(target);
}
export function setWorldTransform({ pos=[0,0,0], yaw=0, pitch=0, roll=0, scale=1 } = {}) {
  desiredWorldPos.set(pos[0], pos[1], pos[2]);
  desiredWorldYaw = yaw;
  desiredWorldPitch = pitch;
  desiredWorldRoll = roll;
  desiredWorldScale = scale;
}
export function setWorldSpin(enabled, speed=spinSpeed) {
  spinEnabled = !!enabled;
  spinSpeed = speed;
}

// backwards-compat alias if you already use setWorldRotation()
export const setWorldRotation = setWorldSpin;

export function registerMixer(mixer) {
  mixers.push(mixer);
}

// helpers to add/remove content groups
export function addToWorld(obj){ world.add(obj); }
export function addToModels(obj){
  console.log("[threeScene] addToModels called with:", obj);
  modelsGroup.add(obj);
  console.log("[threeScene] modelsGroup now has children:", modelsGroup.children);
}
export function clearModels(){
  while(modelsGroup.children.length){
    const obj = modelsGroup.children.pop();
    removeAndDispose(obj);
  }
}
export function removeAndDispose(obj){
  if(!obj) return;
  if (world.children.includes(obj)) world.remove(obj);
  if (modelsGroup.children.includes(obj)) modelsGroup.remove(obj);
  // do not remove from helpersGroup or dispose helpers accidentally
  obj.traverse(o=>{
    if(o.geometry) o.geometry.dispose();
    if(o.material){
      if(Array.isArray(o.material)) o.material.forEach(m=>m.dispose());
      else o.material.dispose();
    }
    if(o.texture?.dispose) o.texture.dispose();
  });
}

// Smoothly fade axes opacity in/out over a shared duration
export function animateHelpersOpacity(show, duration = FADE_DURATION) {
  // Use same interpolation/timing/visibility logic as grids for consistency
  const startOpacities = axes.map(a => a.material.opacity);
  const endOpacity = show ? 1 : 0;
  const startTime = performance.now();
  axes.forEach(a => {
    a.material.transparent = true;
    a.material.depthWrite = false;
  });
  // Ensure axes are visible if fading in
  if (show) {
    axes.forEach(a => a.visible = true);
  }
  function animate() {
    const now = performance.now();
    const t = Math.min((now - startTime) / duration, 1);
    for (let i = 0; i < axes.length; i++) {
      axes[i].material.opacity = startOpacities[i] + (endOpacity - startOpacities[i]) * t;
    }
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      for (let i = 0; i < axes.length; i++) {
        axes[i].material.opacity = endOpacity;
        axes[i].visible = show || endOpacity > 0;
      }
    }
  }
  animate();
}


export function animateGridsOpacity(show) {
  const duration = FADE_DURATION;
  const startOpacities = grids.map(g => g.material.opacity);
  const endOpacity = show ? 1 : 0;
  const startTime = performance.now();
  grids.forEach(g => {
    g.material.transparent = true;
    g.material.depthWrite = false;
  });
  function animate() {
    const now = performance.now();
    const t = Math.min((now - startTime) / duration, 1);
    for (let i = 0; i < grids.length; i++) {
      grids[i].material.opacity = startOpacities[i] + (endOpacity - startOpacities[i]) * t;
    }
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      for (let i = 0; i < grids.length; i++) {
        grids[i].material.opacity = endOpacity;
        grids[i].visible = show || endOpacity > 0;
      }
    }
  }
  // Ensure grids are visible if fading in
  if (show) {
    grids.forEach(g => g.visible = true);
  }
  animate();
}
