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
const { relatedPostsFor, validatePost } = require('./scripts/blog-data.js');

const ROOT = __dirname;
const BLOG = path.join(ROOT, 'blog');
const POSTS_DIR = path.join(BLOG, 'posts');
const MANIFEST = path.join(BLOG, 'posts.json');
const STYLE_VERSION = '20260620-1';

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
    languageLabel: 'language',
    newer: 'newer →',
    older: '← older',
    readBlock: 'read',
    readHud: 'read',
    readKey: 'read',
    sectionsAria: 'sections',
    tocAria: 'post sections',
    minute: 'min',
    relatedPosts: 'related posts',
  },
  ru: {
    adjacentPosts: 'соседние записи',
    blogLink: '../блог',
    blogPostAria: 'пост блога dmytro.my',
    contents: 'содержание',
    homeLink: '../главная',
    languageLabel: 'язык',
    newer: 'новее →',
    older: '← старее',
    readBlock: 'читать',
    readHud: 'чтение',
    readKey: 'чтение',
    sectionsAria: 'разделы',
    tocAria: 'разделы поста',
    minute: 'мин',
    relatedPosts: 'похожие статьи',
  },
  uk: {
    adjacentPosts: 'сусідні дописи',
    blogLink: '../блог',
    blogPostAria: 'допис блогу dmytro.my',
    contents: 'зміст',
    homeLink: '../головна',
    languageLabel: 'мова',
    newer: 'новіше →',
    older: '← старіше',
    readBlock: 'читати',
    readHud: 'читання',
    readKey: 'читання',
    sectionsAria: 'розділи',
    tocAria: 'розділи допису',
    minute: 'хв',
    relatedPosts: 'схожі дописи',
  },
};

