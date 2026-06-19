// blog.js — listing page with language filter
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const UI_TEXT = {
    en: {
      archive: 'archive',
      archiveEmpty: 'no posts in this language yet.',
      empty: 'no posts in this language yet.',
      eyebrow: '// notes on shipping ai products · plain markdown',
      failed: 'failed to load posts.json — open via http (not file://)',
      home: '../home',
      langFilter: 'filter by language',
      langLabel: 'lang:',
      last: 'last',
      latest: 'latest',
      lead: 'Short, practical entries — agents, llm tradeoffs, product loops, infra, and the boring stuff that keeps it all running.',
      loading: 'loading…',
      net: 'net',
      posts: 'posts',
      stable: 'stable',
      tagEmpty: 'no tags yet.',
      tags: 'tags',
      title: 'blog',
    },
    ru: {
      archive: 'архив',
      archiveEmpty: 'Нет записей на выбранном языке.',
      empty: 'Нет записей на выбранном языке.',
      eyebrow: '// заметки о запуске AI-продуктов · plain markdown',
      failed: 'Ошибка загрузки posts.json — откройте страницу через http, а не file://',
      home: '../главная',
      langFilter: 'фильтр по языку',
      langLabel: 'язык:',
      last: 'последняя',
      latest: 'свежее',
      lead: 'Короткие практические заметки: агенты, компромиссы LLM, продуктовые циклы, инфраструктура и скучные детали, на которых всё держится.',
      loading: 'загрузка…',
      net: 'сеть',
      posts: 'записи',
      stable: 'стабильно',
      tagEmpty: 'Тегов пока нет.',
      tags: 'теги',
      title: 'блог',
    },
  };

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
  const textFor = (lang) => UI_TEXT[lang] || UI_TEXT.en;

  const setActiveChip = (lang) => {
    filter?.querySelectorAll('.lang-chip').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });
  };

  fetch('/blog/posts.json', { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error('posts.json ' + r.status);
      return r.json();
    })
    .then((data) => {
      const site = data.site || {};
      const defaultLang = site.defaultLang || 'en';
      const configuredLangs = Array.isArray(site.languages) ? site.languages : ['en'];
      const allPosts = (data.posts || []).slice().sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0
      );

      // counts per lang
      const counts = { en: 0, ru: 0 };
      allPosts.forEach((p) => {
        const l = langOf(p, defaultLang);
        if (counts[l] !== undefined) counts[l]++;
      });
      const countEn = document.querySelector('[data-count-en]');
      const countRu = document.querySelector('[data-count-ru]');
      if (countEn) countEn.textContent = counts.en;
      if (countRu) countRu.textContent = counts.ru;

      let activeLang = document.body.dataset.pageLang || document.documentElement.lang || defaultLang;
      if (!configuredLangs.includes(activeLang)) activeLang = defaultLang;

      const filtered = () => allPosts.filter((p) => langOf(p, defaultLang) === activeLang);

      const uiLang = () => activeLang;
      const ui = () => textFor(uiLang());

      const setText = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
      };

      const applyUi = () => {
        const t = ui();
        document.documentElement.lang = uiLang();
        document.querySelector('[data-lang-filter]')?.setAttribute('aria-label', t.langFilter);
        setText('.rail__link--ext .rail__name', t.home);
        setText('.rail__link[href="#latest"] .rail__name', t.latest);
        setText('.rail__link[href="#archive"] .rail__name', t.archive);
        setText('.rail__link[href="#tags"] .rail__name', t.tags);
        setText('[data-label-posts]', t.posts);
        setText('[data-label-last]', t.last);
        setText('[data-label-net]', t.net);
        setText('[data-label-stable]', t.stable);
        setText('.hero--blog .eyebrow', t.eyebrow);
        setText('.hero--blog .display__name', t.title);
        setText('.hero--blog .lead', t.lead);
        setText('[data-title-latest]', t.latest);
        setText('[data-title-archive]', t.archive);
        setText('[data-title-tags]', t.tags);
        setText('.lang-filter__label', t.langLabel);
        setText('.footer__row a[href="/"]', t.home);
        setText('[data-empty]', t.empty);
        setText('.post-row--skel .post-row__title', t.loading);
      };

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
            <a class="post-row__link" href="posts/${encodeURIComponent(p.route || p.slug)}/" lang="${lang}">
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
          archive.innerHTML = `<p class="archive__empty">${ui().archiveEmpty}</p>`;
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
                <a class="archive__row" href="posts/${encodeURIComponent(p.route || p.slug)}/" lang="${lang}">
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
          tagCloud.innerHTML = `<li class="tag-cloud__empty">${ui().tagEmpty}</li>`;
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
        applyUi();
        renderListing();
        renderArchive();
        renderTags();
      };

      // status
      const visiblePosts = filtered();
      if (countEl) countEl.textContent = visiblePosts.length;
      if (lastEl) lastEl.textContent = visiblePosts[0] ? fmtDate(visiblePosts[0].date) : '—';

      renderAll();
    })
    .catch((err) => {
      console.error(err);
      if (list) {
        const browserLang = document.documentElement.lang === 'ru' ? 'ru' : 'en';
        list.innerHTML = `<li class="post-row post-row--err">${textFor(browserLang).failed}</li>`;
      }
    });
})();
