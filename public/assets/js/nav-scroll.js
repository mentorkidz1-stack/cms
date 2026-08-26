(function () {
  var nav = document.getElementById('site-navbar');
  if (!nav) return;

  var THRESHOLD = 24;

  function updateNavState() {
    if (window.scrollY > THRESHOLD) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  }

  updateNavState();
  window.addEventListener('scroll', updateNavState, { passive: true });
})();
