<!-- lore:agents:begin -->
This repo uses **lore** — an OKF-native documentation CLI — for the docs bundle under `docs/`.
Drive docs work through `lore` (not a plain editor or `grep`) so Story <-> Task coupling, managed
blocks, and cross-links stay coherent.

- **Find and read docs:** `lore query "<words>" --limit 5`, then `lore read <id>` for the best hit.
- **Skill:** `.claude/skills/lore/SKILL.md` — how to drive lore.
- **Just-in-time detail:** run `lore instructions` for the canonical agent loop, then
  `lore instructions <topic>` (`retrieval`, `linking`, `sync`, `check`, `validation`, `types`, `workspace`, `agents`).
<!-- lore:agents:end -->

<!-- quest:agent-instructions:begin -->
# Quest agent instructions

This project uses Quest CLI 0.12.0 for tracker operations. Run `quest manifest --json` to discover the supported command contract.

Read the matching guide before tracker work: `quest instructions overview` for the command set and machine contract, `quest instructions task-creation` before creating or splitting tasks, `quest instructions task-execution` before claiming, planning, or recording progress, `quest instructions task-finalization` before checking acceptance criteria or closing a task, and `quest instructions workspace` for initialization, managed instructions, and Backlog.md migration. `quest instructions --list` lists every guide. Search for an existing record with `quest search "<query>" --json` before creating one, and run `quest help <command>` for a command's options and examples.

Quest writes require an explicit actor declaration: `--actor <id> --actor-kind human` for a person, or `--actor <id> --actor-kind delegated-agent --accountable-human <id>` for an agent acting on a person's behalf. Do not edit Quest-authored records directly. CI should run `quest agents --check --require-installed --target claude`: current instructions, and a version-only difference (only the pinned Quest CLI version number is stale) both exit 0; missing, drifted, or malformed managed instructions exit 6. Quest does not retry write conflicts automatically; callers should read the latest task state and perform their own bounded retry when a command returns conflict/exit 5.
<!-- quest:agent-instructions:end -->
