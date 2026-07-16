# Functional Component Registry

## Provider And Model Routing

- Inputs: provider configs, model IDs, daily usage caps, active task.
- Outputs: selected request endpoint and model.
- Permission boundary: background owns API key usage.
- Reuse rule: use existing settings repository and routing logic; do not create one-off provider state.
- Verification: settings and analysis tests.

## Prompt Preset Manager

- Inputs: built-in presets, migrated legacy presets, user custom presets.
- Outputs: selected prompt template and editable custom presets.
- Permission boundary: local extension storage only.
- Reuse rule: keep prompt migration centralized in `src/features/prompts/`.
- Verification: prompt migration tests.

## Analysis Task Queue

- Inputs: source image, prompt preset, provider/model selection.
- Outputs: task lifecycle, result, error, history record.
- Permission boundary: content script starts tasks; background performs provider requests.
- Reuse rule: do not block the workbench during a running analysis.
- Verification: workbench tests and e2e.

## Incremental TXT Export

- Inputs: successful history records without `exportedAt`.
- Outputs: downloaded TXT and updated export markers.
- Permission boundary: background uses Chrome downloads.
- Reuse rule: mark exported only after download completion.
- Verification: history export tests.
