---
name: lore
description: "Author, retrieve, and maintain OKF documentation with the lore CLI, including explicit multi-repository workspaces. Use whenever reading, writing, linking, moving, querying, or checking docs, so Story/Task coupling, managed blocks, provenance, and cross-links stay coherent. Run `lore instructions` for the canonical agent loop and `lore instructions <topic>` for just-in-time detail."
---

# lore — OKF documentation CLI

`lore` is this repo's documentation engine: a deterministic, CLI-first tool (no LLM dependency)
for authoring, retrieving, and maintaining the OKF bundle under `docs/`. This skill is a thin pointer —
**`lore instructions` is the source of truth for how to drive lore.**

## When to use it

Reach for `lore` — not a plain editor or `grep` — whenever you read, write, link, move, retrieve,
or verify docs in a lore-managed bundle or an explicitly selected workspace, so Story <-> Task
coupling, managed blocks, provenance, and cross-links stay coherent.

`lore link`, `lore unlink`, `lore rename`, and `lore sync` commit tracker files only when the
configured tracker is Backlog; Quest and Jira keep their own storage. Check the repository's own
instructions (its CLAUDE.md or AGENTS.md) for any commit-authority rule before running them.

## Find and read docs: query, then read

To answer a question from the docs, search before you browse — do not start from
`docs/index.md` or `grep`:

1. `lore query "<a few words from the question>" --limit 5` — full-text search over every concept.
2. `lore read <id>` — the best hit exactly as authored, with no budget.
3. `lore context <id> --max-tokens <n>` — only when you need the neighbors too. `--max-tokens` is a
   hard ceiling: if the concept's own body does not fit, the body is dropped rather than exceeding
   the budget, so use `lore read` for the body.

`lore instructions retrieval` has the detail.

## Start here

Run `lore instructions` for the canonical agent loop and the topic index, then pull just-in-time
detail with `lore instructions <topic>`:

- `retrieval`   Find and read docs in one repository (`lore query` -> `lore read`)
- `linking`     Story <-> Task coupling (`lore link` / `lore unlink`)
- `sync`        Reconciling status and managed blocks (`lore sync`)
- `check`       The CI gate: types, drift, links, anchors, portability (`lore check`)
- `validation`  Per-file OKF/schema conformance (`lore validate`)
- `types`       Discovering the active type vocabulary (`lore types`, LCLI-537)
- `workspace`   Multi-repository projection and bounded retrieval (`--workspace`)
- `agents`      Which agent bridge lore agents checks or writes (`lore agents`, LCLI-437)

## Commands

- `backlog`       Adopt Backlog knowledge records through a digest-guarded migration lifecycle
- `init`          Scaffold an OKF bundle; a bare TTY run also wizards the agent bridge/scaffolds/tracker setup
- `new`           Scaffold a typed concept from a template (rejects an unknown type under strict_types)
- `validate`      Check concept files against OKF + the lore profile (per-file); strict_types escalates an unknown type
- `check`         Validate links/anchors + reconciliation/committed-schema drift across the bundle (CI gate); strict_types escalates an unknown type
- `replace`       Find-and-replace across the bundle, skipping managed regions
- `rename`        Move a concept and repoint every inbound link + ref
- `supersede`     Mark a concept superseded by another, wiring both ways
- `link`          Add task ids to a concept's tasks: + the doc: back-ref
- `unlink`        Remove task ids from a concept's tasks: + the doc: back-ref
- `sync`          Reconcile status + managed task blocks, regen index/log; commits tracker files on the Backlog backend only
- `tasks`         Show the live status rollup for a concept's linked tasks
- `orphans`       Report tasks with no owning doc + docs whose linked task vanished
- `schema`        Export the profile's editor JSON Schemas to .lore/schemas/ (the fix for `lore check`'s schema-drift)
- `types`         Print the active profile's declared type vocabulary — fields, requiredness, sections
- `scaffold`      Generate a downstream docs consumer's config additively, rewriting nothing
- `graph`         Emit the bundle's cross-link graph as json or dot
- `path`          Find bounded paths across exact authored concept and task edges
- `impact`        Expand bounded impact across exact authored concept and task edges
- `snapshot`      Explicitly retain, list, or delete bounded projection snapshots
- `changed`       Compare two retained snapshots with bounded authored-fact deltas
- `provenance`    Trace one retained concept, task, or edge to exact source evidence
- `explorer`      Build a deterministic self-contained local graph explorer
- `export`        Emit a deterministic, consumer-neutral OKF projection as JSONL
- `query`         Full-text search the bundle with frontmatter filters
- `context`       Assemble a concept + neighbor summaries within a token budget
- `read`          Read one concept exactly as authored, with no budget and no assembly
- `agent`         List context profiles or compile bounded task-scoped evidence
- `instructions`  Print task-scoped agent guidance on demand
- `agents`        Regenerate the agent bridges (SKILL.md + the CLAUDE.md/AGENTS.md nudge)
- `help`          Show help, or the machine-readable command manifest under --json

## Machine contract

Every command supports `--json` (the `{schemaVersion, kind, data}` envelope) and `--plain`
(ANSI-free, auto-selected off a TTY). Branch on the semantic exit code, never on prose:
`0` ok · `2` usage · `3` not_found · `4` denied · `5` conflict · `6` validation/drift · `7` indeterminate (cannot judge from here; never auto-repair).

## Read the evidence, not the status label

A document's `status: stable`, a `verified` attribution, or a Done task record what
happened to the record — not whether what it asserts is still true. `status` names a
lifecycle stage; an attribution names who touched it. Neither substitutes for checking
the claim's own evidence before relying on it.

## Optional task-scoped context

When native Claude Code instructions name a committed Lore profile, use this stable opt-in line:

> Lore profile: `<name>`. Before working, run `lore agent context <name> --task "<assigned task>"`
> and ground decisions in the returned source IDs.

A profile pack selects only among the sources its profile lists, so a question outside the profile
still needs `lore query`. Lore supplies evidence only. It does not create or patch native agents,
prompts, tools, models, permissions, or execution settings.

<!-- Generated by `lore agents`; do not hand-edit. Re-run `lore agents --force` to refresh. -->
