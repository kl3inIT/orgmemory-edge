# Enterprise pilot acceptance gates

The product is not pilot-ready until all P0 rows have executable evidence.

| Priority | Gate | Required proof |
|---|---|---|
| P0 | Named consent session | Real Windows runtime test covering source scope, pause, stop, and separate audio consent |
| P0 | Exclusions and redaction | Automated denylist/secret fixtures plus runtime preview and deletion |
| P0 | Durable evidence | Restart/recovery test with timestamped source locators and configurable retention |
| P0 | Grounded SOP | Every accepted factual step resolves to allowed session evidence |
| P0 | Human review | Independent reviewer identity, edit/redaction history, unresolved-flag export denial |
| P0 | Permission boundary | Admin metadata contract excludes raw content; all content access is audited |
| P1 | Repeatable pipe | Persist recipe, execute on three named runs, propose changes without auto-overwrite |
| P1 | Fleet health | Real enrollment, agent version, heartbeat, consent state, policy version, and last seen |
| P1 | Transfer outcome | Non-author completes workflow and pilot scorecard is produced |
