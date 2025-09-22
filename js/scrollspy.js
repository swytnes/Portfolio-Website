// Spotlight effect (keep your nice cursor glow)
document.addEventListener("mousemove", (e) => {
  document.body.style.setProperty("--x", `${e.clientX}px`);
  document.body.style.setProperty("--y", `${e.clientY}px`);
});

// Sidebar highlighting with IntersectionObserver
export function initScrollSpy() {
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".content-sidebar a");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute("id");
        const link = document.querySelector(`.content-sidebar a[href="#${id}"]`);
        if (entry.isIntersecting && link) {
          navLinks.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
        }
      });
    },
    {
      root: null,
      rootMargin: "-40% 0px -40% 0px", // active when near middle 20% of screen
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

// Auto-highlight content boxes with IntersectionObserver
export function initBoxSpy() {
  const boxes = document.querySelectorAll(".content-box");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          boxes.forEach((b) => b.classList.remove("active"));
          entry.target.classList.add("active");
        }
      });
    },
    {
      root: null,
      rootMargin: "-40% 0px -40% 0px", // active when near middle 20% of screen
      threshold: 0,
    }
  );

  boxes.forEach((box) => observer.observe(box));
}