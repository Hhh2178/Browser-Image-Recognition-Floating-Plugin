# Release And Version Policy

## Versioning

Use semantic versions from `package.json`.

- Patch: bug fixes, small UI polish, docs-only release notes.
- Minor: user-visible features such as export, model routing, queues, prompt migration, or install/update flow changes.
- Major: breaking storage migrations, incompatible provider contracts, or large architecture changes.

## Release Flow

1. Inspect `git status --short`, current branch, remote, recent commits, and tags.
2. Update `package.json` and `package-lock.json`.
3. Run `npm run harness:verify:project`.
4. Run `npm run check`.
5. Run `npm run test:e2e` when browser behavior changed.
6. Commit with a clear message.
7. Create annotated tag `vX.Y.Z`.
8. Push branch, then push tag.
9. Record release evidence in `docs/logbooks/releases/vX.Y.Z.md`.

## GitHub Release

Pushing a tag does not automatically mean a GitHub Release page exists. Create a GitHub Release from the pushed tag when downloadable assets or public release notes are needed.

## Update Boundary

The extension may check GitHub for newer versions and guide the user to download or reload an unpacked build. It must not overwrite local settings, prompt presets, API keys, or history. Fully automatic install/overwrite updates require a separate approval because Chrome extension updates have security and packaging constraints.
