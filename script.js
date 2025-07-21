// ─────────── Modelldaten mit LaTeX-Formeln ───────────
const messages = [
  { 
    name: "Transportproblem",
    description: "Minimiere Transportkosten bei gegebener Kapazität & Nachfrage.",
    formulation: "\\displaystyle \\min_{x} \\sum_{i,j} c_{ij}x_{ij}\\quad s.t.\\;\\sum_j x_{ij}\\le s_i,\\;\\sum_i x_{ij}=d_j"
  },
  {
    name: "Diätproblem",
    description: "Minimiere Kosten unter Nährstoffanforderungen.",
    formulation: "\\displaystyle \\min_{x} \\sum_i p_i x_i\\quad s.t.\\;\\sum_i a_{ik}x_i\\ge b_k"
  },
];

// ─────────── Canvas‑Setup ───────────
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ─────────── Grid Animation ───────────
let offset    = 0;
const speed   = 0.2;   
const gridSize = 50;   

function drawGrid() {
  const w = canvas.width, h = canvas.height;

  // Hintergrund
  ctx.fillStyle = '#9e9e9eff';
  ctx.fillRect(0, 0, w, h);

  // Gitterlinien
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.33)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  for (let x = (offset % gridSize); x < w; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = (offset % gridSize); y < h; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Achsen
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.67)';
  ctx.lineWidth   = 4;
  ctx.beginPath();
  ctx.moveTo(0, h/2);
  ctx.lineTo(w, h/2);
  ctx.moveTo(w/2, 0);
  ctx.lineTo(w/2, h);
  ctx.stroke();

  offset += speed;
}

// ─────────── TextParticle-Klasse (Canvas-basiert) ───────────
class TextParticle {
  constructor() {
    this.reset();
  }
  reset() {
    const m = messages[Math.floor(Math.random() * messages.length)];
    this.name        = m.name;
    this.description = m.description;
    this.formula     = m.formulation;

    // Position im Canvas
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    this.age      = 0;
    this.duration = 1000; 
    this.alpha    = 0;
  }
  update() {
    this.age++;
    // Fade‑In/Out
    if (this.age < 30) this.alpha = this.age / 30;
    else if (this.age > this.duration - 30) this.alpha = (this.duration - this.age) / 30;
    else this.alpha = 1;

    if (this.age >= this.duration) this.reset();
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = '#c0c0c0';
    ctx.font        = 'bold 20px monospace';

    // Name
    ctx.fillText(this.name, this.x + offset, this.y);
    // Description
    ctx.fillText(this.description, this.x + offset, this.y + 24);
    // Formulierung als einfacher Text (LaTeX nicht gerendert im Canvas)
    ctx.fillText(this.formula, this.x + offset, this.y + 48);

    ctx.restore();
  }
}

// ─────────── Instanziere einige TextParticles ───────────
const textParticles = Array.from({ length: 1 }, () => new TextParticle());

// ─────────── Haupt‑Animationsschleife ───────────
function animate() {
  drawGrid();

  textParticles.forEach(tp => {
    tp.update();
    tp.draw();
  });

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);













// ─────────── Throttled & Passive Scroll‑Listener ───────────
let lastScrollY = window.scrollY;
let ticking    = false;

function onScroll() {
  const header   = document.querySelector('.navbar');
  const currentY = lastScrollY;

  // 1) Nach unten scroll → ausblenden
  if (currentY > 100 && currentY > window._prevScrollY) {
    header.classList.add('hidden');
  } else {
    header.classList.remove('hidden');
  }

  // 2) Shrink‑Effekt ab 50px
  if (currentY > 50) {
    header.classList.add('shrink');
  } else {
    header.classList.remove('shrink');
  }

  window._prevScrollY = currentY;
  ticking = false;
}

window.addEventListener('scroll', () => {
  lastScrollY = window.scrollY;
  if (!ticking) {
    window.requestAnimationFrame(onScroll);
    ticking = true;
  }
}, { passive: true });  // passive flag verbessert Scroll‑Performance



