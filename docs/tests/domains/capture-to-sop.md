# Capture to SOP acceptance matrix

| Behavior | Automated evidence | Runtime evidence |
|---|---|---|
| Unselected evidence is excluded | Rust unit test `sop_contains_only_selected_evidence` | Review queue toggle |
| Capture is explicit and pausable | Type/build gate | Start/pause control |
| SOP identifies verification needs | Rust draft contract | SOP review panel |
| Admin receives metadata, not raw content | Contract review | Admin console privacy callout |
| App remains standalone | CI runs without external services | Browser demo bridge and local export |

Windows capture, audio, persistence, and model-backed synthesis require new acceptance rows before implementation.