const BLOG_UI = {
  en: {
    archive: 'archive', eyebrow: '// notes on shipping ai products · plain markdown',
    filter: 'filter by language', home: '../home', last: 'last', latest: 'latest',
    lead: 'Short, practical entries — agents, llm tradeoffs, product loops, infra, and the boring stuff that keeps it all running.',
    net: 'net', posts: 'posts', sections: 'sections', stable: 'stable', tags: 'tags', title: 'blog',
  },
  ru: {
    archive: 'архив', eyebrow: '// заметки о запуске AI-продуктов · plain markdown',
    filter: 'фильтр по языку', home: '../главная', last: 'последняя', latest: 'свежее',
    lead: 'Короткие практические заметки: агенты, компромиссы LLM, продуктовые циклы и инфраструктура.',
    net: 'сеть', posts: 'записи', sections: 'разделы', stable: 'стабильно', tags: 'теги', title: 'блог',
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

function routeOf(post) {
  return post.route || post.slug;
}

function localePrefix(lang, defaultLang) {
  return lang === defaultLang ? '' : `/${lang}`;
}

function listingPath(lang, defaultLang) {
  return `${localePrefix(lang, defaultLang)}/blog/`;
}

function postPath(post, defaultLang) {
  return `${localePrefix(langOf(post, defaultLang), defaultLang)}/blog/posts/${routeOf(post)}/`;
}

function absoluteUrl(site, pathname) {
  return `${site.url}${pathname}`;
}

function postOutputDir(post, defaultLang) {
  const lang = langOf(post, defaultLang);
  return lang === defaultLang
    ? path.join(BLOG, 'posts', routeOf(post))
    : path.join(ROOT, lang, 'blog', 'posts', routeOf(post));
}

// ---- post template ----
function postPage({ site, post, body, headings, readMin, prev, next, relatedPosts, translations }) {
  const lang = langOf(post, site.defaultLang);
  const defaultLang = site.defaultLang || 'en';
  const meta = LANG_META[lang] || LANG_META.en;
  const ui = uiOf(lang);

  const url = absoluteUrl(site, postPath(post, defaultLang));
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

  const alternateLinks = translations.map((translation) => {
    const translationLang = langOf(translation, defaultLang);
    return `<link rel="alternate" hreflang="${escAttr(translationLang)}" href="${escAttr(absoluteUrl(site, postPath(translation, defaultLang)))}">`;
  });
  const defaultTranslation = translations.find((translation) => langOf(translation, defaultLang) === defaultLang) || post;
  alternateLinks.push(`<link rel="alternate" hreflang="x-default" href="${escAttr(absoluteUrl(site, postPath(defaultTranslation, defaultLang)))}">`);

  const languageSwitch = translations.length > 1
    ? `<nav class="site-lang" aria-label="${escAttr(ui.languageLabel)}">
          ${translations.map((translation) => {
            const translationLang = langOf(translation, defaultLang);
            const label = translationLang.toUpperCase();
            return translationLang === lang
              ? `<span class="lang-chip is-active" aria-current="page">${label}</span>`
              : `<a class="lang-chip" hreflang="${escAttr(translationLang)}" href="${escAttr(postPath(translation, defaultLang))}">${label}</a>`;
          }).join('')}
        </nav>`
    : '';

  const navHtml = (prev || next)
    ? `
        <nav class="post-nav" aria-label="${escAttr(ui.adjacentPosts)}">
          ${prev
            ? `<a class="post-nav__btn post-nav__btn--prev" href="${escAttr(postPath(prev, defaultLang))}">
                <span class="post-nav__dir">${escHtml(ui.older)}</span>
                <span class="post-nav__title">${escHtml(prev.title)}</span>
              </a>`
            : `<span></span>`}
          ${next
            ? `<a class="post-nav__btn post-nav__btn--next" href="${escAttr(postPath(next, defaultLang))}">
                <span class="post-nav__dir">${escHtml(ui.newer)}</span>
                <span class="post-nav__title">${escHtml(next.title)}</span>
              </a>`
            : ``}
        </nav>`
    : '';

  const relatedHtml = relatedPosts.length
    ? `
        <section class="related-posts" aria-labelledby="related-posts-title-${escAttr(post.slug)}">
          <h2 class="related-posts__title" id="related-posts-title-${escAttr(post.slug)}">${escHtml(ui.relatedPosts)}</h2>
          <div class="related-posts__list">
            ${relatedPosts.map((related) => `
              <a class="related-posts__link" href="${escAttr(postPath(related, defaultLang))}">
                <span class="related-posts__meta">${escHtml((related.tags || []).join(' · '))}</span>
                <span class="related-posts__name">${escHtml(related.title)}</span>
                <span class="related-posts__arrow" aria-hidden="true">→</span>
              </a>`).join('')}
          </div>
        </section>`
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
  ${alternateLinks.join('\n  ')}

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
  <link rel="stylesheet" href="/styles/main.css?v=${STYLE_VERSION}">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="alternate" type="application/rss+xml" title="${escAttr(site.title)} blog (${lang})" href="/blog/feed.${lang}.xml">
  <link rel="alternate" type="application/rss+xml" title="${escAttr(site.title)} blog (all)" href="/blog/feed.xml">

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
      <span class="window__cwd">~${escHtml(postPath(post, defaultLang))}</span>
      <span class="window__shell">— zsh</span>
    </p>
    ${languageSwitch}
    <div class="window__hud" aria-hidden="true">
      <span class="hud__pulse"></span>
      <span class="window__hud-label">${escHtml(ui.readHud)} · ${lang}</span>
      <span class="window__hud-time" data-clock>—</span>
    </div>
  </header>

  <main class="site" aria-label="${escAttr(ui.blogPostAria)}">
    <aside class="rail" aria-label="${escAttr(ui.sectionsAria)}">
      <ol class="rail__list">
        <li><a href="${escAttr(listingPath(lang, defaultLang))}" class="rail__link rail__link--ext"><span class="rail__num">←</span><span class="rail__name">${escHtml(ui.blogLink)}</span></a></li>
        <li><a href="/" class="rail__link rail__link--ext"><span class="rail__num">←</span><span class="rail__name">${escHtml(ui.homeLink)}</span></a></li>
      </ol>
      ${tocHtml}
      <div class="rail__status">
        <p class="rail__status-row rail__status-row--slug"><span class="key">slug</span><span>${escHtml(routeOf(post))}</span></p>
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

      ${relatedHtml}

      ${navHtml}

      <footer class="footer">
        <p class="line line--prompt"><span class="prompt">$</span><span class="cursor" aria-hidden="true"></span></p>
        <div class="footer__row">
          <p class="sig">© <span data-year>—</span> ${escHtml(site.author).toLowerCase()} · <a href="${escAttr(listingPath(lang, defaultLang))}">${escHtml(ui.blogLink)}</a></p>
          <p class="sig sig--muted"><span class="key">utc</span><span data-clock>—</span></p>
        </div>
      </footer>
    </article>
  </main>

  <script src="/scripts/post-static.js"></script>
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

function redirectPage(target) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url=${escAttr(target)}">
  <link rel="canonical" href="${escAttr(target)}">
  <title>redirecting…</title>
</head>
<body>
  <p>Redirecting to <a href="${escAttr(target)}">${escHtml(target)}</a>…</p>
</body>
</html>
`;
}

// ---- sitemap ----
function sitemap(site, posts, languages, defaultLang) {
  const urls = [
    { loc: `${site.url}/`, priority: '1.0' },
    { loc: `${site.url}/about/`, priority: '0.8' },
    { loc: `${site.url}/ru/`, priority: '1.0' },
    { loc: `${site.url}/ru/about/`, priority: '0.8' },
    ...languages.map((lang) => ({
      loc: absoluteUrl(site, listingPath(lang, defaultLang)),
      priority: '0.8',
    })),
  ].concat(posts.map((p) => ({
    loc: absoluteUrl(site, postPath(p, defaultLang)),
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
  const defaultLang = site.defaultLang || 'en';
  const langCode = meta ? meta.rss : 'en-us';
  const titleSuffix = lang ? ` (${lang})` : '';
  const feedPath = lang ? `feed.${lang}.xml` : 'feed.xml';
  const latestPostDate = posts.reduce(
    (latest, post) => (!latest || post.date > latest ? post.date : latest),
    '1970-01-01'
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(site.title)} — blog${titleSuffix}</title>
    <link>${escXml(absoluteUrl(site, listingPath(lang || defaultLang, defaultLang)))}</link>
    <description>${escXml(site.description)}</description>
    <language>${langCode}</language>
    <atom:link href="${escXml(site.url)}/blog/${feedPath}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${rfc822(latestPostDate)}</lastBuildDate>
${posts.map((p) => `    <item>
      <title>${escXml(p.title)}</title>
      <link>${escXml(absoluteUrl(site, postPath(p, defaultLang)))}</link>
      <guid isPermaLink="true">${escXml(absoluteUrl(site, postPath(p, defaultLang)))}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${escXml(p.summary || '')}</description>
${(p.tags || []).map((t) => `      <category>${escXml(t)}</category>`).join('\n')}
    </item>`).join('\n')}
  </channel>
</rss>
`;
}

function listingRows(posts, lang) {
  if (!posts.length) return '<p class="post-list__empty">no posts in this language yet.</p>';
  return `<ol class="post-list" data-post-list>
${posts.map((post, index) => `            <li class="post-row">
              <a class="post-row__link" href="posts/${escAttr(routeOf(post))}/" lang="${lang}">
                <span class="post-row__id">${String(index + 1).padStart(3, '0')}</span>
                <time class="post-row__date" datetime="${escAttr(post.date)}">${escHtml(fmtDate(post.date))}</time>
                <span class="post-row__lang">${lang}</span>
                <span class="post-row__title">${escHtml(post.title)}</span>
                <span class="post-row__arrow" aria-hidden="true">→</span>
              </a>
              <p class="post-row__summary">${escHtml(post.summary || '')}</p>
              <ul class="post-row__tags">${(post.tags || []).map((tag) => `<li>${escHtml(tag)}</li>`).join('')}</ul>
            </li>`).join('\n')}
          </ol>
          <p class="post-list__empty" data-empty hidden>no posts in this language yet.</p>`;
}

function archiveRows(posts, lang) {
  const years = new Map();
  posts.forEach((post) => {
    const year = post.date.slice(0, 4);
    if (!years.has(year)) years.set(year, []);
    years.get(year).push(post);
  });
  return `<div class="archive" data-archive>
${[...years.entries()].map(([year, items]) => `            <div class="archive__year">
              <h3 class="archive__title">${year}</h3>
              <ul class="archive__list">${items.map((post) => `<li><a class="archive__row" href="posts/${escAttr(routeOf(post))}/" lang="${lang}"><time>${escHtml(fmtDate(post.date))}</time><span class="archive__lang">${lang}</span><span class="archive__title-text">${escHtml(post.title)}</span><span class="archive__arrow" aria-hidden="true">→</span></a></li>`).join('')}</ul>
            </div>`).join('\n')}
          </div>`;
}

function tagRows(posts) {
  const counts = new Map();
  posts.forEach((post) => (post.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  return `<ul class="tag-cloud" data-tags>${[...counts.entries()].map(([tag, count]) => `<li class="tag-cloud__item"><span class="tag-cloud__name">${escHtml(tag)}</span><span class="tag-cloud__count">${count}</span></li>`).join('')}</ul>`;
}

function localizedBlogIndex(template, site, lang, defaultLang, posts) {
  const isDefault = lang === defaultLang;
  const canonical = absoluteUrl(site, listingPath(lang, defaultLang));
  const title = isDefault ? `${site.title} — ~/blog` : `${site.title} — ~/${lang}/blog`;
  const description = lang === 'ru'
    ? 'Короткие практические заметки о создании AI SaaS.'
    : 'Short, practical notes on building AI SaaS.';
  const visiblePosts = posts.filter((post) => langOf(post, defaultLang) === lang);
  const ui = BLOG_UI[lang] || BLOG_UI.en;
  let html = template;

  html = html
    .replace(/<html lang="[^"]+">/, `<html lang="${lang}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escAttr(description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${escAttr(canonical)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escAttr(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escAttr(description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${escAttr(canonical)}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escAttr(title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escAttr(description)}">`)
    .replace(/<body class="page-blog"(?: data-page-lang="[^"]+")?>/, `<body class="page-blog" data-page-lang="${lang}">`)
    .replace(/<main class="site" aria-label="[^"]+">/, `<main class="site" aria-label="${escAttr(site.title)} ${escAttr(ui.title)}">`)
    .replace(/<aside class="rail" aria-label="[^"]+">/, `<aside class="rail" aria-label="${escAttr(ui.sections)}">`)
    .replace(/<span class="rail__name">\.\.\/home<\/span>/, `<span class="rail__name">${escHtml(ui.home)}</span>`)
    .replace(/<a href="#latest"([^>]*)><span class="rail__num">01<\/span><span class="rail__name">[^<]+<\/span>/, `<a href="#latest"$1><span class="rail__num">01</span><span class="rail__name">${escHtml(ui.latest)}</span>`)
    .replace(/<a href="#archive"([^>]*)><span class="rail__num">02<\/span><span class="rail__name">[^<]+<\/span>/, `<a href="#archive"$1><span class="rail__num">02</span><span class="rail__name">${escHtml(ui.archive)}</span>`)
    .replace(/<a href="#tags"([^>]*)><span class="rail__num">03<\/span><span class="rail__name">[^<]+<\/span>/, `<a href="#tags"$1><span class="rail__num">03</span><span class="rail__name">${escHtml(ui.tags)}</span>`)
    .replace(/(<span class="key" data-label-posts>)[^<]+/, `$1${escHtml(ui.posts)}`)
    .replace(/(<span class="key" data-label-last>)[^<]+/, `$1${escHtml(ui.last)}`)
    .replace(/(<span class="key" data-label-net>)[^<]+/, `$1${escHtml(ui.net)}`)
    .replace(/(<span class="ok" data-label-stable>)[^<]+/, `$1${escHtml(ui.stable)}`)
    .replace(/(<p class="eyebrow">)[^<]+/, `$1${escHtml(ui.eyebrow)}`)
    .replace(/(<span class="display__name">)[^<]+/, `$1${escHtml(ui.title)}`)
    .replace(/(<p class="lead">)[^<]+/, `$1${escHtml(ui.lead)}`)
    .replace(/(<h2 class="block__title" data-title-latest>)[^<]+/, `$1${escHtml(ui.latest)}`)
    .replace(/(<h2 class="block__title" data-title-archive>)[^<]+/, `$1${escHtml(ui.archive)}`)
    .replace(/(<h2 class="block__title" data-title-tags>)[^<]+/, `$1${escHtml(ui.tags)}`)
    .replace(/(<nav class="site-lang" aria-label=")[^"]+/, `$1${escAttr(ui.filter)}`)
    .replace(/(<p class="sig">© <span data-year>—<\/span> dmytro my · <a href="\/">)[^<]+/, `$1${escHtml(ui.home)}`)
    .replace(/class="lang-chip(?: is-active)?" data-lang="en"(?: aria-current="page")*/, `class="lang-chip${lang === 'en' ? ' is-active' : ''}" data-lang="en"${lang === 'en' ? ' aria-current="page"' : ''}`)
    .replace(/class="lang-chip(?: is-active)?" data-lang="ru"(?: aria-current="page")*/, `class="lang-chip${lang === 'ru' ? ' is-active' : ''}" data-lang="ru"${lang === 'ru' ? ' aria-current="page"' : ''}`)
    .replace(/<!-- posts:start -->[\s\S]*?<!-- posts:end -->/, `<!-- posts:start -->\n          ${listingRows(visiblePosts, lang)}\n          <!-- posts:end -->`)
    .replace(/<!-- archive:start -->[\s\S]*?<!-- archive:end -->/, `<!-- archive:start -->\n          ${archiveRows(visiblePosts, lang)}\n          <!-- archive:end -->`)
    .replace(/<!-- tags:start -->[\s\S]*?<!-- tags:end -->/, `<!-- tags:start -->\n          ${tagRows(visiblePosts)}\n          <!-- tags:end -->`)
    .replace(/<span data-count>[^<]*<\/span>/, `<span data-count>${visiblePosts.length}</span>`)
    .replace(/<span data-last>[^<]*<\/span>/, `<span data-last>${visiblePosts[0] ? escHtml(fmtDate(visiblePosts[0].date)) : '—'}</span>`);

  return html;
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
  posts.forEach(validatePost);
  const postsByLang = new Map(languages.map((lang) => [
    lang,
    posts.filter((post) => langOf(post, defaultLang) === lang),
  ]));
  const translationsByKey = new Map();
  posts.forEach((post) => {
    const key = post.translationKey || post.slug;
    if (!translationsByKey.has(key)) translationsByKey.set(key, []);
    translationsByKey.get(key).push(post);
  });

  let built = 0;
  posts.forEach((post) => {
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
    const { html, headings } = MD.render(raw);
    const readMin = MD.readTime(raw);

    const languagePosts = postsByLang.get(lang) || [];
    const languageIndex = languagePosts.indexOf(post);
    const prev = languagePosts[languageIndex + 1]; // older
    const next = languagePosts[languageIndex - 1]; // newer
    const relatedPosts = relatedPostsFor(post, posts, defaultLang, 2);
    const translations = translationsByKey.get(post.translationKey || post.slug) || [post];

    const html5 = postPage({
      site,
      post,
      body: html.split('\n').map((l) => '            ' + l).join('\n'),
      headings,
      readMin,
      prev,
      next,
      relatedPosts,
      translations,
    });

    const dir = postOutputDir(post, defaultLang);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html5);
    const legacyDir = path.join(POSTS_DIR, post.slug);
    if (path.resolve(legacyDir) !== path.resolve(dir)) {
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.writeFileSync(path.join(legacyDir, 'index.html'), redirectPage(absoluteUrl(site, postPath(post, defaultLang))));
      console.log(`  ok  blog/posts/${post.slug}/index.html  (redirect)`);
    }
    built++;
    console.log(`  ok  ${postPath(post, defaultLang)}index.html  (${lang})`);
  });

  const listingTemplate = fs.readFileSync(path.join(BLOG, 'index.html'), 'utf8');
  languages.forEach((lang) => {
    const output = lang === defaultLang
      ? path.join(BLOG, 'index.html')
      : path.join(ROOT, lang, 'blog', 'index.html');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, localizedBlogIndex(listingTemplate, site, lang, defaultLang, posts));
    console.log(`  ok  ${listingPath(lang, defaultLang)}index.html`);
  });

  // legacy redirect at blog/post.html
  fs.writeFileSync(path.join(BLOG, 'post.html'), legacyRedirect());
  console.log('  ok  blog/post.html (legacy redirect)');

  // sitemap.xml at root
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap(site, posts, languages, defaultLang));
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
