# Notices for the diagram renderer

`render.mjs` and `vendor/mermaid.min.js` ship inside the `plain-english-styles`
plugin. This file records exactly what is in them, the licence of each part, and
where its source can be obtained.

## What is in `render.mjs`

`render.mjs` is one bundled file, built by `build.mjs` from `src/render.mjs`.
It contains the following third-party code, inlined into the one file (there is
no separate module per dependency):

| Package | Version | Licence | Source |
|---|---|---|---|
| [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | 1.1.3 | MIT | the upstream repository, or the npm package |
| [elkjs](https://github.com/kieler/elkjs) (`elkjs/lib/elk.bundled.js`) | 0.11.1 | EPL-2.0 | the upstream repository, or the npm package |
| [entities](https://github.com/fb55/entities) | 7.0.1 | BSD-2-Clause | the upstream repository, or the npm package |

`elkjs` is used by `beautiful-mermaid` to lay out the diagram and is inlined into
the bundle, not kept as a separate module. The full licence text of each is under
`./licenses/`: `beautiful-mermaid.LICENSE`, `elkjs.LICENSE.md`,
`entities.LICENSE`.

### EPL-2.0 (elkjs)

`elkjs` is under the Eclipse Public License 2.0, a file-level weak-copyleft
licence. Its obligations attach to the EPL-2.0 code, not to the plugin as a
whole: the plugin's own code stays MIT. Distributing the bundle obliges us to
include the EPL-2.0 text and the copyright notices (done, under `./licenses/`)
and to say how the source of the EPL-2.0 code can be obtained (the `elkjs`
repository or npm package, above). No EPL-2.0 file has been modified.

Whether EPL-2.0 code may ship inside this MIT-declared plugin is a decision for
the operator and `opum-doc` (opum-doc `docs/reference/operator-questions-skill-design.md`,
"Licences"); this file only records what ships.

## `vendor/mermaid.min.js`

The browser view's self-contained fallback, the upstream `mermaid` package's own
`dist/mermaid.min.js` (version 11.17.2, MIT, copyright Knut Sveidqvist). Its
licence text is `./licenses/mermaid.LICENSE`. It is unmodified.

## Rebuilding

From a checkout with the inputs installed:

    cd renderer && npm install && npm run build

`vendor/mermaid.min.js` is copied from `node_modules/mermaid/dist/mermaid.min.js`
and is not produced by `build.mjs`.
