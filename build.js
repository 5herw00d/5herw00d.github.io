#!/usr/bin/env node
// build.js — pre-render markdown posts into static HTML for SEO + social previews.
// usage:  node build.js
//
// reads:   blog/posts.json + blog/posts/*.md
// writes:  blog/posts/<slug>/index.html
//          sitemap.xml (root)
//          robots.txt (root)
//          blog/feed.xml         (all languages)
//          blog/feed.<lang>.xml  (per language)
//
// no dependencies — node stdlib only.

const fs = require('fs');
const path = require('path');
const MD = require('./scripts/markdown.js');

const ROOT = __dirname;
const BLOG = path.join(ROOT, 'blog');
const POSTS_DIR = path.join(BLOG, 'posts');
const MANIFEST = path.join(BLOG, 'posts.json');

// language → BCP47 code + OG locale
const LANG_META = {
  en: { bcp47: 'en', ogLocale: 'en_US', rss: 'en-us' },
  ru: { bcp47: 'ru', ogLocale: 'ru_RU', rss: 'ru-ru' },
  uk: { bcp47: 'uk', ogLocale: 'uk_UA', rss: 'uk-ua' },
};

const POST_UI = {
  en: {
    adjacentPosts: 'adjacent posts',
    blogLink: '../blog',
    blogPostAria: 'dmytro.my blog post',
    contents: 'contents',
    homeLink: '../home',
    newer: 'newer →',
    older: '← older',
    readBlock: 'read',
    readHud: 'read',
    readKey: 'read',
    sectionsAria: 'sections',
    tocAria: 'post sections',
    minute: 'min',
  },
  ru: {
    adjacentPosts: 'соседние записи',
    blogLink: '../блог',
    blogPostAria: 'пост блога dmytro.my',
    contents: 'содержание',
    homeLink: '../главная',
    newer: 'новее →',
    older: '← старее',
    readBlock: 'читать',
    readHud: 'чтение',
    readKey: 'чтение',
    sectionsAria: 'разделы',
    tocAria: 'разделы поста',
    minute: 'мин',
  },
  uk: {
    adjacentPosts: 'сусідні дописи',
    blogLink: '../блог',
    blogPostAria: 'допис блогу dmytro.my',
    contents: 'зміст',
    homeLink: '../головна',
    newer: 'новіше →',
    older: '← старіше',
    readBlock: 'читати',
    readHud: 'читання',
    readKey: 'читання',
    sectionsAria: 'розділи',
    tocAria: 'розділи допису',
    minute: 'хв',
  },
};

function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

function escHtml(s) { return MD.escHtml(s); }
function escAttr(s) { return MD.escHtml(s); }
function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

