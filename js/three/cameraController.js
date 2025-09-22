// cameraController.js
// Handles camera movement and preset transitions

import {
  setDesiredCamera,
  setCameraTarget,
  setWorldTransform,
  setWorldSpin,
} from './threeScene.js';

import { camPresets } from './cameraPresets.js';
import { fadeGrids, fadeHelpers, animateWorldOpacity } from './fadeController.js';

// ---------- state ----------
let lastCamPos = [0, 0, 5];
let lastTarget = [0, 0, 0];
let lastPresetIndex = 0;
let animToken = 0;
let lastShowWorld = true;
let lastShowHelpers = true;

// ---------- helpers ----------
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function animateVector3(current, target, duration, onUpdate, onComplete) {
  const myToken = animToken;
  const start = { x: current[0], y: current[1], z: current[2] };
  const end = { x: target[0], y: target[1], z: target[2] };
  const startTime = performance.now();

  function animate() {
    if (myToken !== animToken) return; // cancel if a new anim started
    const now = performance.now();
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);

    const x = lerp(start.x, end.x, t);
    const y = lerp(start.y, end.y, t);
    const z = lerp(start.z, end.z, t);

    onUpdate([x, y, z]);

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      if (onComplete) onComplete();
    }
  }

  animate();
}

// ---------- core ----------
export function applyPreset(index, prefersReduced = false) {
  animToken++;
  const p = camPresets[index] ?? camPresets[0];

  // Fallback positions if world state not ready yet
  const fromPos = lastCamPos;
  const fromTarget = lastTarget;

  if (prefersReduced) {
    // Jump immediately
    setDesiredCamera(p.pos);
    setCameraTarget(p.target ?? [0, 0, 0]);
    setWorldTransform(p.world ?? { pos: [0, 0, 0], yaw: 0, scale: 1 });
    lastCamPos = p.pos.slice();
    lastTarget = (p.target ?? [0, 0, 0]).slice();
  } else {
    // Animate camera position
    animateVector3(fromPos, p.pos, 1000, (pos) => {
      setDesiredCamera(pos);
      lastCamPos = pos.slice();
    });

    // Animate camera target
    animateVector3(fromTarget, p.target ?? [0, 0, 0], 1000, (target) => {
      setCameraTarget(target);
      lastTarget = target.slice();
    });

    // Apply world transform immediately
    setWorldTransform(p.world ?? { pos: [0, 0, 0], yaw: 0, scale: 1 });
  }

  // Spin world if preset requires it
  setWorldSpin(!prefersReduced && !!p.rotate, 0.001);

  // Respect preset visibility flags with unified fade logic for sync
  const fadeInDuration = 800;
  const fadeOutDuration = 200;

  if (p.showWorld !== lastShowWorld || p.showHelpers !== lastShowHelpers) {
    const showWorld = !!p.showWorld;
    const showHelpers = !!p.showHelpers;

    if (showWorld) {
      fadeGrids(true, fadeInDuration);
      animateWorldOpacity(true, fadeInDuration);
    } else {
      fadeGrids(false, fadeOutDuration);
      animateWorldOpacity(false, fadeOutDuration);
    }

    if (showHelpers) {
      fadeHelpers(true, fadeInDuration);
    } else {
      fadeHelpers(false, fadeOutDuration);
    }
  }

  lastShowWorld = p.showWorld;
  lastShowHelpers = p.showHelpers;

  lastPresetIndex = index;
}

// Safe wrapper (no checks, just calls applyPreset)
export function safeApplyPreset(index, prefersReduced = false) {
  applyPreset(index, prefersReduced);
}

// ---------- state getters ----------
export function getLastPresetIndex() {
  return lastPresetIndex;
}

export function getLastCamPos() {
  return lastCamPos;
}

export function getLastTarget() {
  return lastTarget;
}