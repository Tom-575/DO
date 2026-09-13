# Issue and PR Provider Interface

Issue and PR references are optional. The lifecycle must work with local Git
records alone and must not assume GitHub, GitLab, Linear, or another provider.

Providers expose three reference kinds: `issue`, `pr`, and `source_ref`.
Non-local providers use absolute HTTP(S) URLs. A provider adapter may later add
existence checks or metadata lookup, but lifecycle records retain the original
reference and do not copy the external record.
