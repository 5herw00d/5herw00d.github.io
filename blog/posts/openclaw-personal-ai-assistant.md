# OpenClaw: A Personal AI Assistant Across Devices

OpenClaw is an open-source assistant that runs on your infrastructure and responds through the communication channels you already use.

At the center of the system is the Gateway. It connects models, tools, memory, devices, and messaging platforms.

## one Gateway, many channels

OpenClaw supports WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Microsoft Teams, Matrix, and many other platforms.

This is more than the same bot connected to several messengers. The Gateway manages sessions, routing, tools, and events.

You can create multiple isolated agents, for example:

- a personal assistant;
- a development agent;
- a support bot;
- an agent for a team channel.

Each agent can have its own workspace, history, memory, and permissions.

## memory

OpenClaw stores long-term memory in Markdown files inside the workspace. It also provides a built-in SQLite backend and optional memory systems such as QMD, Honcho, and LanceDB.

Before a long conversation is compacted, the agent can save important facts to memory. This reduces the chance of useful information disappearing during context compression.

Because memory lives in the workspace, it can be inspected, edited, backed up, and stored on your own infrastructure.

## skills and ClawHub

OpenClaw skills are `SKILL.md` instruction files that teach an agent how to use tools and follow specific procedures.

Skills can exist at several levels:

- inside a workspace;
- inside a project;
- in a personal user directory;
- in the shared OpenClaw directory;
- inside plugins.

Local skills have higher priority than bundled ones. This makes it possible to override standard behavior without modifying OpenClaw itself.

Community skills are available through ClawHub. OpenClaw also provides Skill Workshop for reviewing and approving agent-drafted procedures.

## cron and heartbeat

OpenClaw has separate automation mechanisms.

Cron is useful for precise schedules: sending a morning report, running a nightly backup, or performing a check at a specific time.

Heartbeat handles periodic background activity where exact timing is less important, such as checking services, new messages, or unfinished work.

Background tasks and webhooks are also supported. OpenClaw can therefore operate as a continuous automation system, not only as a reactive chatbot.

## security

The main session can run tools directly on the host by default. This is convenient, but it requires careful configuration.

Additional agents and group sessions can run in sandboxes. OpenClaw supports Docker, SSH, and OpenShell isolation backends.

Unknown users in messaging apps must normally complete pairing. Their messages are not processed until the owner approves the pairing code.

OpenTelemetry diagnostics are optional. Prompt text, responses, and tool inputs or outputs are not exported by default.

## who OpenClaw is for

OpenClaw is worth considering when you need:

- an always-on personal assistant;
- access through many messaging platforms;
- iMessage support;
- several isolated agents;
- one Gateway for multiple devices and channels;
- a large ecosystem of reusable skills;
- automation through cron, heartbeat, and webhooks.

## what to check before launch

Before connecting real accounts, I would:

- run the Gateway locally;
- keep DM pairing enabled;
- place group sessions in sandboxes;
- restrict filesystem and command access;
- create separate API keys with minimal permissions;
- configure workspace backups;
- connect channels one at a time.

OpenClaw is more than a Telegram or WhatsApp bot. It is a local control plane for a personal AI assistant that can work across devices and communicate through many different channels.

Its main advantage is not a particular model. It is the infrastructure around the agent: Gateway, routing, memory, skills, automation, and security.

Sources: [OpenClaw](https://github.com/openclaw/openclaw), [official documentation](https://docs.openclaw.ai/).
