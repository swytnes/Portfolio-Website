export const projects = [
  {
    id: 'facility-location',
    title: 'Spillover Effects in Competitive Facility Location',
    blurb: 'Random Utility + competitive siting; group of 2.',
    tags: ['OM', 'Research'],
    presetIndex: 3,
    loader: './loaders/loaderDemo.js',
    model: './Assets/blenderModels/halfspacesTest.glb',
    transform: { pos: [0,0,0], yaw: 0, scale: 8, spin: true, spinSpeed: 0.0008 }
  },
  {
    id: 'mcf-gurobi-1',
    title: 'Minimum-Cost Flow (Gurobi)',
    blurb: 'Network optimization, Python + Gurobi.',
    tags: ['Optimization', 'Python'],
    presetIndex: 3,
    loader: './loaders/loaderDemo.js',
    model: '/models/mcf.glb',
    transform: { pos: [30,0,0], yaw: 0.1, scale: 5, spin: false }
  },
  {
    id: 'recipes-platform',
    title: 'Rezeptplattform',
    blurb: 'Share & rate recipes with reviews.',
    tags: ['Web', 'DB'],
    presetIndex: 3,
    loader: './loaders/universal-loader.js',
    model: '/models/recipes.glb',
    transform: { pos: [-20,0,10], yaw: -0.1, scale: 6, spin: true, spinSpeed: 0.0012 }
  },
  // …etc (make sure ids are unique)
];

