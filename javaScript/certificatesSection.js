// js/certificatesSection.js
import { certificates } from './certificatesData.js';

/**
 * Certificates cover-flow with a left rail:
 * [up arrow]
 *   Certificates
 * [down arrow] | | carousel
 */
export function initCertificates(root, { onActivate, onOpen } = {}) {
  root.innerHTML = `
    <div class="certs-grid">
      <aside class="certs-aside">
        <button class="nav-btn up"   type="button" aria-label="Previous">▲</button>
        <h3 class="certs-title">Certificates</h3>
        <button class="nav-btn down" type="button" aria-label="Next">▼</button>
      </aside>

      <div class="certs-divider" aria-hidden="true"></div>

      <div class="cf" aria-label="Certificates cover flow">
        <div class="stage" role="listbox" aria-orientation="vertical"></div>
      </div>
    </div>
  `;

  const cf     = root.querySelector('.cf');
  const stage  = root.querySelector('.stage');
  const btnUp  = root.querySelector('.nav-btn.up');
  const btnDn  = root.querySelector('.nav-btn.down');

  let active = 0;

  // Build cells
  const cells = certificates.map((c, i) => {
    const el = document.createElement('button');
    el.className = 'cell';
    el.type = 'button';
    el.setAttribute('role', 'option');
    el.dataset.index = i;
    el.innerHTML = `
      <span class="title">${c.title}</span>
      <span class="open" title="Open">▶</span>
    `;
    el.addEventListener('click', () => setActive(i, true));
    el.querySelector('.open').addEventListener('click', (e) => {
      e.stopPropagation();
      setActive(i, false);
      onOpen && onOpen(i, certificates[i]);
    });
    stage.appendChild(el);
    return el;
  });

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function setActive(i, fireActivate = false){
    active = clamp(i, 0, certificates.length - 1);
    render();
    if (fireActivate && onActivate) onActivate(active, certificates[active]);
  }

  function render(){
    const styles    = getComputedStyle(cf);
    const gap       = parseFloat(styles.getPropertyValue('--gap'))       || 92;
    const tilt      = parseFloat(styles.getPropertyValue('--tilt'))      || 12;
    const minScale  = parseFloat(styles.getPropertyValue('--min-scale')) || 0.78;

    cells.forEach((el, i) => {
      const d = i - active; const ad = Math.abs(d);
      const visible = ad <= 3;
      el.style.display = visible ? '' : 'none';

      const y     = d * gap;
      const scale = Math.max(minScale, 1 - ad * 0.10);
      const rot   = d === 0 ? 0 : (d > 0 ? -tilt : tilt);

      el.style.transform =
        `translate3d(-50%, ${y}px, 0) scale(${scale}) rotateX(${rot}deg)`;
      el.style.opacity = d === 0 ? 1 : (1 - Math.min(ad * 0.18, 0.45));
      el.style.filter  = d === 0 ? 'none' : `blur(var(--blur))`;
      el.style.zIndex  = String(100 - ad);

      el.setAttribute('aria-selected', String(d === 0));
      el.tabIndex = d === 0 ? 0 : -1;
    });

    btnUp.disabled = active <= 0;
    btnDn.disabled = active >= certificates.length - 1;
  }

  // Controls
  btnUp .addEventListener('click', () => setActive(active - 1, true));
  btnDn .addEventListener('click', () => setActive(active + 1, true));

  // Wheel / keys / touch
  let wheelLock = false;
  cf.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (wheelLock) return;
    wheelLock = true;
    setActive(active + (e.deltaY > 0 ? 1 : -1), true);
    setTimeout(() => (wheelLock = false), 220);
  }, { passive: false });

  cf.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); setActive(active + 1, true); }
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); setActive(active - 1, true); }
    if (e.key === 'Enter' || e.key === ' ')            { e.preventDefault(); onOpen && onOpen(active, certificates[active]); }
  });

  let touchStart = 0;
  cf.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientY; }, { passive: true });
  cf.addEventListener('touchmove', (e) => {
    const dy = e.touches[0].clientY - touchStart;
    if (Math.abs(dy) > 40) {
      e.preventDefault();
      setActive(active + (dy < 0 ? 1 : -1), true);
      touchStart = e.touches[0].clientY;
    }
  }, { passive: false });

  // Initial
  setActive(0, true);
}




