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

[
  ['index.html', 'в работе'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', 'contents'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', 'post sections'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', 'dmytro.my blog post'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', '../home'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', 'read · ru'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', '<h2 class="block__title">read</h2>'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', '1 min'],
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
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', 'aria-label="пост блога dmytro.my"'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', 'содержание'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', '../главная'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', 'чтение · ru'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', '<h2 class="block__title">читать</h2>'],
  ['blog/posts/aws-ai-agent-deployment-ru/index.html', '1 мин'],
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
  'blog/posts/aws-ai-agent-deployment-ru/index.html',
].forEach(assertNoTrailingWhitespace);

console.log('localization checks passed');
