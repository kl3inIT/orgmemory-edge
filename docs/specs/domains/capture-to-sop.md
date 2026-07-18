# Capture to SOP specification

## Scenario: pilot records one clean pass

Given capture is paused, when the pilot explicitly starts a session, then the UI must show a persistent recording state and offer pause. Evidence is stored locally and can be selected or excluded before drafting.

## Scenario: generate a useful SOP

Given at least one selected evidence item from the requested time range, when the pilot creates a draft, then the draft contains:

- objective and ordered steps;
- systems used;
- decisions and exceptions;
- evidence identifiers or deep links;
- explicit human-verification flags.

No unselected evidence may appear in the draft.

## Scenario: review and repeat

The pilot and teammate can correct guessed or missing steps before export. An approved configuration can become a pipe that repeats the same summary after later runs.

## Scenario: admin checks fleet health

The admin may see device identity, platform, agent status/version, last-seen time, consent state, and assigned policy. Raw evidence content is not included in the admin status contract.
