# Agent safety

- Never record, commit, log, or export passwords, tokens, private keys, or unrelated personal context.
- Use isolated developer data and deterministic fixtures in tests.
- Do not add network transmission without an explicit architecture decision and visible user control.
- Preserve the admin/raw-evidence boundary.
- Verify unfamiliar Rust/Tauri APIs against current official documentation before using them.
- Do not copy source or assets from restricted competitors; reimplement behavior cleanly.
