# dmytro.my

single-page site · cli aesthetic · plain html/css/js, no build step.

## tree

```
.
├── index.html              entry
├── styles/main.css         site + blog styles
├── scripts/
│   ├── main.js             home: nav, scramble, spotlight, clock
│   ├── blog.js             blog listing
│   └── post.js             post page · md mini-renderer
├── assets/favicon.svg
└── blog/
    ├── index.html          listing (~/blog)
    ├── post.html           post template (?slug=…)
    ├── posts.json          manifest
    └── posts/*.md          source posts
```

## run

`fetch()` won't work over `file://`, so the blog needs a local http server:

```bash
npx serve .
# or
python -m http.server 8000
```

## adding a post

1. Drop `blog/posts/<slug>.md` (h1 first line is the title).
2. Add an entry to `blog/posts.json`:

```json
{
  "slug": "<slug>",
  "title": "post title",
  "date": "YYYY-MM-DD",
  "tags": ["tag1", "tag2"],
  "summary": "one-line teaser"
}
```

3. Done. Listing/archive/tags/prev-next/toc all auto-update.

## deploy

github pages — point it at the repo root.

## security (public repo)

Before every commit/push, review what was created and what is being published:

```bash
git status
git diff --staged
```

Sensitive data (logins/passwords/tokens/keys/auth files) must never be committed.
See full rules in [SECURITY_RULES.md](./SECURITY_RULES.md).
