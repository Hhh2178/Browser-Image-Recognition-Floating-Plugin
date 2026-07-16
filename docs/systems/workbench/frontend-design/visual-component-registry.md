# Visual Component Registry

## Floating Shell

- Purpose: resizable glass workbench container.
- Anatomy: title bar, command actions, body, resize affordance.
- Tokens: `radius.shell`, `shadow.shell`, `shell.width.*`, `shell.height.*`.
- States: idle, dragging, resizing, loading, error.
- Do not duplicate with: sidebar or standalone options page shells.
- Source: `src/features/workbench/Workbench.tsx`, `src/styles/workbench.css`.

## Inline Settings View

- Purpose: model/provider, permissions, prompt presets, and team settings inside the shell.
- Anatomy: section tabs, compact form rows, provider/model list, save status.
- Tokens: `color.panel`, `radius.panel`, `control.height`.
- States: clean, dirty, saving, saved, invalid.
- Source: `src/features/workbench/WorkbenchSettings.tsx`.

## Task Queue Panel

- Purpose: show active and completed image analysis tasks without blocking new tasks.
- Anatomy: collapsed header, task rows, status marks, retry/open actions.
- States: collapsed, expanded, running, done, failed.
- Source: `src/features/workbench/Workbench.tsx`.

## History Drawer

- Purpose: searchable history and incremental TXT export.
- Anatomy: title, export button, search, record list, status labels.
- States: empty, pending export, exporting, exported, error.
- Source: `src/features/history/HistoryDrawer.tsx`.
