# Extension System

## Purpose

Chrome extension for analyzing webpage images, thumbnails, screenshots, and manually selected images through OpenAI-compatible vision providers.

## Ownership

- Background runtime: `entrypoints/background.ts`
- Page/content runtime: `entrypoints/content/index.tsx`
- Message contracts: `src/contracts/messages.ts`
- Settings and permissions: `src/features/settings/`
- Analysis and provider requests: `src/features/analysis/`
- Image preparation: `src/features/media/`
- Prompt presets and migration: `src/features/prompts/`
- History and export: `src/features/history/`
- Floating workbench UI: `src/features/workbench/`, `src/styles/workbench.css`

## Runtime Shape

The MV3 service worker owns privileged Chrome APIs, context menus, downloads, permissions, and provider requests. Content scripts render the floating workbench inside a Shadow DOM and never store API keys.

## Interfaces

| Interface | Direction | Contract | Auth/Permission | Verification |
| --- | --- | --- | --- | --- |
| Runtime messages | content/options to background | `src/contracts/messages.ts` | Chrome extension runtime | unit tests and e2e |
| Provider request | background to provider | OpenAI-compatible chat completions | user API key and optional host permission | analysis tests |
| Image preparation | content to background/provider payload | URL/Data URL to compressed JPEG Data URL when needed | page fetch/CORS limits | media tests |
| Download export | background to Chrome downloads | TXT file for unexported prompt results | `downloads` permission | history export tests |

## Data Model

- Settings and prompt presets live in Chrome local storage.
- History lives in extension-origin IndexedDB through Dexie.
- Export state is tracked with `HistoryRecord.exportedAt`.

## Permissions

Production manifest keeps host access optional. Hover/image page analysis requests optional HTTP/HTTPS origins only when enabled by the user. `downloads` is required for TXT export.

## Failure Modes

- MV3 service worker may show as inactive/invalid while idle. That is not automatically a startup failure.
- Provider `400` errors usually come from invalid model IDs, endpoint mode mismatch, or unsupported remote image URLs.
- Chrome internal pages and extension store pages cannot be injected.

## Verification

- `npm run check`
- `npm run test:e2e`
- Manual Chrome load path: `.output/chrome-mv3`
