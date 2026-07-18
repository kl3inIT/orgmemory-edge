# OrgMemory Edge

Turn one good run into a team-ready SOP.

OrgMemory Edge is a consent-first, local-first desktop application for capturing a real workflow, producing a reviewable SOP draft, and saving the recipe for repeated runs. Support, finance, operations, and QA teams can document work without requiring an OrgMemory server or any proprietary service.

## v0.1 workflow

1. A pilot explicitly starts a recording session and completes one clean pass in their normal tools.
2. Edge assembles screen context, application names, timeline moments, and optional transcript evidence.
3. The pilot asks for a step-by-step SOP with systems, decisions, exceptions, and evidence links.
4. A teammate reviews every inferred or missing step.
5. The approved recipe can be saved as a repeatable pipe.

Admins can see device health, agent version, consent state, and policy assignment. They do not receive raw screen, audio, or SOP evidence unless the pilot explicitly publishes it.

## Standalone by design

- Runs as a local Tauri desktop app with a Rust core and React UI.
- Exports a versioned JSON envelope; no OrgMemory account is required.
- Has no runtime dependency on Northstar, Screenpipe, Glean, or the private OrgMemory repository.
- Future integrations are optional adapters built on the public contract in [`contracts/`](contracts/).

## Development

Prerequisites: Node.js, pnpm, Rust stable, and the [Tauri 2 system prerequisites](https://v2.tauri.app/start/prerequisites/).

```powershell
pnpm install
pnpm dev
pnpm tauri dev
```

Quality gates:

```powershell
pnpm typecheck
pnpm build
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

The current UI includes a browser-safe demonstration bridge while the Windows capture adapters are built. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for what exists today and [`docs/vision.md`](docs/vision.md) for intended behavior.

## License

Apache-2.0. See [`LICENSE`](LICENSE).
