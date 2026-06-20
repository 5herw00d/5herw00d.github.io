function langOf(post, defaultLang) {
  return post.lang || defaultLang;
}

function validatePost(post) {
  const slug = post.slug || '<unknown>';
  if (!post.title || !post.title.trim()) {
    throw new Error(`${slug}: title is required`);
  }
  if (!post.summary || !post.summary.trim()) {
    throw new Error(`${slug}: summary is required`);
  }
  if ([...post.summary].length > 160) {
    throw new Error(`${slug}: summary must be 160 characters or fewer`);
  }
}

function relatedPostsFor(post, posts, defaultLang, limit = 2) {
  const tags = new Set(post.tags || []);
  const lang = langOf(post, defaultLang);

  return posts
    .filter((candidate) => candidate !== post && langOf(candidate, defaultLang) === lang)
    .map((candidate) => ({
      post: candidate,
      sharedTags: (candidate.tags || []).filter((tag) => tags.has(tag)).length,
    }))
    .sort((a, b) =>
      b.sharedTags - a.sharedTags ||
      b.post.date.localeCompare(a.post.date) ||
      a.post.title.localeCompare(b.post.title)
    )
    .slice(0, limit)
    .map((candidate) => candidate.post);
}

module.exports = { validatePost, relatedPostsFor };
