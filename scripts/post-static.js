// post-static.js — runtime niceties for pre-rendered post pages
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    const tick = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, '0');
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      const s = String(d.getUTCSeconds()).padStart(2, '0');
      const v = `${h}:${m}:${s} UTC`;
      clocks.forEach((c) => (c.textContent = v));
    };
    tick();
    setInterval(tick, 1000);
  }

  if (!reduceMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let raf = 0;
    const root = document.documentElement;
    addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        root.style.setProperty('--mx', `${e.clientX}px`);
        root.style.setProperty('--my', `${e.clientY}px`);
        raf = 0;
      });
    }, { passive: true });
  }

  // active TOC heading on scroll
  const tocLinks = new Map(
    [...document.querySelectorAll('.rail__toc-list a')].map((a) => [
      a.getAttribute('href').slice(1),
      a,
    ])
  );
  if (tocLinks.size) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const link = tocLinks.get(e.target.id);
        if (!link) return;
        if (e.isIntersecting) {
          tocLinks.forEach((l) => l.parentElement.classList.remove('is-active'));
          link.parentElement.classList.add('is-active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    tocLinks.forEach((_, id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }
})();
