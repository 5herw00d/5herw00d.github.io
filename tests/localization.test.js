const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STYLE_VERSION = '20260620-1';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function assertIncludes(file, needle) {
  assert(
    read(file).includes(needle),
    `${file} should include ${JSON.stringify(needle)}`
  );
}

function assertExcludes(file, needle) {
  assert(
    !read(file).includes(needle),
    `${file} should not include ${JSON.stringify(needle)}`
  );
}

function assertNoTrailingWhitespace(file) {
  const lines = read(file).split('\n');
  const line = lines.findIndex((value) => /[ \t]+$/.test(value));
  assert.strictEqual(line, -1, `${file}:${line + 1} should not contain trailing whitespace`);
}

function assertExists(file) {
  assert(fs.existsSync(path.join(ROOT, file)), `${file} should exist`);
}

function assertMatches(file, pattern) {
  assert(pattern.test(read(file)), `${file} should match ${pattern}`);
}

function relatedSection(file) {
  const match = read(file).match(/<section class="related-posts"[\s\S]*?<\/section>/);
  assert(match, `${file} should include a related posts section`);
  return match[0];
}

assertMatches(
  'styles/main.css',
  /\.rail__status p\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*baseline;[^}]*justify-content:\s*space-between;[^}]*gap:\s*8px;[^}]*\}/
);
assertMatches(
  'styles/main.css',
  /\.rail__status p > :last-child\s*\{[^}]*white-space:\s*nowrap;[^}]*text-align:\s*right;[^}]*\}/
);
assertMatches(
  'styles/main.css',
  /\.rail__status p > :first-child\s*\{[^}]*flex:\s*0 0 auto;[^}]*white-space:\s*nowrap;[^}]*\}/
);
assertMatches(
  'styles/main.css',
  /\.rail__status \.rail__status-row--slug > :last-child\s*\{[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere;[^}]*\}/
);
assertMatches(
  'styles/main.css',
  /\.visually-hidden\s*\{[^}]*position:\s*absolute;[^}]*clip:\s*rect\(0 0 0 0\);[^}]*overflow:\s*hidden;[^}]*\}/
);

[
  'index.html',
  'about/index.html',
  'ru/index.html',
  'ru/about/index.html',
  'blog/index.html',
  'ru/blog/index.html',
  'blog/posts/openclaw-personal-ai-assistant/index.html',
  'ru/blog/posts/openclaw-personal-ai-assistant/index.html',
].forEach((file) => assertIncludes(file, `main.css?v=${STYLE_VERSION}`));

const manifest = JSON.parse(read('blog/posts.json'));
manifest.posts.forEach((post) => {
  assert(post.title && post.title.trim(), `${post.slug}: title required`);
  assert(post.summary && post.summary.trim(), `${post.slug}: summary required`);
  assert([...post.summary].length <= 160, `${post.slug}: summary too long`);
});

[
  'blog/feed.xml',
  'blog/feed.en.xml',
  'blog/feed.ru.xml',
].forEach((file) => assertIncludes(file, '<lastBuildDate>Fri, 19 Jun 2026 00:00:00 GMT</lastBuildDate>'));

