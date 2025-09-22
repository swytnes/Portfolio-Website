// js/scroll.js
// Full-page section snap controller (no libs)

export function initScrollSnap({
  sections = Array.from(document.querySelectorAll('main section[id]')),
  onSectionChange = null,     // (index, section) => void
  threshold = 0.6,            // IO ratio to consider a section active
  respectReducedMotion = true // disable smooth if user prefers reduced motion
} = {}) {
  if (!sections.length) return console.warn('[scroll] No sections found.');

  const prefersReduced =
    respectReducedMotion &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let currentIndex = -1;
  let io = null;

  function applyIndex(i) {
    if (i === currentIndex) return;
    currentIndex = i;
    if (typeof onSectionChange === 'function') {
      onSectionChange(i, sections[i]);
    }
    // Optional: update hash without jank
    history.replaceState(null, '', `#${sections[i].id || ''}`);
  }

  io = new IntersectionObserver((entries) => {
    // choose the most visible section
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    console.log("Visible section:", visible?.target?.id);
    if (!visible) return;
    const idx = sections.indexOf(visible.target);
    if (idx !== -1) applyIndex(idx);
  }, { root: null, threshold: 0.0, rootMargin: "0px 0px -50% 0px" });

  sections.forEach(sec => io.observe(sec));


  applyIndex(
    sections.findIndex(sec => {
      const rect = sec.getBoundingClientRect();
      return rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;
    }) || 0
  );

  function destroy() {
    io?.disconnect();
  }

  return {
    destroy,
    get index() { return currentIndex; }
  };
}
