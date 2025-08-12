import { projects } from './projectsData.js';

export function initProjects(rootEl, { onActivate, onOpen } = {}) {
  const wrap = document.createElement('div');
  // add BOTH classes: horizontal + coverflow (so base styles still apply)
  wrap.className = 'carousel horizontal coverflow';
  wrap.innerHTML = `
    <button class="arrow prev" aria-label="Previous">◀</button>
    <div class="rail" role="list"></div>
    <button class="arrow next" aria-label="Next">▶</button>
  `;
  const rail = wrap.querySelector('.rail');
  rootEl.appendChild(wrap);

  // Build cards
  projects.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('role','listitem');
    card.dataset.index = i;
    card.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.blurb}</p>
      <div class="chips">${p.tags.map(t=>`<span>${t}</span>`).join('')}</div>
      <div style="display:flex; gap:.5rem;">
        <button class="btn open">View on grid</button>
        <button class="btn secondary focus">Focus</button>
      </div>
    `;
    rail.appendChild(card);
  });

  const cards = [...rail.children];
  const ro = new ResizeObserver(updateCenterBias);
  ro.observe(wrap);
  window.addEventListener('resize', updateCenterBias);
  updateCenterBias();

function updateCenterBias(){
  const cs = getComputedStyle(wrap);
  const ratio = parseFloat(cs.getPropertyValue('--center-ratio')) || 0.38;
  const w = wrap.clientWidth || rail.clientWidth || 0;
  // shift from true center so the active card sits at ratio * width
  const bias = (w * ratio) - (w * 0.5);
  wrap.style.setProperty('--center-bias', `${bias}px`);
}
  // Compute dynamic card height for the rail (optional but nice)
  const measure = () => {
    const probe = cards[0];
    if (!probe) return;
    const h = Math.max(320, Math.ceil(probe.getBoundingClientRect().height + 32));
    wrap.style.setProperty('--card-h', `${h}px`);
  };
  measure();
  window.addEventListener('resize', measure);

  // Cover-flow state
  let active = 0;
  const clamp = (n,min,max) => Math.min(Math.max(n,min),max);

  // Core layout: position every card by distance from "active"
const render = () => {
  const cs = getComputedStyle(wrap);
  const spacing    = parseFloat(cs.getPropertyValue('--spacing')) || 160;
  const tiltDeg    = parseFloat(cs.getPropertyValue('--tilt')) || 8;
  const scaleStep  = parseFloat(cs.getPropertyValue('--scale-step')) || 0.08;
  const opStep     = parseFloat(cs.getPropertyValue('--opacity-step')) || 0.12;
  const blurStep   = parseFloat(cs.getPropertyValue('--blur-step')) || 0.45;
  const maxSpread  = parseInt(cs.getPropertyValue('--max-spread')) || 4;
  const centerBias = parseFloat(cs.getPropertyValue('--center-bias')) || 0;

  cards.forEach((card, i) => {
    const d  = i - active;              // distance from center
    const ad = Math.abs(d);

    // hide far neighbors
    if (ad > maxSpread){
      const dir = d > 0 ? 1 : -1;
      const off = (maxSpread + 0.8) * spacing * dir + centerBias;
      card.style.opacity   = '0';
      card.style.filter    = 'none';
      card.style.transform = `translate(-50%,-50%) translateX(${off}px) translateZ(-600px) scale(.5) rotateY(${dir>0?-tiltDeg:tiltDeg}deg)`;
      card.style.pointerEvents = 'none';
      card.style.zIndex = '0';
      card.setAttribute('aria-selected','false');
      return;
    }

    const x    = d * spacing + centerBias;
    const z    = -140 * ad;                       // <-- push neighbors back
    const s    = Math.max(.55, 1 - ad * scaleStep);
    const rot  = d === 0 ? 0 : (d > 0 ? -tiltDeg : tiltDeg);
    let   op   = Math.max(.18, 1 - ad * opStep);
    let   blur = Math.max(0, ad * blurStep);

    if (ad === 0){ op = 1; blur = 0; }            // center is perfectly crisp

    card.style.zIndex  = String(1000 - ad);
    card.style.opacity = op.toFixed(3);
    card.style.filter  = blur ? `blur(${blur}px)` : 'none';
    card.style.transform =
      `translate(-50%,-50%) translateX(${x}px) translateZ(${z}px) scale(${s}) rotateY(${rot}deg)`;
    card.style.pointerEvents = ad <= 1 ? 'auto' : 'none';
    card.setAttribute('aria-selected', String(i === active));
  });

  onActivate?.(active, projects[active]);
};



  // Navigation
  const goPrev = () => { active = clamp(active - 1, 0, cards.length - 1); render(); };
  const goNext = () => { active = clamp(active + 1, 0, cards.length - 1); render(); };

  wrap.querySelector('.prev').addEventListener('click', goPrev);
  wrap.querySelector('.next').addEventListener('click', goNext);

  // Card clicks
  rail.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const i = Number(card.dataset.index);
    if (e.target.matches('.open')) onOpen?.(i, projects[i]);
    if (e.target.matches('.focus') || !e.target.closest('.btn')) {
      active = i; render();
    }
  });

  // Keyboard nav (optional)
  wrap.tabIndex = 0;
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); goNext(); }
  });

  // Initial paint
  render();
}

