// cameraPresets.js
export const camPresets = [
  // 0: Intro — centered grid
  { pos: [200,100,100], rotate: true, target: [0,0,0],
    world: { pos:[0,0,0], yaw: 0.0, scale: 1 } },

  // 1: About — grid nudged slightly left
  { pos: [180,120,160], rotate: false, target: [-30,0,0],
    world: { pos:[-30,0,0], yaw: 0.10, scale: 1 } },

  // 2: Education — centered but a tiny yaw
  { pos: [0,200,0], rotate: false, target: [0,0,0],
    world: { pos:[0,0,0], yaw: 0.05, scale: 1 } },

  // 3: Projects — grid left, content on the right
  { pos: [220,120,80], rotate: false, target: [-80,0,0],
    world: { pos:[-80,0,100], yaw: 0.12, scale: 1 } },

  // 4: Certificates — grid right, content left (mirror)
  { pos: [0,0,100], rotate: false, target: [0,0,0],
    world: { pos:[50,-30,0], yaw: 0.00, scale: 0.4 } },

  // 5: Contact — pulled back a bit
  { pos: [50,50,50], rotate: false, target: [0,0,0],
    world: { pos:[0,0,0], yaw: 0.0, scale: 1 } },
];

