# Diagrams

Every question ends with one Mermaid diagram, then one line of text saying what
it shows.

## Which diagram for which decision

| The decision is about | Mermaid type | Drawn in the pane |
|---|---|---|
| a branching rule or a process | `flowchart` | yes |
| who does what, across people or systems (the swimlane case) | `flowchart` with one `subgraph` per role | yes |
| messages in order between parties | `sequenceDiagram` | yes |
| a status or lifecycle | `stateDiagram-v2` | yes |
| the parts of a system and how they connect | `flowchart`, or `classDiagram` / `erDiagram` at Advanced | yes |
| an amount compared across options (cost, time) | `xychart-beta` bar chart | yes |
| two options on two axes (cost against quality) | `quadrantChart`, Advanced only | browser view only |
| an order of work or a schedule | `gantt` or `timeline`, Advanced only | browser view only |

The "Drawn in the pane" column is what this plugin's diagram mod draws.
Beginner and Intermediate use only the types it draws, so their diagram always
appears in place. Advanced may use the last two rows when they fit the decision
better; those open in the browser view.

Mermaid has no BPMN diagram. For a business process, use a `flowchart` with one
`subgraph` per lane — the closest equivalent.

## Rules, at every level

- **The diagram is placed last.** The question must read completely without it.
- **One line of text says what the diagram shows**, so it has a text equivalent.
- **Colour is never the only signal.** Mark the recommended option in its label,
  for example `A (Recommended)`.
- **Node labels follow the level's word rules** — see [levels.md](levels.md).
- **The diagram must parse.** The harness checks it with Mermaid's own parser.

## Where a diagram renders

The plugin draws its own diagrams with a mod (`hooks/register.tsx`, backed by
`renderer/render.mjs`). On the terminal it draws Unicode art; on desktop, VS Code
and mobile it draws the SVG; a type it cannot draw, or a diagram too wide for the
pane, keeps its source and offers an **Open diagram** button. GitHub renders
Mermaid natively, so the same source also draws in a pull request body, an issue,
and a Lore document on GitHub.

The question tool's `preview` field is monospace and the mod cannot redraw it.
When the skill asks through that tool, each option's preview carries its
trade-off line, and the diagram goes in the message text above the question,
where the mod draws it.
