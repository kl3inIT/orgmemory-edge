# Testing harness

Use three terminating gates:

1. **Static:** TypeScript typecheck, rustfmt, Clippy, schema validation.
2. **Context:** frontend build and Rust tests; no long-running dev server as proof.
3. **Runtime:** exercise consent, select/exclude, SOP generation, admin privacy boundary, and export in the real desktop or browser flow.

Each active increment must link its behavior spec to a mirrored acceptance test. Compile success alone is not product proof.