[
  ['index.html', 'в работе'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', 'contents'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', 'post sections'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', 'dmytro.my blog post'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', '../home'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', 'read · ru'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', '<h2 class="block__title">read</h2>'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', '1 min'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'содержание'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'разделы поста'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'пост блога dmytro.my'],
  ['blog/posts/aws-ai-agent-deployment/index.html', '../главная'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'чтение · en'],
  ['blog/posts/aws-ai-agent-deployment/index.html', '<h2 class="block__title">читать</h2>'],
  ['blog/posts/aws-ai-agent-deployment/index.html', '1 мин'],
].forEach(([file, needle]) => assertExcludes(file, needle));

[
  ['index.html', 'building'],
  ['scripts/blog.js', 'Нет записей на выбранном языке.'],
  ['scripts/blog.js', 'Ошибка загрузки posts.json'],
  ['blog/posts/aws-ai-agent-deployment-ru.md', '# Как ИИ-агент настроил AWS, домен, SSL и CDN за 10 минут'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', 'aria-label="пост блога dmytro.my"'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', 'содержание'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', '../главная'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', 'чтение · ru'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', '<h2 class="block__title">читать</h2>'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', '1 мин'],
  ['blog/posts/aws-ai-agent-deployment.md', '# How an AI Agent Configured AWS, a Domain, SSL, and CDN in 10 Minutes'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'aria-label="dmytro.my blog post"'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'contents'],
  ['blog/posts/aws-ai-agent-deployment/index.html', '../home'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'read · en'],
  ['blog/posts/aws-ai-agent-deployment/index.html', '<h2 class="block__title">read</h2>'],
  ['blog/posts/aws-ai-agent-deployment/index.html', '1 min'],
  ['blog/posts/aws-ai-agent-deployment/index.html', '<p class="rail__status-row rail__status-row--slug">'],
].forEach(([file, needle]) => assertIncludes(file, needle));

[
  'blog/posts/aws-ai-agent-deployment/index.html',
  'ru/blog/posts/aws-ai-agent-deployment/index.html',
].forEach(assertNoTrailingWhitespace);

[
  'ru/index.html',
  'ru/about/index.html',
  'ru/blog/index.html',
  'ru/blog/posts/aws-ai-agent-deployment/index.html',
].forEach(assertExists);

[
  ['blog/index.html', 'data-lang="all"'],
  ['blog/index.html', 'aria-current="page" aria-current'],
  ['ru/blog/index.html', 'data-lang="en" aria-current="page"'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'Как ИИ-агент настроил AWS'],
  ['ru/index.html', 'I build AI products end-to-end.'],
  ['ru/about/index.html', 'I build AI products end-to-end.'],
  ['index.html', 'class="display__name"'],
  ['ru/index.html', 'class="display__name"'],
  ['ru/index.html', 'часовой пояс'],
  ['ru/about/index.html', 'часовой пояс'],
].forEach(([file, needle]) => assertExcludes(file, needle));

[
  ['blog/index.html', 'href="/blog/" hreflang="en"'],
  ['blog/index.html', 'href="/ru/blog/" hreflang="ru"'],
  ['blog/index.html', 'class="lang-chip is-active" data-lang="en" aria-current="page"'],
  ['ru/blog/index.html', '<html lang="ru">'],
  ['ru/blog/index.html', '<link rel="canonical" href="https://dmytro.my/ru/blog/">'],
  ['ru/blog/index.html', 'aria-label="фильтр по языку"'],
  ['ru/blog/index.html', '<span class="display__name">блог</span>'],
  ['ru/blog/index.html', 'Короткие практические заметки'],
  ['ru/blog/index.html', 'class="lang-chip is-active" data-lang="ru" aria-current="page"'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'class="site-lang"'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'hreflang="ru" href="/ru/blog/posts/aws-ai-agent-deployment/"'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'rel="alternate" hreflang="x-default"'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', '<html lang="ru">'],
  ['ru/blog/posts/aws-ai-agent-deployment/index.html', 'hreflang="en" href="/blog/posts/aws-ai-agent-deployment/"'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', '/ru/blog/posts/aws-ai-agent-deployment/'],
  ['sitemap.xml', 'https://dmytro.my/ru/blog/'],
  ['sitemap.xml', 'https://dmytro.my/ru/blog/posts/aws-ai-agent-deployment/'],
  ['blog/feed.ru.xml', 'https://dmytro.my/ru/blog/posts/aws-ai-agent-deployment/'],
  ['index.html', '<link rel="alternate" hreflang="ru" href="https://dmytro.my/ru/">'],
  ['index.html', 'class="site-lang"'],
  ['index.html', 'hreflang="ru" href="/ru/"'],
  ['index.html', '<h1 class="visually-hidden">Dmytro My</h1>'],
  ['about/index.html', '<link rel="alternate" hreflang="ru" href="https://dmytro.my/ru/about/">'],
  ['about/index.html', 'hreflang="ru" href="/ru/about/"'],
  ['ru/index.html', '<html lang="ru">'],
  ['ru/index.html', '<link rel="canonical" href="https://dmytro.my/ru/">'],
  ['ru/index.html', 'hreflang="en" href="/"'],
  ['ru/index.html', 'Я создаю AI-продукты под ключ.'],
  ['ru/index.html', 'href="/ru/about/"'],
  ['ru/index.html', 'href="/ru/blog/"'],
  ['ru/index.html', '<h1 class="visually-hidden">Dmytro My</h1>'],
  ['ru/index.html', '<span class="key">TZ</span><span>UA · UTC+3</span>'],
  ['ru/about/index.html', '<html lang="ru">'],
  ['ru/about/index.html', '<link rel="canonical" href="https://dmytro.my/ru/about/">'],
  ['ru/about/index.html', 'hreflang="en" href="/about/"'],
  ['ru/about/index.html', 'продуктовое мышление + инженерия'],
  ['ru/about/index.html', 'href="/ru/blog/"'],
  ['ru/about/index.html', '<span class="key">TZ</span><span>UA · UTC+3</span>'],
  ['blog/index.html', 'class="site-lang"'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'class="site-lang"'],
  ['sitemap.xml', '<loc>https://dmytro.my/ru/</loc>'],
  ['sitemap.xml', '<loc>https://dmytro.my/ru/about/</loc>'],
].forEach(([file, needle]) => assertIncludes(file, needle));

const awsSummaryEn = 'Deploy a project to AWS in 10 minutes with AI agents. Ready-to-use DevOps prompts for ChatGPT, Claude, Gemini, and GLM.';
const awsSummaryRu = 'Как развернуть проект на AWS за 10 минут с ИИ-агентом: готовые DevOps-промпты для ChatGPT, Claude, Gemini и GLM.';
assertIncludes('blog/posts/aws-ai-agent-deployment/index.html', `<meta name="description" content="${awsSummaryEn}">`);
assertIncludes('blog/posts/aws-ai-agent-deployment/index.html', `<meta property="og:description" content="${awsSummaryEn}">`);
assertIncludes('blog/posts/aws-ai-agent-deployment/index.html', `<meta name="twitter:description" content="${awsSummaryEn}">`);
assertIncludes('ru/blog/posts/aws-ai-agent-deployment/index.html', `<meta name="description" content="${awsSummaryRu}">`);

const relatedEn = relatedSection('blog/posts/aws-ai-agent-deployment/index.html');
assert(relatedEn.includes('<h2 class="related-posts__title"'), 'EN related heading should exist');
assert(relatedEn.includes('>related posts</h2>'), 'EN related heading should be localized');
assert(relatedEn.includes('/blog/posts/hermes-agent-learning-assistant/'), 'EN related posts should include Hermes');
assert(relatedEn.includes('/blog/posts/openclaw-personal-ai-assistant/'), 'EN related posts should include OpenClaw');
assert(!relatedEn.includes('/ru/'), 'EN related posts should not link to RU');
assert(!relatedEn.includes('/blog/posts/aws-ai-agent-deployment/'), 'EN related posts should not link to itself');
assert.strictEqual((relatedEn.match(/class="related-posts__link"/g) || []).length, 2, 'EN should have two related links');

const relatedRu = relatedSection('ru/blog/posts/aws-ai-agent-deployment/index.html');
assert(relatedRu.includes('>похожие статьи</h2>'), 'RU related heading should be localized');
assert(relatedRu.includes('/ru/blog/posts/hermes-agent-learning-assistant/'), 'RU related posts should include Hermes');
assert(relatedRu.includes('/ru/blog/posts/openclaw-personal-ai-assistant/'), 'RU related posts should include OpenClaw');
assert(!relatedRu.includes('/ru/blog/posts/aws-ai-agent-deployment/'), 'RU related posts should not link to itself');
assert.strictEqual((relatedRu.match(/class="related-posts__link"/g) || []).length, 2, 'RU should have two related links');

assertIncludes('blog/posts/aws-ai-agent-deployment/index.html', 'class="post-nav"');
assertIncludes('ru/blog/posts/aws-ai-agent-deployment/index.html', 'class="post-nav"');

console.log('localization checks passed');
