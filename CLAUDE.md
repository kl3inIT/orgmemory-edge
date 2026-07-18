# Agent map

Read these sources before changing behavior:

- Product intent: `docs/vision.md`
- Current built facts: `ARCHITECTURE.md`
- Domain contract: `docs/specs/domains/capture-to-sop.md`
- Mirrored acceptance tests: `docs/tests/domains/capture-to-sop.md`
- Active increment: `docs/increments/active/2026-07-18-build-week-foundation/`
- Decisions: `docs/decisions/`
- Safety and testing: `docs/guidelines/`

Keep this file thin. Never describe planned behavior as already built. Keep runtime dependencies independent of OrgMemory and other private systems. Update the active increment first; consolidate durable facts only after verification.
