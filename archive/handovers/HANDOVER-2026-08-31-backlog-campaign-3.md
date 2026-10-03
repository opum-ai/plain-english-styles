# Handover — take COS-31, give intermediate and advanced a reply-shape router (COS-31)

**Date**: 2026-08-31 | **Grounded against**: `dev`/`main` @ `ff2d775`, clean, both remotes level | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/plain-english-styles. Tracker:
doc-1. Cursor: COS-31 — Campaign 2 item 24, status To Do, depends on COS-18
(already resolved). Queue order confirmed by the user on 2026-08-17; do not
re-ask before taking it. This is a bigger task than COS-29/COS-30: two style
files each need a router authored and measured on its own (n>=146/model,
shared five) plus reserve-split validation for each file whose text changes.
Read the task's own Description and all 6 ACs before authoring anything —
especially the two traps it names.
```

## State

| Item | Status |
| --- | --- |
| COS-30 | **Resolved this session (39).** `pairedInterval` now throws when either side's rows span more than one styleId, naming the styles and telling the caller to filter — the COS-18 within-side pooling bug. Verified against COS-18's real saved rows: unfiltered now throws, filtered reproduces the published figures exactly. `/code-review high` found two more reachable gaps in the same failure class outside COS-30's ACs — opened as **COS-35** rather than expanding scope. See tracker Queue row 23 and the session-39 log entry. |
| Cursor | **COS-31**, Campaign 2 item 24. Status `To Do`. Dependency COS-18 is already Resolved. |
| `dev` / `main` | Both `ff2d775`, pushed, level. **No promotion needed at next preflight.** |
| Branches / PRs | No `feature/*` branches, no open PRs (verify with `gh pr list` regardless). |
| Gates as of `ff2d775` | 235/235 harness tests (**`FORCE_COLOR=0` required on this host** — see trap below), `audit` exit 0, `lore check` 24 files 0 errors/warnings. |
| Queue after COS-31 | 25 COS-32, 26 COS-33, 27 COS-34, 28 COS-35 (opened this session, appended at the end) |

## Next steps

1. Preflight: `dev`/`main` already level at `ff2d775` — verify with `git fetch` rather than assuming.
2. `backlog task view COS-31 --plain` and read the whole thing, including both traps in the Description. Branch `feature/COS-31` off `dev`.
3. **Author two routers, one per file** (`plain-english-intermediate.md`, `plain-english-advanced.md`), each stating which of the four shapes (status update, long-session report, decision, tie-break) a reply should take — mirroring beginner's `## Pick the shape from the question` (`plain-english-beginner.md:27-36`, now fixed by COS-29 — copy its *current* placement, precedence sentence directly under the bullets, not the pre-fix version. AC #6 depends on this).
4. **Advanced also needs `plain-english-advanced.md:34` ('Beat 3 always appears') resolved** — either scope it to status updates or deliberately leave it unconditional with the reason recorded (AC #3). Read the line in context before deciding.
5. **Measure each router on its own** (AC #1) — not bundled with the Beat-3 edit or with each other. COS-16's own lesson: every regression it measured came from an edit that *added* a rule, and a multi-edit bundle showed a regression none of its parts showed alone. If both a router and the Beat-3 fix land on advanced in the same session, that is two edits — measure them as separate arms per COS-29's own bundling note, not one bundle.
6. n >= 146 non-errored cells per model on the five shared cases, per style. **Probe 2 cells before committing any arm.**
7. **Re-count the D3 violation share post-change with COS-18's same classifier** (AC #2) — the before figures are already in the task: intermediate 16.2%/11.8% (sonnet/opus), advanced 10.1%/8.3%.
8. **No paired interval on rules, judge, composite or words may be negative and clear of zero, for either style** (AC #4) — this is a stricter bar than COS-29's "no significant regression": a *negative and significant* result specifically fails it, so run `interval` on every metric before concluding.
9. **Validate on the reserve split for each style whose text changes** (AC #5) — both intermediate and advanced have reserve cases from COS-21's work; find their case IDs before arming.
10. This is a multi-arm task (two files × shared-five × reserve, minimum). Budget accordingly — do not rush AC #1's coverage floor to fit a single sitting if the throughput doesn't support it; COS-19's precedent (partial coverage, recorded honestly, moved the gap to a follow-up task with user approval) is available if a usage ceiling is hit.

## Critical context / traps

- **`FORCE_COLOR=0` is required for `npm --prefix harness test` on this host.** This shell exports `FORCE_COLOR=3`; `harness/test/fixture.test.mjs`'s `cleanEnv()` doesn't strip it, so Node's spec reporter wraps summary lines in ANSI codes the fixture's `^ℹ` regex can't parse, and some tests report false failures. Not fixed — out of scope for content tasks. Always run tests as `FORCE_COLOR=0 npm --prefix harness test`.
- **`lore` was not on PATH this session either.** Use `/Volumes/_repos/lore-cli/dist/lore` directly, and run it **from the repo root** — running it from inside `harness/` fails with `path "docs" does not exist` even though the binary itself is fine.
- **`backlog task edit --description` REPLACES the whole description** — no append flag. To edit one paragraph, read the full description via `--plain`, reconstruct it verbatim except the target paragraph, and pass the whole thing back. Verify with a second `--plain` read after.
- **Do not round-trip the tracker through `backlog doc view doc-1 --plain`** — it silently truncates. Read/edit `backlog/docs/doc-1 - Backlog-campaign-tracker.md` on disk directly, then push with `backlog doc update doc-1 --content "$(cat file)"`. Check line count before and after every update.
- **This tracker doc is ~1950 lines with very long single-line table cells** — the `Read` tool can fail with a token-limit error even on a small `limit` because of line length, not line count. Use `sed -n 'START,ENDp'` via Bash instead when inspecting a region, and `grep -n` to locate section headers first. Editing the file via `sed`/Bash rather than the `Read` tool can trigger a harmless "changed on disk since you last read it" warning from the Edit tool — verify with `git diff --stat` before assuming a real concurrent session; it's been a false alarm twice now.
- **Cost is not a constraint in this project** — it runs on a Claude subscription. Arms are sized by statistical power alone.
- **Always probe 2 cells before committing any arm.**
- **AC #4's bar is stricter than a plain "no regression" check**: it fails only on a paired interval that is both negative *and* clear of zero (i.e., a real, measured harm) — not on any raw single-arm mean landing below a baseline figure. Don't confuse this with COS-29's situation (a stated bar the raw mean must clear); read AC #4's wording literally before treating any dip as a failure.
- **A `/code-review high` pass on even a small change finds real, fixable issues.** Both COS-29 and COS-30's reviews each found two genuine gaps. On a task this size, budget real time for a full review-and-fix loop, and use the campaign's established pattern for out-of-scope findings: open a new task (COS-35 is the freshest example) rather than silently widening the branch.
- **Do not check an acceptance criterion whose literal wording the evidence doesn't satisfy without documenting the substitution explicitly** in the task notes — this has come up twice now (COS-29's AC #3, COS-30's AC #3) and both times the fix was full transparency, not silence.
- **This project's repeated finding on hard style-judge tasks stands, and applies directly here**: additions to a style file test null or negative far more often than they help. A router is exactly the kind of addition COS-16 warned adds a rule — measure each one in complete isolation, and be prepared for a null or negative result on the first attempt.

## Do not repeat

- **Do not trust `npm --prefix harness test`'s raw output on this host without `FORCE_COLOR=0`.**
- **Do not assume `lore` is on PATH**, and run it from the repo root, not from `harness/`.
- **Do not use `backlog task edit --description` to append** — it replaces the whole field. Read, reconstruct, verify.
- **Do not bundle a router edit with the Beat-3 scoping edit (or with the other style's router) into one measured arm** — COS-16's four-edit bundle hid a real regression that no single edit showed; this task's own trap warns of the same class of mistake.
- **Do not silently expand this task's scope if review finds something outside its ACs** — open a new task, as COS-30's session just did for COS-35.
