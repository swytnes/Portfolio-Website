import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

export function loadModel(parent) {
  const group = new THREE.Group();
  parent.add(group);

  const icons = [
    { url: '../Assets/html5.png',       x: 0, z:  0 },
    { url: '../Assets/css3.png',        x:   0, z:  50 },
    { url: '../Assets/java-script.png', x:  50, z:  50 },
    { url: '../Assets/java.png',        x: -50, z:   0 },
    { url: '../Assets/sql.png',         x:   0, z:   0 },
    { url: '../Assets/github.png',      x:  50, z:   0 },
    { url: '../Assets/python.png',      x: -50, z: -50 },
    { url: '../Assets/r.png',           x:   0, z: -50 },
    { url: '../Assets/tex.jpeg',        x:  50, z: -50 }
  ];

  icons.forEach(({ url, x, z }) => {
    // 1) Lade das Bild
    const tex = new THREE.TextureLoader().load(url);
    // 2) Baue das Sprite-Material
    const mat = new THREE.SpriteMaterial({
      map:         tex,
      transparent: true,
      opacity:     0
    });
    // 3) Erzeuge das Sprite und füge es zur Gruppe hinzu
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(30, 30, 1);
    sprite.position.set(x, 15, z);
    sprite.frustumCulled = false;       // niemals aus dem View frusten
    sprite.renderOrder    = 999;        // immer zuletzt rendern
    sprite.material.depthTest = false;  // über alle Geometrien drüber
    group.add(sprite);
  });

  return group;
}





