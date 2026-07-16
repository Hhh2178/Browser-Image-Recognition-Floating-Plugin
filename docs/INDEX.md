# Documentation Index

## Fast Path

For a new task, read:

1. `AGENTS.md`
2. `README.md`
3. This index
4. Latest daily log in `docs/logbooks/daily/`
5. Relevant system document under `docs/systems/`

## Source Of Truth

| Topic | Canonical Location |
| --- | --- |
| Install and Chrome loading path | `docs/INSTALL.md` |
| Model/provider configuration | `docs/CONFIGURATION.md` |
| Runtime architecture | `docs/ARCHITECTURE.md`, `docs/systems/extension/README.md` |
| Migration from legacy extension | `docs/MIGRATION.md` |
| Specs and implementation plans | `docs/superpowers/specs/`, `docs/superpowers/plans/` |
| Governance and release rules | `docs/governance/` |
| Harness verification | `docs/systems/harness/README.md` |
| Work and release evidence | `docs/logbooks/` |

## Document Families

- `docs/governance/`: durable rules for releases, worktree safety, documentation, and engineering guardrails.
- `docs/systems/`: runtime systems, interfaces, permissions, data flow, and verification.
- `docs/logbooks/`: append-only evidence for daily work, releases, validations, and incidents.
- `docs/superpowers/`: product specs and execution plans.

## Update Rules

- Update this index when adding, moving, or retiring a documentation family.
- Update system docs when message contracts, storage, permissions, provider behavior, or UI shell behavior changes.
- Update release logs for every version tag.
- Update daily logs for meaningful implementation, debugging, migration, or governance work.

## Verification

- `npm run harness:verify:project`
- `npm run harness:verify:release`
- `npm run check`
