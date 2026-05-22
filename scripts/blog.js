// blog.js — listing page
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // year + clock
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

  // cursor spotlight
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

  // load posts
  const list = document.querySelector('[data-post-list]');
  const archive = document.querySelector('[data-archive]');
  const tagCloud = document.querySelector('[data-tags]');
  const countEl = document.querySelector('[data-count]');
  const lastEl = document.querySelector('[data-last]');

  const fmtDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toISOString().slice(0, 10);
  };

  fetch('posts.json', { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error('posts.json ' + r.status);
      return r.json();
    })
    .then((data) => {
      const posts = (data.posts || []).slice().sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0
      );

      // listing
      list.innerHTML = '';
      posts.forEach((p, i) => {
        const li = document.createElement('li');
        li.className = 'post-row';
        const id = String(i + 1).padStart(3, '0');
        li.innerHTML = `
          <a class="post-row__link" href="posts/${encodeURIComponent(p.slug)}/">
            <span class="post-row__id">${id}</span>
            <time class="post-row__date" datetime="${p.date}">${fmtDate(p.date)}</time>
            <span class="post-row__title"></span>
            <span class="post-row__arrow" aria-hidden="true">→</span>
          </a>
          <p class="post-row__summary"></p>
          <ul class="post-row__tags"></ul>
        `;
        li.querySelector('.post-row__title').textContent = p.title;
        li.querySelector('.post-row__summary').textContent = p.summary || '';
        const tagsUl = li.querySelector('.post-row__tags');
        (p.tags || []).forEach((t) => {
          const tag = document.createElement('li');
          tag.textContent = t;
          tagsUl.appendChild(tag);
        });
        list.appendChild(li);
      });

      // archive — grouped by year
      const byYear = new Map();
      posts.forEach((p) => {
        const y = p.date.slice(0, 4);
        if (!byYear.has(y)) byYear.set(y, []);
        byYear.get(y).push(p);
      });
      archive.innerHTML = '';
      [...byYear.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .forEach(([year, items]) => {
          const block = document.createElement('div');
          block.className = 'archive__year';
          block.innerHTML = `<h3 class="archive__title">${year}</h3>`;
          const ul = document.createElement('ul');
          ul.className = 'archive__list';
          items.forEach((p) => {
            const li = document.createElement('li');
            li.innerHTML = `
              <a class="archive__row" href="posts/${encodeURIComponent(p.slug)}/">
                <time>${fmtDate(p.date)}</time>
                <span class="archive__title-text"></span>
                <span class="archive__arrow" aria-hidden="true">→</span>
              </a>
            `;
            li.querySelector('.archive__title-text').textContent = p.title;
            ul.appendChild(li);
          });
          block.appendChild(ul);
          archive.appendChild(block);
        });

      // tags
      const tagCount = new Map();
      posts.forEach((p) => (p.tags || []).forEach((t) => {
        tagCount.set(t, (tagCount.get(t) || 0) + 1);
      }));
      tagCloud.innerHTML = '';
      [...tagCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([t, n]) => {
          const li = document.createElement('li');
          li.className = 'tag-cloud__item';
          li.innerHTML = `<span class="tag-cloud__name"></span><span class="tag-cloud__count">${n}</span>`;
          li.querySelector('.tag-cloud__name').textContent = t;
          tagCloud.appendChild(li);
        });

      // status
      if (countEl) countEl.textContent = posts.length;
      if (lastEl) lastEl.textContent = posts[0] ? fmtDate(posts[0].date) : '—';
    })
    .catch((err) => {
      console.error(err);
      list.innerHTML = '<li class="post-row post-row--err">failed to load posts.json — open via http (not file://)</li>';
    });
})();
