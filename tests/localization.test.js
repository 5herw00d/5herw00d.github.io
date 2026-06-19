const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

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

assertMatches(
  'styles/main.css',
  /\.rail__status p\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(9ch,\s*auto\)\s+minmax\(0,\s*1fr\);[^}]*gap:\s*8px;[^}]*\}/
);

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
  ['about/index.html', '<link rel="alternate" hreflang="ru" href="https://dmytro.my/ru/about/">'],
  ['about/index.html', 'hreflang="ru" href="/ru/about/"'],
  ['ru/index.html', '<html lang="ru">'],
  ['ru/index.html', '<link rel="canonical" href="https://dmytro.my/ru/">'],
  ['ru/index.html', 'hreflang="en" href="/"'],
  ['ru/index.html', 'Я создаю AI-продукты под ключ.'],
  ['ru/index.html', 'href="/ru/about/"'],
  ['ru/index.html', 'href="/ru/blog/"'],
  ['ru/about/index.html', '<html lang="ru">'],
  ['ru/about/index.html', '<link rel="canonical" href="https://dmytro.my/ru/about/">'],
  ['ru/about/index.html', 'hreflang="en" href="/about/"'],
  ['ru/about/index.html', 'продуктовое мышление + инженерия'],
  ['ru/about/index.html', 'href="/ru/blog/"'],
  ['blog/index.html', 'class="site-lang"'],
  ['blog/posts/aws-ai-agent-deployment/index.html', 'class="site-lang"'],
  ['sitemap.xml', '<loc>https://dmytro.my/ru/</loc>'],
  ['sitemap.xml', '<loc>https://dmytro.my/ru/about/</loc>'],
].forEach(([file, needle]) => assertIncludes(file, needle));

console.log('localization checks passed');
