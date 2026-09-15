# Changelog

## 0.0.3

### Patch Changes

Fix `addMemory`, `forgetMemory`, `addDocument`, `refreshDocument`, and `deleteDocument` being typed as `ctx: GenericActionCtx<GenericDataModel>`, which only type-checks when the calling app's schema is empty. Any real app with its own tables got a compile error on every one of these calls. Each now accepts a minimal structural ctx type matching what it actually touches (a mutation-only type, or a combined mutation-and-query type for `refreshDocument`). The example app's schema was also given a real table, so this class of bug shows up in this repo's own typecheck from now on instead of only in a downstream app.

## 0.0.2

### Patch Changes

- Add demo screenshot to README

## 0.0.1

- Fix forgetMemory and search containerTag scoping (two real API bugs)
- Add getStats, listRecentMemories, listRecentDocuments queries
- Rebuild example app with History tab, replay, and redesigned UI

## 0.0.0

- Initial release.
