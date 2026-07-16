# Harness System

## Purpose

The harness keeps project rules, docs, package scripts, and release evidence aligned so future iterations can be changed and published without guessing.

## Ownership

- Rules: `AGENTS.md`, `docs/governance/`
- Docs router: `docs/INDEX.md`
- Verification script: `scripts/verify-harness-contract.mjs`
- Package entrypoints: `package.json`
- Evidence: `docs/logbooks/`

## Runtime Shape

The harness is local and deterministic. It does not call external services and does not mutate Chrome or GitHub.

## Interfaces

| Interface | Direction | Contract | Verification |
| --- | --- | --- | --- |
| `npm run harness:verify:project` | developer to repo | Checks required governance docs, scripts, and log folders | `scripts/verify-harness-contract.mjs` |
| `npm run harness:verify:release` | developer to repo | Checks version, release policy, and release log structure | `scripts/verify-harness-contract.mjs --release` |

## Failure Modes

- Missing docs: create the named file or update the docs index if the structure changed intentionally.
- Missing package scripts: restore `harness:verify:project` and `harness:verify:release`.
- Missing release log: add `docs/logbooks/releases/vX.Y.Z.md` before tagging.

## Verification

- `npm run harness:verify:project`
- `npm run harness:verify:release`
- `npm run check`