function rfc822(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function langOf(post, defaultLang) {
  return post.lang || defaultLang || 'en';
}

function uiOf(lang) {
  return POST_UI[lang] || POST_UI.en;
}

// ---- post template ----
function postPage({ site, post, body, headings, readMin, prev, next }) {
  const lang = langOf(post, site.defaultLang);
  const meta = LANG_META[lang] || LANG_META.en;
  const ui = uiOf(lang);

  const url = `${site.url}/blog/posts/${post.slug}/`;
  const title = post.title;
  const desc = (post.summary || site.description || '').slice(0, 200);
  const tagsList = (post.tags || []).map((t) => escAttr(t)).join(', ');
  const dateIso = post.date;
  const dateDisp = fmtDate(post.date);

  const tocHtml = headings.length > 1
    ? `
        <nav class="rail__toc" aria-label="${escAttr(ui.tocAria)}">
          <div class="rail__toc-inner">
            <p class="rail__toc-label">${escHtml(ui.contents)}</p>
            <ol class="rail__toc-list">
              ${headings.map((h, i) => `
                <li${h.lvl === 3 ? ' class="is-sub"' : ''}>
                  <a href="#${escAttr(h.id)}">
                    <span class="rail__toc-num">${String(i + 1).padStart(2, '0')}</span>
                    <span>${escHtml(h.text)}</span>
                  </a>
                </li>
              `).join('')}
            </ol>
          </div>
        </nav>`
    : '';

  const tagsBadges = (post.tags || []).map((t) =>
    `<li class="post-meta__tag">${escHtml(t)}</li>`
  ).join('');

  const navHtml = (prev || next)
    ? `
        <nav class="post-nav" aria-label="${escAttr(ui.adjacentPosts)}">
          ${prev
            ? `<a class="post-nav__btn post-nav__btn--prev" href="../${escAttr(prev.slug)}/">
                <span class="post-nav__dir">${escHtml(ui.older)}</span>
                <span class="post-nav__title">${escHtml(prev.title)}</span>
              </a>`
            : `<span></span>`}
          ${next
            ? `<a class="post-nav__btn post-nav__btn--next" href="../${escAttr(next.slug)}/">
                <span class="post-nav__dir">${escHtml(ui.newer)}</span>
                <span class="post-nav__title">${escHtml(next.title)}</span>
              </a>`
            : ``}
        </nav>`
    : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: desc,
    datePublished: dateIso,
    dateModified: post.updated || dateIso,
    author: { '@type': 'Person', name: site.author, url: site.url },
    publisher: { '@type': 'Person', name: site.author, url: site.url },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url: url,
    keywords: (post.tags || []).join(', '),
    inLanguage: meta.bcp47,
  };

  return `<!DOCTYPE html>
<html lang="${meta.bcp47}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#0a1116">

  <title>${escHtml(title)}</title>
  <meta name="description" content="${escAttr(desc)}">
  <meta name="author" content="${escAttr(site.author)}">
  <meta name="keywords" content="${escAttr(tagsList)}">
  <link rel="canonical" href="${url}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escAttr(post.title)}">
  <meta property="og:description" content="${escAttr(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="${escAttr(site.title)}">
  <meta property="og:locale" content="${meta.ogLocale}">
  <meta property="article:published_time" content="${escAttr(dateIso)}">
  ${(post.tags || []).map((t) => `<meta property="article:tag" content="${escAttr(t)}">`).join('\n  ')}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escAttr(post.title)}">
  <meta name="twitter:description" content="${escAttr(desc)}">
  ${site.twitter ? `<meta name="twitter:creator" content="${escAttr(site.twitter)}">` : ''}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../../styles/main.css">
  <link rel="icon" type="image/svg+xml" href="../../../assets/favicon.svg">
  <link rel="alternate" type="application/rss+xml" title="${escAttr(site.title)} blog (${lang})" href="../../feed.${lang}.xml">
  <link rel="alternate" type="application/rss+xml" title="${escAttr(site.title)} blog (all)" href="../../feed.xml">

  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body class="page-post" data-lang="${lang}">
  <div class="fx fx--grid" aria-hidden="true"></div>
  <div class="fx fx--grain" aria-hidden="true"></div>
  <div class="fx fx--spot" aria-hidden="true"></div>
  <div class="fx fx--vignette" aria-hidden="true"></div>

  <header class="window" role="banner">
    <div class="window__lights" aria-hidden="true"><i></i><i></i><i></i></div>
    <p class="window__path">
      <span class="window__user">dmytro</span><span class="window__at">@</span><span class="window__host">my</span>
      <span class="window__sep">:</span>
      <span class="window__cwd">~/blog/${escHtml(post.slug)}</span>
      <span class="window__shell">— zsh</span>
    </p>
    <div class="window__hud" aria-hidden="true">
      <span class="hud__pulse"></span>
      <span class="window__hud-label">${escHtml(ui.readHud)} · ${lang}</span>
      <span class="window__hud-time" data-clock>—</span>
    </div>
  </header>

  <main class="site" aria-label="${escAttr(ui.blogPostAria)}">
    <aside class="rail" aria-label="${escAttr(ui.sectionsAria)}">
      <ol class="rail__list">
        <li><a href="../../" class="rail__link rail__link--ext"><span class="rail__num">←</span><span class="rail__name">${escHtml(ui.blogLink)}</span></a></li>
        <li><a href="../../../" class="rail__link rail__link--ext"><span class="rail__num">←</span><span class="rail__name">${escHtml(ui.homeLink)}</span></a></li>
      </ol>
      ${tocHtml}
      <div class="rail__status">
        <p><span class="key">slug</span><span>${escHtml(post.slug)}</span></p>
        <p><span class="key">lang</span><span>${lang}</span></p>
        <p><span class="key">date</span><span>${escHtml(dateDisp)}</span></p>
        <p><span class="key">${escHtml(ui.readKey)}</span><span>${readMin} ${escHtml(ui.minute)}</span></p>
      </div>
    </aside>

    <article class="content">
      <section class="hero hero--post">
        <div class="hero__head">
          <p class="line"><span class="prompt">$</span> cat posts/${escHtml(post.slug)}.md</p>
          <p class="eyebrow">// ${escHtml((post.tags || []).join(' · ') || 'post')} · lang=${lang}</p>
        </div>
        <h1 class="display display--post">${escHtml(post.title)}</h1>
        <ul class="post-meta">
          <li class="post-meta__lang">${lang}</li>
          ${tagsBadges}
          <li class="post-meta__date">${escHtml(dateDisp)}</li>
        </ul>
      </section>

      <section class="block is-visible">
        <header class="block__head">
          <span class="block__num">¶</span>
          <h2 class="block__title">${escHtml(ui.readBlock)}</h2>
          <span class="block__rule" aria-hidden="true"></span>
          <span class="block__cmd"><span class="prompt">$</span> less ${escHtml(post.slug)}.md</span>
        </header>
        <div class="block__body">
          <article class="prose">
${body}
          </article>
        </div>
      </section>

      ${navHtml}

      <footer class="footer">
        <p class="line line--prompt"><span class="prompt">$</span><span class="cursor" aria-hidden="true"></span></p>
        <div class="footer__row">
          <p class="sig">© <span data-year>—</span> ${escHtml(site.author).toLowerCase()} · <a href="../../">${escHtml(ui.blogLink)}</a></p>
          <p class="sig sig--muted"><span class="key">utc</span><span data-clock>—</span></p>
        </div>
      </footer>
    </article>
  </main>

  <script src="../../../scripts/post-static.js"></script>
</body>
</html>
`.replace(/[ \t]+$/gm, '');
}

