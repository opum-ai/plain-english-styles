---
# yaml-language-server: $schema=../../.lore/schemas/runbook.schema.json
type: Runbook
title: Install and switch an output style
tags:
  - howto
  - install
summary: Install the three styles, select one, and confirm it actually loaded rather than silently falling back to Default
generated:
  by: lore/0.2.0
  at: 2026-08-16T13:05:00.000Z
---

# Install and switch an output style

## Purpose

Get one of the three styles running in Claude Code, and prove it is running.

The proving step is not optional caution. A style whose name does not resolve
fails silently — Claude Code runs Default and reports nothing. That failure was
live on the machine these styles were written on and went unnoticed across every
project but one.

## Prerequisites

- Claude Code 2.1.91 or later. The standalone `/output-style` command was removed
  in 2.1.91; selection now happens through `/config` or the `outputStyle`
  setting.
- For a hand-copied install only: write access to `~/.claude/output-styles/`
  for a user-wide install, or `.claude/output-styles/` inside a project for one
  repo.

## Steps

### 1. Install the style files

As a plugin, which ships the files in `output-styles/` and needs no copying:

```
/plugin marketplace add opum-ai/opum-marketplace
/plugin install plain-english-styles@opum
```

Or by hand, from a checkout of this repository:

```bash
cp output-styles/plain-english-*.md ~/.claude/output-styles/
```

Project-scoped instead of user-wide: copy to `.claude/output-styles/` in the repo. Project
styles load from every `.claude/output-styles/` between the working directory and
the repository root; when two define the same name, the one closest to the
working directory wins.

### 2. Select one

Terminal: run `/config` and pick under **Output style**. Claude Code writes the
choice to `.claude/settings.local.json`.

Or set it directly in any settings file:

```json
{ "outputStyle": "Plain English - Advanced" }
```

The value must match the style's **frontmatter `name:`**, not its filename. The
filename is only the fallback when a file has no frontmatter at all. The three
names are `Plain English - Beginner`, `Plain English - Intermediate`, and
`Plain English - Advanced`.

**A plugin install prefixes the plugin name**: the values become
`plain-english-styles:Plain English - Beginner` and so on. The two forms are not
interchangeable. With only the plugin installed, the bare name resolves to
nothing and falls back to Default silently (measured 2026-10-06, PES-2, with a
canary under `--plugin-dir`).

### 3. Start a new session

Output style is part of the system prompt, which Claude Code reads once at
session start. Changes take effect after `/clear` or in the next session — not
mid-conversation, and not when you switch model.

### 4. Confirm it loaded

Configured is not the same as loaded. Ask for something the style visibly shapes,
such as a status update, and check the reply against the contract: outcome first,
the three beats, and inside the level's word cap.

For a decisive check, add a canary line to the style body — an instruction to
open every reply with a distinctive token — start a session, and see whether the
reply obeys. Remove it afterwards. Asking the model to describe its own system
prompt is unreliable.

If the reply looks like stock Claude Code, the name did not resolve. Re-check the
frontmatter `name:` against the `outputStyle` value, character for character,
including the `plain-english-styles:` prefix for a plugin install.

### 5. Switching levels

Repeat steps 2 and 3. Beginner for a quick status check, advanced when reviewing
an architecture change. There is no per-model setting and no reason to want one —
one file serves every model.

## The skill and the diagram mod

The plugin ships two pieces beside the styles. Neither changes an installed style,
and both arrive with a plugin install.

- **`operator-questions`** (`skills/operator-questions/`) — the skill that shapes
  a decision question for the person who decides: A and B with one recommendation,
  a free-text C, the trade-offs on cost, quality and speed, and one Mermaid
  diagram, sized to the active style's level. It then files the question in Quest
  and records the answer, writing a Lore ADR when the decision is architecturally
  significant.
- **The diagram mod** (`hooks/register.tsx`, with `renderer/render.mjs`) — draws
  every closed Mermaid fence in an assistant message in place: Unicode art on the
  terminal, SVG on desktop, VS Code and mobile. A diagram type the bundled
  renderer cannot draw, or one too wide for its row, keeps its source and offers
  an **Open diagram** button that opens a self-contained HTML page in the browser.

**The mod needs `bun` or `node` on `PATH`.** It runs its helper with whichever it
finds first. With neither, a diagram keeps its source and the mod says so; nothing
else about the plugin changes, and the three styles work either way.

## Known limit of the default checks

The harness's `code_block_size` exempts a ` ```mermaid ` fence only when the fence
**opens with a Mermaid diagram type**. The two checks that close the rest of the
gap — `diagram_parses` (Mermaid's own parser accepts the source) and
`diagram_size` (node count within the level's cap) — are **opt-in per case**,
named by the decision cases in `harness/cases/cases.json`.

So in an ordinary reply, a fence whose tag is `mermaid`, whose first line is
`flowchart TD`, and whose body is prose still leaves the word budget untouched by
`code_block_size` and `total_length`. That is a known limit of the **default**
checks, not a claim that the gap is closed everywhere.

## Rollback

Set `outputStyle` to `"Default"`, or remove the key, and start a new session.

To remove the styles entirely, run `/plugin uninstall plain-english-styles@opum`
for a plugin install, or delete the files from `~/.claude/output-styles/` for a
hand-copied one.
Nothing else on the system is touched; a missing style file falls back to Default
rather than erroring.

If a project `CLAUDE.md` restates the style's tone rules, delete those sections
rather than keeping them as a safety net — restating them measured 9.4 points
worse than the style file alone.
