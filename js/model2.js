// js/model2.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

export function loadModel(parent) {
  // 1) Lege eine Gruppe an, rotiere sie auf die XY‑Ebene:
  const g = new THREE.Group();
  g.rotation.x = -Math.PI / 2;  // Kamera schaut von oben => Ebene richtig herum
  parent.add(g);

  // 2) Definiere die Eckpunkte (Counter‑Clockwise)
  const verts2D = [
    new THREE.Vector2(0, 0),    // A (Start, gelb)
    new THREE.Vector2(6, 1),    // B
    new THREE.Vector2(4, 5),    // C
    new THREE.Vector2(2, 4),    // D (Optimal, blau)
    new THREE.Vector2(1, 3)     // E
  ];

  // 3) Form (Shape) & Mesh für rote Kanten
  const shape = new THREE.Shape(verts2D);
  const geom  = new THREE.ShapeGeometry(shape);
  const mat   = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0   // Kanten kommen als Linie, Fläche ist durchsichtig
  });
  const face = new THREE.Mesh(geom, mat);
  g.add(face);

  // 4) Linie um das Shape ziehen
  const edgesGeo = new THREE.EdgesGeometry(geom);
  const edgesMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
  const edges   = new THREE.LineSegments(edgesGeo, edgesMat);
  g.add(edges);

  // 5) Feasible‐Region mit gestrichelter Füllung (Hatching)
  const hatchLines = [];
  const bounds = { minX: 0, maxX: 6, minY: 0, maxY: 5 };
  const step = 0.5;
  for (let x = bounds.minX; x <= bounds.maxX; x += step) {
    // Linie schräg: y = x - c  → wir variieren c
    const c = x;
    const p1 = new THREE.Vector3(bounds.minX, bounds.minX - c, 0);
    const p2 = new THREE.Vector3(bounds.maxX, bounds.maxX - c, 0);
    hatchLines.push(p1, p2);
  }
  const hatchGeo = new THREE.BufferGeometry().setFromPoints(hatchLines);
  const hatchMat = new THREE.LineDashedMaterial({
    color: 0x444444,
    dashSize: 0.2,
    gapSize: 0.2,
    transparent: true,
    opacity: 0.5
  });
  const hatch = new THREE.LineSegments(hatchGeo, hatchMat);
  hatch.computeLineDistances();
  g.add(hatch);

  // 6) Eckpunkte als kleine Kugeln
  const sphereGeo = new THREE.SphereGeometry(0.15, 16, 16);
  verts2D.forEach((v, i) => {
    const color = (i === 0)
      ? 0xffff00              // A = Start = gelb
      : (i === 3)
        ? 0x0000ff            // D = Optimal = blau
        : 0x00ff00;           // alle anderen = grün
    const matPoint = new THREE.MeshBasicMaterial({ color });
    const pt = new THREE.Mesh(sphereGeo, matPoint);
    pt.position.set(v.x, v.y, 0.01);
    g.add(pt);
  });

  // 7) Pfeile zwischen den Ecken (Movement)
  for (let i = 0; i < verts2D.length - 1; i++) {
    const from = verts2D[i];
    const to   = verts2D[i+1];
    const dir  = new THREE.Vector3(to.x - from.x, to.y - from.y, 0).normalize();
    const origin = new THREE.Vector3(from.x, from.y, 0.02);
    const arrow = new THREE.ArrowHelper(dir, origin, from.distanceTo(to), 0x000000, 0.3, 0.2);
    g.add(arrow);
  }

    // 2) Jetzt skalieren:
  const uniformScale = 10;     // 10× so groß
  g.scale.set(uniformScale, uniformScale, uniformScale);

  parent.add(g);
}
