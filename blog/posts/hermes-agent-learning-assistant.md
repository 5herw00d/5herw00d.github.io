# Hermes Agent: A Personal AI Agent That Learns

Most AI assistants start each new conversation with almost no knowledge of previous work. Hermes Agent takes a different approach: it preserves useful experience, learns user preferences, and turns recurring workflows into reusable skills.

Hermes Agent is an open-source project from Nous Research. It supports multiple model providers and can run locally, in Docker, on a remote server, or in a serverless environment.

## how memory works

Hermes uses several memory layers.

`MEMORY.md` stores technical facts, conventions, and lessons learned. `USER.md` contains user preferences, communication style, and working habits.

Together, these files are limited to roughly 1,300 tokens. This forces the agent to keep important information instead of copying the entire conversation history.

Complete sessions are stored separately in SQLite and indexed with FTS5. The agent can search a conversation from several weeks ago even when it is not included in active memory.

External memory providers such as Honcho and Mem0 can also be connected.

## skills as procedural memory

The most interesting Hermes feature is its ability to create and improve skills.

After completing a complex task, the agent can save the successful procedure as a `SKILL.md` file. The next time it encounters a similar problem, it can reuse the process instead of starting from zero.

The format is compatible with the open [Agent Skills](https://agentskills.io) standard, making skills portable between compatible agents.

Automatic memory and skill changes can require approval. This matters because an agent may learn independently, but the user should still control what it learns.

## where Hermes can run

Hermes supports six execution backends:

- local;
- Docker;
- SSH;
- Singularity;
- Daytona;
- Modal.

The same agent can work on a laptop, home server, VPS, or serverless infrastructure.

It can be accessed through the CLI, Telegram, Discord, Slack, WhatsApp, and Signal. A conversation started in the terminal can continue in a messenger.

Hermes also supports natural-language cron jobs and parallel subagents. One agent can research documentation while others inspect code and prepare a report.

## who Hermes is for

Hermes is useful when you need a persistent working agent rather than another chat interface:

- it should remember projects and preferences;
- work through both terminal and messaging apps;
- handle long technical tasks;
- build a reusable library of procedures;
- run locally or on your own infrastructure.

A built-in migration tool can import settings, memories, and skills from OpenClaw.

## what to check before installation

Hermes may access your terminal, files, and external services. I would not enable maximum permissions immediately.

Start by:

- running it in Docker or on an isolated machine;
- restricting available commands and directories;
- requiring approval for memory and skill changes;
- keeping secrets out of messaging platforms;
- monitoring model costs;
- backing up the `~/.hermes` directory.

Hermes is not interesting simply because it has many tools. Its main advantage is the learning loop: complete a task, preserve useful experience, and reuse it next time.

That feels less like a chatbot and more like a personal technical assistant that gradually adapts to its owner.

Sources: [Hermes Agent](https://github.com/NousResearch/hermes-agent), [official documentation](https://hermes-agent.nousresearch.com/docs/).
