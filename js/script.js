import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

// ─── 0) Modul-Import: THREE.js als ES-Modul laden
//    Ermöglicht Nutzung aller THREE-APIs über das THREE-Namespace

// ─── 1) Canvas-Setup: Szene und Renderer initialisieren
// Hole das HTML-Element, in das der WebGL-Canvas eingefügt wird
const container = document.getElementById('three-container');
// Erstelle eine neue Szene (Root-Objekt für alle 3D-Elemente)
const scene     = new THREE.Scene();
// Erstelle den Renderer mit Antialias und Transparenz
const renderer  = new THREE.WebGLRenderer({ antialias: true, alpha: true });
// Renderer auf Vollbild setzen und ins DOM hängen
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// ─── 2) Kamerapresets definieren
//    Array aus Positionen und Rotations-Flags für verschiedene Blickwinkel
const camPresets = [
  { pos: new THREE.Vector3(100, 100, 100), rotate: true  }, // 0: Standard-Ansicht (Drehen aktiv)
  { pos: new THREE.Vector3(0,   200,   0), rotate: false }, // 1: Vogelperspektive (Drehen aus)
  { pos: new THREE.Vector3(200, 0,     0), rotate: true  }, // 2: Seitenansicht
  { pos: new THREE.Vector3(50,  50,    50), rotate: true  }  // 3: Nahaufnahme
];

// ─── 3) Kamera erstellen und Startposition setzen
// PerspectiveCamera(fov, aspect, near, far)
const camera = new THREE.PerspectiveCamera(
  50,                                           // Blickfeld in Grad
  window.innerWidth / window.innerHeight,       // Seitenverhältnis = Fenster
  0.1,                                          // nahe Clipping-Ebene
  1000                                          // ferne Clipping-Ebene
);
// Anfangs auf Preset 0 positionieren und auf Ursprung richten
camera.position.copy(camPresets[0].pos);
camera.lookAt(0, 0, 0);

// ─── 4) Hilfsobjekte (Helpers) und Licht hinzufügen
// GridHelper zeigt ein Gitter in der XY-Ebene
scene.add(new THREE.GridHelper(200, 20, 0xffffff, 0x555555));
// Zweites Gitter in XZ-Ebene durch Rotation
const gridXZ = new THREE.GridHelper(200, 20, 0xffffff, 0x555555);
gridXZ.rotation.x = Math.PI / 2;
scene.add(gridXZ);
// Drittes Gitter in YZ-Ebene
const gridYZ = new THREE.GridHelper(200, 20, 0xffffff, 0x555555);
gridYZ.rotation.z = Math.PI / 2;
scene.add(gridYZ);
// AxesHelper zeigt farbige Achsen (X=rot, Y=grün, Z=blau)
scene.add(new THREE.AxesHelper(100));
// Umgebungslicht für Basisbeleuchtung
scene.add(new THREE.AmbientLight(0x888888));
// DirectionalLight für Schatten und Highlights
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(50, 100, 50);
scene.add(dirLight);

// 5) Flags
let scrollT = 0;
let targetPreset = null;
let isProgrammaticScroll = false;  // NEU: verhindert das Zurücksetzen

// 6) Scroll‑Listener
window.addEventListener('scroll', () => {
  // wenn wir gerade ein programmatisches Scrollen auslösen, skippen
  if (isProgrammaticScroll) return;

  // sonst ganz normal in den Scroll‑Modus zurück
  targetPreset = null;
  const scrollY   = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  scrollT = Math.min(1, Math.max(0, scrollY / maxScroll));
});

// 8) Klick‑Handler
document.querySelectorAll('.project-card').forEach(card => {
  const idx = parseInt(card.dataset.camIndex, 10);
  const btn = card.querySelector('.load-model');
  if (!isNaN(idx) && btn) {
    btn.addEventListener('click', e => {
      e.preventDefault();

      // setze Flag, damit unser own scroll nicht ins Scroll‑Listener reinfährt
      isProgrammaticScroll = true;

      // smooth scroll ans Seiten‑Top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // nach XXXms (länger als das Smooth‑Scroll dauert) das Flag zurücksetzen
      setTimeout(() => {
        isProgrammaticScroll = false;
      }, 1000);

      // Preset aktivieren
      targetPreset = idx;
    });
  }
});


// ─── 9) Animations- und Render-Loop
function animate() {
  console.log('Rendering frame, targetPreset =', targetPreset);
  requestAnimationFrame(animate);

  // 9a) Gewünschte Kamera-Position ermitteln
  let desiredPos;
  if (targetPreset === null) {
    // Scroll-Modus: Interpolation zwischen zwei Presets anhand scrollT
    const n      = camPresets.length;
    const scaled = scrollT * (n - 1);
    const i      = Math.floor(scaled);
    const alpha  = scaled - i;
    const i2     = Math.min(n - 1, i + 1);
    desiredPos = camPresets[i].pos.clone().lerp(camPresets[i2].pos, alpha);
  } else {
    // Klick-Modus: direktes Ziel-Preset
    desiredPos = camPresets[targetPreset].pos;
  }

  // 9b) Sanfte Bewegung der Kamera
  camera.position.lerp(desiredPos, 0.05);
  camera.lookAt(0, 0, 0);

  // 9c) Szene rotation nur, wenn Flag aktiv
  const rotateFlag = (targetPreset === null)
    ? true
    : camPresets[targetPreset].rotate;
  if (rotateFlag) scene.rotation.y += 0.001;

  // 9d) Szene rendern
  renderer.render(scene, camera);
}
// Starte die Animation
animate();









