# Engineering Guardrails

## Worktree Safety

- Treat unknown local changes as user work.
- Do not revert or delete user changes without explicit instruction.
- Keep implementation edits scoped to the requested feature or fix.

## Secret Handling

- Do not commit API keys, tokens, browser profiles, `.env` files, or private keys.
- Do not print Authorization headers, full Data URLs, or complete private prompts in diagnostics.
- Team configuration may include provider/model metadata, but API keys stay local.

## Generated Artifacts

- `node_modules/`, `.wxt/`, `.output/`, `test-results/`, and browser profiles are generated/local.
- Rebuild extension output with `npm run build` or `npm run zip`.

## Verification

- Use `npm run check` for normal release readiness.
- Use `npm run test:e2e` when content scripts, context menus, extension startup, or workbench flows change.
- Use `npm run harness:verify:project` after governance or documentation changes.

## UI Governance

- Floating workbench remains the primary UX shell.
- Settings open inside the workbench, not as a separate options tab unless Chrome requires a system page.
- Preserve compact dark glass styling, rounded shells, cyan accents, and resize constraints.
