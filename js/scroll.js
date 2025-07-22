// scroll.js

(function() {
  const navbar = document.querySelector('.navbar');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY) {
      // Beim Runterscrollen: Navbar ausblenden
      navbar.classList.add('hidden');
    } else {
      // Beim Hochscrollen: Navbar einblenden
      navbar.classList.remove('hidden');
    }

    lastScrollY = currentScrollY;
  });
})();
