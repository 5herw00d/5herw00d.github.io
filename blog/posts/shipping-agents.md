# shipping agents that don't embarrass you

> A short checklist I run through before any LLM agent meets a paying customer.

A demo agent and a production agent are different species. The demo runs once, in your hands, on a happy-path prompt. The production agent runs *thousands of times*, in someone else's hands, on prompts you would never type.

Here's the checklist.

## 1. cap the loop

Every agent loop needs a hard ceiling. Steps, tokens, wall time — pick all three.

```ts
const MAX_STEPS = 12;
const MAX_TOKENS = 60_000;
const MAX_MS = 90_000;
```

If your agent ever hits the cap, that's a signal — log it, surface it, fix the prompt or the tool.

## 2. structure the output

Free-form text is a liability. Make the model emit JSON with a schema you actually validate. Reject and retry on parse failure. Log every rejection — they tell you where your prompt is fuzzy.

## 3. tool errors are first-class

Every tool returns either `{ ok: true, data }` or `{ ok: false, error }`. The agent sees the error and decides. No silent throws, no swallowed stack traces.

## 4. determinism where you can

- temperature 0 for routing and extraction
- a fixed model version pin (no `latest`)
- seed the random parts of your prompt (sample order, k examples)

You'll thank yourself when a regression appears and you can actually bisect.

## 5. observability before features

Before you add the next tool, make sure you can answer:

- which prompt did this user see?
- which model and version answered?
- how many tokens, how many ms, how much money?
- what was the full tool trace?

If you can't answer those, you're flying blind.

## 6. a real eval set

Twenty real prompts with known-good outputs. Run them on every prompt or model change. Diff the outputs. This catches more regressions than any unit test.

## 7. a kill switch

One env var that disables the agent and falls back to a static response. You will need it.

---

Most production failures I've seen come from skipping items 4-6. Fancy is not what fails. Boring is what fails — and boring is what you control.