// ---- legacy redirect for old ?slug= links ----
function legacyRedirect() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>redirecting…</title>
  <meta name="robots" content="noindex">
  <script>
    (function () {
      var slug = (new URLSearchParams(location.search).get('slug') || '').replace(/[^a-z0-9\\-_]/gi, '');
      location.replace(slug ? 'posts/' + slug + '/' : './');
    })();
  </script>
  <link rel="canonical" href="./">
</head>
<body>
  <p>Redirecting to <a href="./">~/blog</a>…</p>
</body>
</html>
`;
}

// ---- sitemap ----
function sitemap(site, posts) {
  const urls = [
    { loc: `${site.url}/`, priority: '1.0' },
    { loc: `${site.url}/blog/`, priority: '0.8' },
  ].concat(posts.map((p) => ({
    loc: `${site.url}/blog/posts/${p.slug}/`,
    lastmod: fmtDate(p.updated || p.date),
    priority: '0.7',
  })));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${escXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

// ---- robots.txt ----
function robots(site) {
  return `User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`;
}

// ---- rss ----
function rss(site, posts, lang) {
  const meta = lang ? LANG_META[lang] : null;
  const langCode = meta ? meta.rss : 'en-us';
  const titleSuffix = lang ? ` (${lang})` : '';
  const feedPath = lang ? `feed.${lang}.xml` : 'feed.xml';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(site.title)} — blog${titleSuffix}</title>
    <link>${escXml(site.url)}/blog/</link>
    <description>${escXml(site.description)}</description>
    <language>${langCode}</language>
    <atom:link href="${escXml(site.url)}/blog/${feedPath}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${posts.map((p) => `    <item>
      <title>${escXml(p.title)}</title>
      <link>${escXml(site.url)}/blog/posts/${p.slug}/</link>
      <guid isPermaLink="true">${escXml(site.url)}/blog/posts/${p.slug}/</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${escXml(p.summary || '')}</description>
${(p.tags || []).map((t) => `      <category>${escXml(t)}</category>`).join('\n')}
    </item>`).join('\n')}
  </channel>
</rss>
`;
}

// ---- main ----
(function build() {
  const manifest = readManifest();
  const site = manifest.site;
  if (!site || !site.url) {
    console.error('error: blog/posts.json must include a "site" object with at least { url }');
    process.exit(1);
  }

  const languages = site.languages || ['en'];
  const defaultLang = site.defaultLang || 'en';

  // sort newest first
  const posts = manifest.posts.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  let built = 0;
  posts.forEach((post, idx) => {
    const mdPath = path.join(POSTS_DIR, post.slug + '.md');
    if (!fs.existsSync(mdPath)) {
      console.warn('  skip:', post.slug, '— missing .md');
      return;
    }
    const lang = langOf(post, defaultLang);
    if (!languages.includes(lang)) {
      console.warn(`  warn: ${post.slug} has lang="${lang}" not in site.languages [${languages.join(', ')}]`);
    }

    const raw = fs.readFileSync(mdPath, 'utf8');
    const { html, headings, title } = MD.render(raw);
    if (title && !post.title) post.title = title;
    const readMin = MD.readTime(raw);
    if (!post.summary) post.summary = MD.summarize(raw);

    const prev = posts[idx + 1]; // older
    const next = posts[idx - 1]; // newer

    const html5 = postPage({
      site,
      post,
      body: html.split('\n').map((l) => '            ' + l).join('\n'),
      headings,
      readMin,
      prev,
      next,
    });

    const dir = path.join(POSTS_DIR, post.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html5);
    built++;
    console.log(`  ok  blog/posts/${post.slug}/index.html  (${lang})`);
  });

  // legacy redirect at blog/post.html
  fs.writeFileSync(path.join(BLOG, 'post.html'), legacyRedirect());
  console.log('  ok  blog/post.html (legacy redirect)');

  // sitemap.xml at root
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap(site, posts));
  console.log('  ok  sitemap.xml');

  // robots.txt at root
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots(site));
  console.log('  ok  robots.txt');

  // combined feed
  fs.writeFileSync(path.join(BLOG, 'feed.xml'), rss(site, posts, null));
  console.log('  ok  blog/feed.xml (all)');

  // per-language feeds
  languages.forEach((lang) => {
    const langPosts = posts.filter((p) => langOf(p, defaultLang) === lang);
    fs.writeFileSync(path.join(BLOG, `feed.${lang}.xml`), rss(site, langPosts, lang));
    console.log(`  ok  blog/feed.${lang}.xml`);
  });

  console.log(`\nbuilt ${built} post(s) across ${languages.length} language(s).`);
})();
