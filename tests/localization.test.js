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

[
  ['index.html', 'в работе'],
  ['blog/posts/hello-blog/index.html', 'contents'],
  ['blog/posts/hello-blog/index.html', 'post sections'],
  ['blog/posts/hello-blog/index.html', 'dmytro.my blog post'],
  ['blog/posts/hello-blog/index.html', '../home'],
  ['blog/posts/hello-blog/index.html', 'read · ru'],
  ['blog/posts/hello-blog/index.html', '<h2 class="block__title">read</h2>'],
  ['blog/posts/hello-blog/index.html', '1 min'],
].forEach(([file, needle]) => assertExcludes(file, needle));

[
  ['index.html', 'in progress'],
  ['scripts/blog.js', 'Нет записей на выбранном языке.'],
  ['scripts/blog.js', 'Ошибка загрузки posts.json'],
  ['blog/posts/hello-blog.md', '# тест — связь установлена'],
  ['blog/posts/hello-blog.md', 'Проверяю, что блог работает'],
  ['blog/posts/hello-blog/index.html', 'aria-label="пост блога dmytro.my"'],
  ['blog/posts/hello-blog/index.html', 'содержание'],
  ['blog/posts/hello-blog/index.html', '../главная'],
  ['blog/posts/hello-blog/index.html', 'чтение · ru'],
  ['blog/posts/hello-blog/index.html', '<h2 class="block__title">читать</h2>'],
  ['blog/posts/hello-blog/index.html', '1 мин'],
].forEach(([file, needle]) => assertIncludes(file, needle));

console.log('localization checks passed');
