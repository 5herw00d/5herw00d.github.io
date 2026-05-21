# log #001 — opening the channel

> Short notes on building AI products. No filler, no roadmaps for the sake of roadmaps.

I keep a running list of things I learn while shipping AI SaaS — patterns that repeat, footguns that surprise me, snippets I keep pasting from project to project. This blog is that list, made public.

## what to expect

- **Pragmatic notes.** What actually works after you ship to real users.
- **Short posts.** 5 minute reads, with code if it helps.
- **No hype cycles.** I'll post when I have something to say.

## topics on the table

- agents and tool calling in production
- LLM cost and latency tradeoffs
- product loops: idea → demo → users → revenue
- the boring infra under the AI: queues, retries, observability
- typescript and postgres patterns

## stack

This blog is plain markdown rendered client-side over the same html/css/js stack the rest of the site uses. No build step, no CMS, no framework. Just files in a repo.

```bash
blog/
  posts/*.md   # write
  posts.json   # register
  # done.
```

If you want to follow along, the [github](https://github.com/5herw00d) is the most reliable channel.
