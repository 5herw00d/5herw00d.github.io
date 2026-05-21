// post.js — render a single markdown post
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // year
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // clock
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

  // ----- markdown mini-parser (block-level + inline) -----
  // safe: html-escape input first; only emit known tags
  const escHtml = (s) =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#39;');

  const slugify = (s) =>
    s.toLowerCase()
     .replace(/[^a-z0-9\s-]/g, '')
     .trim()
     .replace(/\s+/g, '-')
     .slice(0, 60);

  // inline: code, bold, italic, links — applied to escaped text
  const inline = (s) => {
    // inline code first (so other rules don't touch its contents)
    s = s.replace(/`([^`]+)`/g, (_, t) => `<code>${t}</code>`);
    // links [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      const safe = /^(https?:|mailto:|\.\.?\/|#|\/)/.test(u) ? u : '#';
      const ext = /^https?:/.test(u);
      return `<a href="${safe}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
    });
    // bold ** **
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // italic * *
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s;
  };

  // returns { html, headings, title }
  const renderMarkdown = (raw) => {
    const lines = raw.replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    const headings = [];
    let title = null;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // fenced code ```lang
      const fence = line.match(/^```(\w*)\s*$/);
      if (fence) {
        const lang = fence[1];
        const buf = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++;
        out.push(`<pre class="code"${lang ? ` data-lang="${escHtml(lang)}"` : ''}><code>${escHtml(buf.join('\n'))}</code></pre>`);
        continue;
      }

      // heading
      const h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (h) {
        const lvl = h[1].length;
        const text = h[2];
        const id = slugify(text);
        if (lvl === 1 && !title) title = text;
        if (lvl >= 2 && lvl <= 3) headings.push({ id, text, lvl });
        out.push(`<h${lvl} id="${id}">${inline(escHtml(text))}</h${lvl}>`);
        i++;
        continue;
      }

      // hr
      if (/^---+\s*$/.test(line)) {
        out.push('<hr>');
        i++;
        continue;
      }

      // blockquote
      if (/^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        out.push(`<blockquote><p>${inline(escHtml(buf.join(' ').trim()))}</p></blockquote>`);
        continue;
      }

      // unordered list
      if (/^\s*[-*]\s+/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*[-*]\s+/, ''));
          i++;
        }
        out.push('<ul>' + buf.map((b) => `<li>${inline(escHtml(b))}</li>`).join('') + '</ul>');
        continue;
      }

      // ordered list
      if (/^\s*\d+\.\s+/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
          i++;
        }
        out.push('<ol>' + buf.map((b) => `<li>${inline(escHtml(b))}</li>`).join('') + '</ol>');
        continue;
      }

      // blank line
      if (/^\s*$/.test(line)) {
        i++;
        continue;
      }

      // paragraph — consume until blank or block
      const buf = [];
      while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !/^#{1,6}\s/.test(lines[i]) &&
        !/^```/.test(lines[i]) &&
        !/^>\s?/.test(lines[i]) &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !/^---+\s*$/.test(lines[i])
      ) {
        buf.push(lines[i]);
        i++;
      }
      out.push(`<p>${inline(escHtml(buf.join(' ')))}</p>`);
    }

    return { html: out.join('\n'), headings, title };
  };

  // ----- load + render -----
  const params = new URLSearchParams(location.search);
  const slug = (params.get('slug') || '').replace(/[^a-z0-9\-_]/gi, '');

  const proseEl = document.querySelector('[data-prose]');
  const titleEl = document.querySelector('[data-title]');
  const eyebrowEl = document.querySelector('[data-eyebrow]');
  const catEl = document.querySelector('[data-cat]');
  const lessEl = document.querySelector('[data-less]');
  const cwdEl = document.querySelector('[data-cwd]');
  const slugEl = document.querySelector('[data-slug]');
  const dateEl = document.querySelector('[data-date]');
  const readEl = document.querySelector('[data-read]');
  const tocEl = document.querySelector('[data-toc]');
  const tagsEl = document.querySelector('[data-tags]');
  const navEl = document.querySelector('[data-postnav]');

  if (!slug) {
    proseEl.innerHTML = '<p class="prose__err">no slug provided. <a href="./">back to ~/blog</a></p>';
    return;
  }

  const fmtDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toISOString().slice(0, 10);
  };

  Promise.all([
    fetch('posts.json', { cache: 'no-cache' }).then((r) => r.json()),
    fetch(`posts/${slug}.md`, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error('post not found');
      return r.text();
    }),
  ])
    .then(([manifest, md]) => {
      const posts = (manifest.posts || []).slice().sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0
      );
      const idx = posts.findIndex((p) => p.slug === slug);
      const meta = posts[idx] || { slug, title: slug, date: '—', tags: [] };

      const { html, headings, title } = renderMarkdown(md);
      const heading = title || meta.title;

      // title + meta
      document.title = `dmytro.my — ${heading}`;
      titleEl.textContent = heading;
      eyebrowEl.textContent = `// ${meta.tags?.join(' · ') || 'post'}`;
      catEl.textContent = `posts/${slug}.md`;
      lessEl.textContent = `${slug}.md`;
      cwdEl.textContent = `~/blog/${slug}`;
      slugEl.textContent = slug;
      dateEl.textContent = fmtDate(meta.date);

      // read time
      const words = md.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.round(words / 220));
      readEl.textContent = `${minutes} min`;

      // tags
      tagsEl.innerHTML = '';
      (meta.tags || []).forEach((t) => {
        const li = document.createElement('li');
        li.className = 'post-meta__tag';
        li.textContent = t;
        tagsEl.appendChild(li);
      });
      if ((meta.tags || []).length) {
        const dot = document.createElement('li');
        dot.className = 'post-meta__date';
        dot.textContent = fmtDate(meta.date);
        tagsEl.appendChild(dot);
      }

      // prose
      proseEl.innerHTML = html;

      // toc
      tocEl.innerHTML = '';
      if (headings.length > 1) {
        const wrap = document.createElement('div');
        wrap.className = 'rail__toc-inner';
        wrap.innerHTML = '<p class="rail__toc-label">contents</p>';
        const ul = document.createElement('ol');
        ul.className = 'rail__toc-list';
        headings.forEach((h, i) => {
          const li = document.createElement('li');
          li.className = h.lvl === 3 ? 'is-sub' : '';
          li.innerHTML = `<a href="#${h.id}"><span class="rail__toc-num">${String(i + 1).padStart(2, '0')}</span><span></span></a>`;
          li.querySelector('span:last-child').textContent = h.text;
          ul.appendChild(li);
        });
        wrap.appendChild(ul);
        tocEl.appendChild(wrap);

        // active heading on scroll
        const tocLinks = new Map(
          [...tocEl.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a])
        );
        const obs = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              const link = tocLinks.get(e.target.id);
              if (!link) return;
              if (e.isIntersecting) {
                tocLinks.forEach((l) => l.parentElement.classList.remove('is-active'));
                link.parentElement.classList.add('is-active');
              }
            });
          },
          { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
        );
        headings.forEach((h) => {
          const el = document.getElementById(h.id);
          if (el) obs.observe(el);
        });
      }

      // prev/next
      navEl.innerHTML = '';
      const prev = posts[idx + 1]; // older
      const next = posts[idx - 1]; // newer
      if (prev) {
        const a = document.createElement('a');
        a.className = 'post-nav__btn post-nav__btn--prev';
        a.href = `post.html?slug=${encodeURIComponent(prev.slug)}`;
        a.innerHTML = '<span class="post-nav__dir">← older</span><span class="post-nav__title"></span>';
        a.querySelector('.post-nav__title').textContent = prev.title;
        navEl.appendChild(a);
      } else {
        const span = document.createElement('span');
        navEl.appendChild(span);
      }
      if (next) {
        const a = document.createElement('a');
        a.className = 'post-nav__btn post-nav__btn--next';
        a.href = `post.html?slug=${encodeURIComponent(next.slug)}`;
        a.innerHTML = '<span class="post-nav__dir">newer →</span><span class="post-nav__title"></span>';
        a.querySelector('.post-nav__title').textContent = next.title;
        navEl.appendChild(a);
      }
    })
    .catch((err) => {
      console.error(err);
      proseEl.innerHTML = `<p class="prose__err">failed to load post — open via http (not file://). <a href="./">back to ~/blog</a></p>`;
    });
})();
