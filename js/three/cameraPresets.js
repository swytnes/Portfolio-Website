// cameraPresets.js
export const camPresets = [
  // 0: Hero
  { pos: [200,50,200], rotate: true, target: [0,20,100],
    world: { pos:[0,0,0], yaw: 0.0, scale: 0.8 }, showWorld: true, showHelpers: true },

  // 1: Education 
  { pos: [0,0,200], rotate: false, target: [0,0,0],
    world: { pos:[0,0,0], yaw: 0, pitch: 0, scale: 1 }, showWorld: true, showHelpers: true },

  // 2: Experience — grid visible, slightly right
  { pos: [180,100,120], rotate: true, target: [0,0,0],
    world: { pos:[0,0,0], yaw: 0.1, scale: 0.7 }, showWorld: true, showHelpers: true },

  // 3: Projects — grid left, content on the right
  { pos: [220,120,80], rotate: true, target: [0,0,0],
    world: { pos:[0,0,0], yaw: 0.12, scale: 0.7 }, showWorld: true, showHelpers: true },

  // 4: Certificates — grid right, content left (mirror)
  { pos: [0,0,100], rotate: false, target: [0,0,0],
    world: { pos:[40,-30,0], yaw: 0.00, scale: 0.4 }, showWorld: false, showHelpers: true },

  // 5: Contact — pulled back a bit
  { pos: [50,50,50], rotate: false, target: [0,0,0],
    world: { pos:[0,0,0], yaw: 0.0, scale: 1 }, showWorld: true, showHelpers: true },

  // 6: Hidden world demo
  { pos: [0,100,200], rotate: false, target: [0,0,0],
    world: { pos:[0,0,0], yaw: 0.0, scale: 1 }, showWorld: false, showHelpers: false },

  // 7: No helpers preset
  { pos: [100,100,100], rotate: false, target: [0,0,0],
    world: { pos:[0,0,0], yaw: 0, scale: 1 }, showWorld: false, showHelpers: false }
];

// Map section IDs to camera preset indices
export const sectionPresets = {
  hero: 0,
  education: 1,
  experience: 2,
  projects: 3,
  certificates: 4,
  contact: 5,
  hidden: 6,
  nohelpers: 7
};
