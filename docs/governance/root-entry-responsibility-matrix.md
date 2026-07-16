# Root Entry Responsibility Matrix

| Entry | Owns | Must Not Own | Update Trigger |
| --- | --- | --- | --- |
| `AGENTS.md` | Agent reading order, safety rules, verification duties | Long feature history, secrets, full specs | Governance or workflow rules change |
| `README.md` | Human overview, setup, main commands | Deep architecture, daily logs | Setup, command, or product summary changes |
| `docs/INDEX.md` | Documentation routing and source-of-truth map | Full document content | Any docs family changes |
| `package.json` | Scripts, package version, dependencies | Release notes | Script, dependency, or version changes |
| `.gitignore` | Local/generated artifact boundaries | Security policy prose | Generated output or secret path rules change |

Verification anchor: `npm run harness:verify:project`.
