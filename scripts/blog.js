// blog.js — listing page with language filter
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORAGE_KEY = 'blog.lang';

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

  const list = document.querySelector('[data-post-list]');
  const archive = document.querySelector('[data-archive]');
  const tagCloud = document.querySelector('[data-tags]');
  const countEl = document.querySelector('[data-count]');
  const lastEl = document.querySelector('[data-last]');
  const filter = document.querySelector('[data-lang-filter]');
  const emptyEl = document.querySelector('[data-empty]');

  const fmtDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toISOString().slice(0, 10);
  };

  const langOf = (post, defaultLang) => post.lang || defaultLang || 'en';

  // ---- pick initial language ----
  const pickInitial = (defaultLang) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'all' || saved === 'en' || saved === 'ru')) return saved;
    } catch (_) { /* localStorage may be blocked */ }
    return defaultLang || 'en';
  };

  const setActiveChip = (lang) => {
    filter?.querySelectorAll('.lang-chip').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });
  };

  const persistLang = (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
  };

  fetch('posts.json', { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error('posts.json ' + r.status);
      return r.json();
    })
    .then((data) => {
      const site = data.site || {};
      const defaultLang = site.defaultLang || 'en';
      const allPosts = (data.posts || []).slice().sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0
      );

      // counts per lang
      const counts = { all: allPosts.length, en: 0, ru: 0 };
      allPosts.forEach((p) => {
        const l = langOf(p, defaultLang);
        if (counts[l] !== undefined) counts[l]++;
      });
      document.querySelector('[data-count-all]').textContent = counts.all;
      document.querySelector('[data-count-en]').textContent = counts.en;
      document.querySelector('[data-count-ru]').textContent = counts.ru;

      let activeLang = pickInitial(defaultLang);
      // if saved language has 0 posts, fall back to default, then 'all'
      if (activeLang !== 'all' && counts[activeLang] === 0) {
        if (counts[defaultLang] > 0) activeLang = defaultLang;
        else activeLang = 'all';
      }

      const filtered = () => activeLang === 'all'
        ? allPosts
        : allPosts.filter((p) => langOf(p, defaultLang) === activeLang);

      const renderListing = () => {
        const posts = filtered();
        list.innerHTML = '';
        if (!posts.length) {
          emptyEl?.removeAttribute('hidden');
        } else {
          emptyEl?.setAttribute('hidden', '');
        }
        posts.forEach((p, i) => {
          const li = document.createElement('li');
          li.className = 'post-row';
          const id = String(i + 1).padStart(3, '0');
          const lang = langOf(p, defaultLang);
          li.innerHTML = `
            <a class="post-row__link" href="posts/${encodeURIComponent(p.slug)}/" lang="${lang}">
              <span class="post-row__id">${id}</span>
              <time class="post-row__date" datetime="${p.date}">${fmtDate(p.date)}</time>
              <span class="post-row__lang">${lang}</span>
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
      };

      const renderArchive = () => {
        const posts = filtered();
        const byYear = new Map();
        posts.forEach((p) => {
          const y = p.date.slice(0, 4);
          if (!byYear.has(y)) byYear.set(y, []);
          byYear.get(y).push(p);
        });
        archive.innerHTML = '';
        if (!posts.length) {
          archive.innerHTML = '<p class="archive__empty">no posts in this language yet.</p>';
          return;
        }
        [...byYear.entries()]
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .forEach(([year, items]) => {
            const block = document.createElement('div');
            block.className = 'archive__year';
            block.innerHTML = `<h3 class="archive__title">${year}</h3>`;
            const ul = document.createElement('ul');
            ul.className = 'archive__list';
            items.forEach((p) => {
              const lang = langOf(p, defaultLang);
              const li = document.createElement('li');
              li.innerHTML = `
                <a class="archive__row" href="posts/${encodeURIComponent(p.slug)}/" lang="${lang}">
                  <time>${fmtDate(p.date)}</time>
                  <span class="archive__lang">${lang}</span>
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
      };

      const renderTags = () => {
        const posts = filtered();
        const tagCount = new Map();
        posts.forEach((p) => (p.tags || []).forEach((t) => {
          tagCount.set(t, (tagCount.get(t) || 0) + 1);
        }));
        tagCloud.innerHTML = '';
        if (!tagCount.size) {
          tagCloud.innerHTML = '<li class="tag-cloud__empty">no tags yet.</li>';
          return;
        }
        [...tagCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .forEach(([t, n]) => {
            const li = document.createElement('li');
            li.className = 'tag-cloud__item';
            li.innerHTML = `<span class="tag-cloud__name"></span><span class="tag-cloud__count">${n}</span>`;
            li.querySelector('.tag-cloud__name').textContent = t;
            tagCloud.appendChild(li);
          });
      };

      const renderAll = () => {
        setActiveChip(activeLang);
        renderListing();
        renderArchive();
        renderTags();
      };

      // wire up filter
      filter?.querySelectorAll('.lang-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          const lang = btn.dataset.lang;
          if (lang === activeLang) return;
          activeLang = lang;
          persistLang(lang);
          renderAll();
        });
      });

      // status
      if (countEl) countEl.textContent = allPosts.length;
      if (lastEl) lastEl.textContent = allPosts[0] ? fmtDate(allPosts[0].date) : '—';

      renderAll();
    })
    .catch((err) => {
      console.error(err);
      if (list) {
        list.innerHTML = '<li class="post-row post-row--err">failed to load posts.json — open via http (not file://)</li>';
      }
    });
})();
