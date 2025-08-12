// js/scroll.js
// Full-page section snap controller (no libs)

export function initScrollSnap({
  sections = Array.from(document.querySelectorAll('main > section')),
  onSectionChange = null,     // (index, section) => void
  lockMs = 850,               // cooldown between jumps
  threshold = 0.6,            // IO ratio to consider a section active
  respectReducedMotion = true // disable smooth if user prefers reduced motion
} = {}) {
  if (!sections.length) return console.warn('[scroll] No sections found.');

  const prefersReduced =
    respectReducedMotion &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let currentIndex = findActiveIndex();
  let locked = false;    // prevent multiple jumps per gesture
  let touchStartY = 0;   // for swipe detection
  let io = null;

  // --- helpers ---------------------------------------------------------------

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function findActiveIndex() {
    // pick the section covering the viewport center, else nearest
    const center = window.innerHeight / 2;
    let best = 0, bestDist = Infinity;
    sections.forEach((sec, i) => {
      const r = sec.getBoundingClientRect();
      const inRange = r.top <= center && r.bottom >= center;
      const dist = Math.abs(r.top - 0); // distance from top is enough fallback
      if (inRange) { best = i; bestDist = 0; return; }
      if (dist < bestDist) { best = i; bestDist = dist; }
    });
    return best;
  }

  function scrollToIndex(i, opts = {}) {
    const behavior = prefersReduced ? 'auto' : (opts.behavior || 'smooth');
    sections[i]?.scrollIntoView({ behavior, block: 'start' });
  }

  function applyIndex(i) {
    if (i === currentIndex) return;
    currentIndex = i;
    if (typeof onSectionChange === 'function') {
      onSectionChange(i, sections[i]);
    }
    // Optional: update hash without jank
    history.replaceState(null, '', `#${sections[i].id || ''}`);
  }

  // --- intersection observer to set currentIndex ----------------------------

  io = new IntersectionObserver((entries) => {
    // choose the most visible section
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const idx = sections.indexOf(visible.target);
    if (idx !== -1) applyIndex(idx);
  }, { root: null, threshold });

  sections.forEach(sec => io.observe(sec));

  // --- wheel (desktop / trackpad) -------------------------------------------

  function onWheel(e) {
    // We take over page scrolling to jump exactly one section per gesture
    e.preventDefault();

    if (locked) return;
    locked = true;

    const dir = e.deltaY > 0 ? 1 : -1;
    const next = clamp(currentIndex + dir, 0, sections.length - 1);
    scrollToIndex(next);

    window.setTimeout(() => { locked = false; }, lockMs);
  }

  window.addEventListener('wheel', onWheel, { passive: false });

  // --- keyboard (PgUp/PgDn/Space/Arrows) ------------------------------------

  function onKey(e) {
    if (locked) return;
    const keysNext = ['ArrowDown', 'PageDown', ' '];
    const keysPrev = ['ArrowUp', 'PageUp'];
    if (![...keysNext, ...keysPrev].includes(e.key)) return;

    e.preventDefault();
    locked = true;

    const dir = keysNext.includes(e.key) ? 1 : -1;
    const next = clamp(currentIndex + dir, 0, sections.length - 1);
    scrollToIndex(next);

    window.setTimeout(() => { locked = false; }, lockMs);
  }

  window.addEventListener('keydown', onKey, { passive: false });

  // --- touch (mobile swipe) --------------------------------------------------

  function onTouchStart(e) { touchStartY = e.touches?.[0]?.clientY ?? 0; }
  function onTouchMove(e) {
    if (locked) return;
    const y = e.touches?.[0]?.clientY ?? 0;
    const dy = y - touchStartY;
    const thresholdPx = 40; // small swipe threshold

    if (Math.abs(dy) > thresholdPx) {
      e.preventDefault();
      locked = true;

      const dir = dy < 0 ? 1 : -1; // swipe up => go next
      const next = clamp(currentIndex + dir, 0, sections.length - 1);
      scrollToIndex(next);

      window.setTimeout(() => { locked = false; }, lockMs);
    }
  }

  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });

  // --- resize: keep index sane ----------------------------------------------
  function onResize() {
    // after a resize, re-center to the current section to avoid half-positions
    scrollToIndex(currentIndex, { behavior: 'auto' });
  }
  window.addEventListener('resize', onResize);

  // --- init to nearest section on load --------------------------------------
  // (helps if user refreshes with a middle position)
  applyIndex(findActiveIndex());
  scrollToIndex(currentIndex, { behavior: 'auto' });

  // --- optional cleanup ------------------------------------------------------
  function destroy() {
    io?.disconnect();
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('resize', onResize);
  }

  return { destroy, get index() { return currentIndex; }, scrollToIndex };
}
