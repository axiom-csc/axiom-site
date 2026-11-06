// Lenis smooth scroll.
import Lenis from 'https://esm.sh/lenis@1.3.1';

(function initLenis(){
  var reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (reduced) return;
  var lenis = new Lenis({
    duration: 1.35,
    easing: function(t){ return 1 - Math.pow(1 - t, 3.2); },
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.6,
    lerp: 0.08,
  });
  function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -40, duration: 1.4 });
    });
  });
  window.__lenis = lenis;
})();
