# Project security rules (public repository)

This repository is public. Every change must be reviewed before commit/push.

## Never commit or push

- Logins, passwords, API tokens, cookies, session IDs
- Private keys, certificates, SSH keys, auth files
- `.env` and any real environment files with secrets
- Any sensitive personal or infrastructure data

## Mandatory checks before push

1. Review created/changed files: `git status` and `git diff --staged`
2. Ensure no secrets are present in code, configs, logs, or test data
3. Ensure temporary/local auth files are not tracked
4. Push only intentional files that are safe for a public repo

## If sensitive data was committed by mistake

1. Stop and do not push further commits
2. Remove sensitive data from tracked files and history
3. Rotate compromised credentials/keys immediately
