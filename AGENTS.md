# AGENTS.md - Project Agent Constitution

## Project Root

- Active root: `D:\codex\浏览器图片分析插件`
- Reference-only legacy extension: `C:\Users\Administrator\AppData\Local\CodexExtensions\codex-promo`
- Do not edit the legacy extension unless the user explicitly asks for a migration or comparison task.

## First Reading Order

1. `AGENTS.md`
2. `README.md`
3. `docs/INDEX.md`
4. Latest file in `docs/logbooks/daily/`
5. Relevant system doc under `docs/systems/`

## Authority Model

| Fact | Canonical Source | Update Trigger |
| --- | --- | --- |
| Product purpose and local commands | `README.md` | Setup, scripts, or install path changes |
| Documentation map | `docs/INDEX.md` | Any doc family is added, moved, or retired |
| Release/version policy | `docs/governance/release-version-policy.md` | Versioning, tag, or GitHub release flow changes |
| Extension architecture | `docs/ARCHITECTURE.md` and `docs/systems/extension/README.md` | Runtime boundaries, permissions, storage, or message contracts change |
| Harness rules and checks | `docs/systems/harness/README.md` | Verification scripts or package harness commands change |
| Work evidence | `docs/logbooks/` | Any meaningful feature, bug fix, release, or governance change |

## Safety Rules

- Preserve user changes in a dirty worktree. Do not revert files unless the user explicitly requests it.
- Do not commit API keys, tokens, `.env` files, private keys, browser profiles, build caches, or `node_modules`.
- Do not force-push or rewrite published history without explicit user approval.
- Use the reference extension only for comparison and migration input.
- Keep API keys in Chrome local storage. Diagnostics must not print Authorization headers, full Data URLs, or complete private prompts.

## Worktree Rules

- Default branch: `main`.
- Before release work, run `git status --short`, inspect remote, branch, recent commits, and tags.
- Keep commits coherent: feature/fix docs separately from release tags when practical.
- Build output in `.output/` is local distribution output, not source of truth.

## Edit And Verification Rules

- Follow existing WXT, React, TypeScript, Vitest, and Playwright patterns.
- Prefer small modules and typed contracts under `src/contracts` and `src/features`.
- Before creating a new UI pattern, check the workbench design docs and registries.
- Run `npm run check` before release commits.
- Run `npm run test:e2e` when extension startup, content script, or workbench flows change.
- Run `npm run harness:verify:project` after governance or docs changes.

## Logging Rules

- Record meaningful work in `docs/logbooks/daily/YYYY-MM-DD.md`.
- Record releases in `docs/logbooks/releases/vX.Y.Z.md`.
- Record failed or partial validations in `docs/logbooks/validations/` when they matter for future work.

## Stop And Ask

Stop and ask before:

- Publishing secrets or large binaries.
- Force-pushing, deleting branches/tags, or rewriting history.
- Changing update/install behavior from manual refresh to automatic overwrite.
- Making changes outside this project root or the explicitly named reference extension.
- Removing user-created prompt presets, model settings, history, or local storage migrations.
