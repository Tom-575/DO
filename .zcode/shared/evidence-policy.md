# Evidence Policy

Evidence must be observable, reproducible where practical, and independent of the
claim it proves. Repository commands and configuration are the source of truth.

## Minimum evidence

- acceptance criteria map to tests, demonstrations, measurements, or inspection
- relevant build, type, lint, and test commands have actual results
- changed behavior is exercised through a public boundary
- existing checks were not removed, skipped, or weakened to obtain a pass
- untested scope and residual risk are explicit

Add evidence according to the change: browser interaction and screenshots for UI,
migration rehearsal for data changes, performance measurements for performance
claims, and security checks for trust-boundary changes.

The implementer may produce evidence, but the Test verdict uses a fresh review of
the candidate. A failed or incomplete check is a failed gate unless an accountable
person accepts the exception.

Guidance belongs in Skills. Proof belongs in tests and evals. Inviolable constraints
belong in deterministic hooks, CI rules, permissions, sandboxing, and branch
protection.
