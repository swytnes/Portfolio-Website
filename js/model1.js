import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

export function loadModel(parent) {
  // 1) Erstelle eine eigene Sub‑Group für Dein Modell
  const group = new THREE.Group();
  
  // 2) Positioniere & rotiere die Gruppe
  group.rotation.x = - Math.PI / 2;
  group.position.set(0, 0, 0);
  
  // 3) Baue Dein Geo und füge es in diese Sub‑Group ein
  const geo  = new THREE.BoxGeometry(80, 80, 0);   // fast flach
  const mat  = new THREE.MeshPhongMaterial({ color: 0xffff00 });
  const mesh = new THREE.Mesh(geo, mat);


  mesh.position.set(40, -40, 0);  // leicht über der Ebene
  
  group.add(mesh);

  // 4) Die Sub‑Group in die übergeordnete Szene/Group einhängen
  parent.add(group);
}