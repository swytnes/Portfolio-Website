import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';


// ─── 1) Canvas-Setup
const container = document.getElementById('three-container');
const scene     = new THREE.Scene();
const renderer  = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);  // Schwarz mit 0% Deckkraft
scene.background = null;

// sorgt für High‑DPI/Zoom‑Support
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// ─── 2) Kamera‑Presets
const camPresets = [
  { pos: new THREE.Vector3(200,100,100), rotate:true  },
  { pos: new THREE.Vector3(0,  200,  0), rotate:false },
  { pos: new THREE.Vector3(0,  200,  0), rotate:false  },
  { pos: new THREE.Vector3(50, 50,   50), rotate:true  },
  { pos: new THREE.Vector3(300, 200, 0), rotate:true }    
];

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.copy(camPresets[0].pos);
camera.lookAt(0, 0, 0);




// ─── 3) Helpers & Licht
scene.add(new THREE.GridHelper(200, 20, 0xffffff, 0x555555));

const size      = 300;
const divisions = 30;
const colorMain = 0x333333;
const colorGrid = 0x111111;

// XY‐Ebene
const gridXY = new THREE.GridHelper(size, divisions, colorMain, colorGrid);
gridXY.rotation.x = - Math.PI / 2;
scene.add(gridXY);

// XZ‐Ebene
const gridXZ = new THREE.GridHelper(size, divisions, colorMain, colorGrid);
scene.add(gridXZ);

// YZ‐Ebene
const gridYZ = new THREE.GridHelper(size, divisions, colorMain, colorGrid);
gridYZ.rotation.z = Math.PI / 2;
scene.add(gridYZ);




// Grids halbtransparent machen:
[gridXY, gridXZ, gridYZ].forEach(grid => {
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
});

// Achsen als Zylinder, thickness steuerbar über `radius`
const axisLength = 100;
const radius     = 0.5;      
const radialSegs = 8;

// X‑Achse (rot)
const xMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const xGeo = new THREE.CylinderGeometry(radius, radius, axisLength, radialSegs);
const xMesh = new THREE.Mesh(xGeo, xMat);
xMesh.rotation.z = -Math.PI / 2;
xMesh.position.x = axisLength / 2;
scene.add(xMesh);

// Y‑Achse (grün)
const yMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const yGeo = xGeo.clone();
const yMesh = new THREE.Mesh(yGeo, yMat);
yMesh.position.y = axisLength / 2;
scene.add(yMesh);

// Z‑Achse (blau)
const zMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const zGeo = xGeo.clone();
const zMesh = new THREE.Mesh(zGeo, zMat);
zMesh.rotation.x = Math.PI / 2;
zMesh.position.z = axisLength / 2;
scene.add(zMesh);

// Licht
scene.add(new THREE.AmbientLight(0x888888));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(50, 100, 50);
scene.add(dirLight);

// ─── 4) Scroll & Click Flags
let scrollT = 0;
let targetPreset = null;
let isProgrammaticScroll = false;





// ─── 4) Klick‑Handler: dynamisch Module laden + scroll & Kamera reset
let currentModelGroup = null;

document.querySelectorAll('.project-card').forEach(card => {
  const idx = parseInt(card.dataset.camIndex, 10);
  const btn = card.querySelector('.load-model');
  if (!isNaN(idx) && btn) {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      // scroll‑to‑top & reset rotation…
      isProgrammaticScroll = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => isProgrammaticScroll = false, 1000);
      scene.rotation.set(0, 0, 0);
      targetPreset = idx;

      // altes Modell entfernen
      if (currentModelGroup) {
        scene.remove(currentModelGroup);
        currentModelGroup.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material)  o.material.dispose();
        });
      }

      // neues Modell laden
      try {
        const mod = await import(`./model${idx}.js`);
        const g   = new THREE.Group();
        scene.add(g);
        currentModelGroup = g;
        mod.loadModel(g);
      } catch (err) {
        console.error(`Fehler beim Laden von model${idx}.js:`, err);
      }
    });
  }
});

// Skills Modul laden
let skillsGroup = null;

// 1) Skills‑Modul sofort laden (aber zunächst versteckt)
(async () => {
  const mod = await import('./skills.js');  // dein js/skills.js
  const g   = new THREE.Group();
  // Position initial hochsetzen
  g.position.y = 200;
  scene.add(g);
  skillsGroup = g;
  mod.loadModel(g);
})();


window.addEventListener('scroll', () => {
  // 1) Programmatic Scroll ausschließen
  if (isProgrammaticScroll) return;

  // 2) Kamera‑Preset via scrollT
  targetPreset = null;
  const scrollY   = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  scrollT = Math.min(1, Math.max(0, scrollY / maxScroll));

  // 3) SkillsGroup muss existieren
  if (!skillsGroup || !skillsGroup.children) return;

  // 4) Section‑Bounds präzise abfragen
  const sec  = document.getElementById('skills');
  const rect = sec.getBoundingClientRect();
  const inView = rect.top < window.innerHeight && rect.bottom > 0;

  if (inView) {
    // 5) Kamera auf Skills‑Preset umschalten
    targetPreset = 4;

    // 6) Normierten Fortschritt t ∈ [0,1] berechnen
    const total = window.innerHeight + sec.offsetHeight;
    const t     = Math.min(1,
                    Math.max(0,
                      (window.innerHeight - rect.top) / total
                    )
                  );

    // 7) Icons einblenden und per Lerp nach unten fliegen
    skillsGroup.children.forEach(obj => {
      if (obj.material) {
        obj.material.opacity = t;
        obj.position.y      = THREE.MathUtils.lerp(200, 0, t);
      }
    });

  } else {
    // 8) Icons zurücksetzen
    skillsGroup.children.forEach(obj => {
      if (obj.material) {
        obj.material.opacity = 0;
        obj.position.y      = 200;
      }
    });
  }
});









// ─── 5) Animations‑Loop
function animate() {
  requestAnimationFrame(animate);

  // gewünschte Kamera-Position
  let desiredPos;
  if (targetPreset === null) {
    const n      = camPresets.length;
    const scaled = scrollT * (n - 1);
    const i      = Math.floor(scaled);
    const alpha  = scaled - i;
    const i2     = Math.min(n - 1, i + 1);
    desiredPos = camPresets[i].pos.clone().lerp(camPresets[i2].pos, alpha);
  } else {
    desiredPos = camPresets[targetPreset].pos;
  }

  camera.position.lerp(desiredPos, 0.05);
  camera.lookAt(0, 0, 0);

  const rotateFlag = (targetPreset === null)
    ? true
    : camPresets[targetPreset].rotate;
  if (rotateFlag) scene.rotation.y += 0.001;

  renderer.render(scene, camera);
}
animate();

// ─── 6) Resize‑Handler
window.addEventListener('resize', () => {
  // DPI & Größe anpassen
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Kamera‑Aspect & Projection neu
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Reset Kamera/Scroll‑State
  camera.position.copy(camPresets[0].pos);
  camera.lookAt(0, 0, 0);
  scrollT = 0;
  targetPreset = null;
  scene.rotation.set(0, 0, 0);
});







