export const projects = [
  {
    presetIndex: 3,
    loader: './loaders/loaderDemo.js',
    model: './assets/blenderModels/networkFlow.glb',
    transform: { pos: [80,10,60], yaw: 0, scale: 1, spin: true, spinSpeed: 0.0008 },
    hideMode: 'grid'
  },
  {
    presetIndex: 3,
    loader: './loaders/loaderDemo.js',
    model: '/models/mcf.glb',
    transform: { pos: [30,0,0], yaw: 0.1, scale: 5, spin: false },
    hideMode: 'grid'
  },
  // …etc (make sure ids are unique)
];
