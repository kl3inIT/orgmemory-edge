# Capture to SOP acceptance matrix

| Behavior | Automated evidence | Runtime evidence |
|---|---|---|
| Unselected evidence is excluded | Rust unit test `sop_contains_only_selected_evidence` | Review queue toggle |
| Capture is explicit and pausable | Type/build gate | Start/pause control |
| SOP identifies verification needs | Rust draft contract | SOP review panel |
| Export cannot claim approval before review | Rust test `export_requires_human_review` | Disabled export until reviewer and flags resolve |
| Approved envelope carries review and recipe | Rust test `approved_export_records_review_and_recipe` | Exported JSON envelope 1.1 |
| Evidence is traceable | Rust selected-evidence test | Timestamped evidence locators |
| Source readiness is truthful | Snapshot contract | Screen/audio/MCP source strip labels demo state |
| Decisions and exceptions are visible | SOP contract | Dedicated review-panel sections |
| Admin receives metadata, not raw content | Contract review | Admin console privacy callout |
| App remains standalone | CI runs without external services | Browser demo bridge and local export |

Windows capture, audio, persistence, and model-backed synthesis require new acceptance rows before implementation.
