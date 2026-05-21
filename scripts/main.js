// dmytro.my — minimal interactions, no deps.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // year
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // live clock (HH:MM:SS · UTC)
  const clockEl = document.querySelector('[data-clock]');
  if (clockEl) {
    const tick = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, '0');
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      const s = String(d.getUTCSeconds()).padStart(2, '0');
      clockEl.textContent = `${h}:${m}:${s} UTC`;
    };
    tick();
    setInterval(tick, 1000);
  }

  // session uptime
  const upEl = document.querySelector('[data-uptime]');
  if (upEl) {
    const start = performance.now();
    const tickUp = () => {
      const t = Math.floor((performance.now() - start) / 1000);
      const h = String(Math.floor(t / 3600)).padStart(2, '0');
      const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
      const s = String(t % 60).padStart(2, '0');
      upEl.textContent = `${h}:${m}:${s}`;
    };
    tickUp();
    setInterval(tickUp, 1000);
  }

  // active rail link on scroll
  const railLinks = new Map(
    [...document.querySelectorAll('.rail__link')].map((a) => [
      a.getAttribute('href').slice(1),
      a,
    ])
  );

  const sectionObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const link = railLinks.get(e.target.id);
        if (!link) return;
        if (e.isIntersecting) {
          railLinks.forEach((l) => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );
  document.querySelectorAll('section[id]').forEach((s) => sectionObs.observe(s));

  // reveal blocks (drives stack bars + future entrance hooks)
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          revealObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.18 }
  );
  document.querySelectorAll('.block').forEach((b) => revealObs.observe(b));

  // cursor spotlight (skip on touch / reduced motion)
  if (!reduceMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let raf = 0;
    const root = document.documentElement;
    const cards = document.querySelectorAll('.proj__card');
    addEventListener(
      'pointermove',
      (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          root.style.setProperty('--mx', `${e.clientX}px`);
          root.style.setProperty('--my', `${e.clientY}px`);
          // local cursor on cards
          cards.forEach((c) => {
            const r = c.getBoundingClientRect();
            c.style.setProperty('--mx', `${e.clientX - r.left}px`);
            c.style.setProperty('--my', `${e.clientY - r.top}px`);
          });
          raf = 0;
        });
      },
      { passive: true }
    );
  }

  // scramble effect on h1 (one-shot, fast, plain text)
  const scrambleEl = document.querySelector('[data-scramble]');
  if (scrambleEl) {
    const target = scrambleEl.textContent.trim();
    if (reduceMotion) {
      scrambleEl.textContent = target;
      scrambleEl.classList.add('is-ready');
    } else {
      const pool = '!?#@&%$*+=/abcdefghijklmnopqrstuvwxyz';
      const total = 22;
      const queue = target.split('').map(() => ({
        start: Math.floor(Math.random() * total * 0.5),
        end:   Math.floor(total * 0.6) + Math.floor(Math.random() * total * 0.4),
        char:  '',
      }));

      // seed with placeholders so the box has size before first frame
      scrambleEl.textContent = '\u00A0'.repeat(target.length);
      scrambleEl.classList.add('is-ready');

      let frame = 0;
      const tick = () => {
        let out = '';
        let done = 0;
        for (let i = 0; i < queue.length; i++) {
          const item = queue[i];
          if (frame >= item.end) {
            done++;
            out += target[i];
          } else if (frame >= item.start) {
            if (!item.char || Math.random() < 0.3) {
              item.char = pool[Math.floor(Math.random() * pool.length)];
            }
            out += item.char;
          } else {
            out += '\u00A0';
          }
        }
        scrambleEl.textContent = out;
        if (done < queue.length) {
          frame++;
          requestAnimationFrame(tick);
        } else {
          scrambleEl.textContent = target;
        }
      };
      requestAnimationFrame(tick);
    }
  }
})();
