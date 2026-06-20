const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePost, relatedPostsFor } = require('../scripts/blog-data.js');

test('validatePost requires title and summary within 160 characters', () => {
  assert.throws(() => validatePost({ slug: 'missing-title', summary: 'ok' }), /title is required/);
  assert.throws(() => validatePost({ slug: 'missing-summary', title: 'Title' }), /summary is required/);
  assert.throws(
    () => validatePost({ slug: 'long', title: 'Title', summary: 'x'.repeat(161) }),
    /summary must be 160 characters or fewer/
  );
  assert.doesNotThrow(() => validatePost({ slug: 'valid', title: 'Title', summary: 'Useful summary.' }));
});

test('relatedPostsFor ranks same-language candidates by tags then date', () => {
  const current = { slug: 'current', lang: 'en', date: '2026-06-20', tags: ['agents', 'aws'] };
  const posts = [
    current,
    { slug: 'ru-match', lang: 'ru', date: '2026-06-20', tags: ['agents', 'aws'], title: 'RU' },
    { slug: 'one-tag-new', lang: 'en', date: '2026-06-19', tags: ['agents'], title: 'One' },
    { slug: 'two-tags-old', lang: 'en', date: '2026-06-18', tags: ['agents', 'aws'], title: 'Two' },
    { slug: 'one-tag-old', lang: 'en', date: '2026-06-17', tags: ['aws'], title: 'Three' },
  ];

  assert.deepEqual(
    relatedPostsFor(current, posts, 'en', 2).map((post) => post.slug),
    ['two-tags-old', 'one-tag-new']
  );
});
