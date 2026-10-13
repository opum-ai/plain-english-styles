# Third-party notices

This plugin ships the third-party code listed here, and the plugin's own code
ships under MIT. Each entry names the version, its licence, and where its
source can be obtained. The licence texts themselves are beside this file.

| Component | Version | Licence | Source |
|---|---|---|---|
| beautiful-mermaid | 1.1.3 | MIT | https://github.com/lukilabs/beautiful-mermaid · `beautiful-mermaid@1.1.3` |
| elkjs | 0.11.1 | EPL-2.0 | https://github.com/kieler/elkjs · `elkjs@0.11.1` |
| entities | 7.0.1 | BSD-2-Clause | https://github.com/fb55/entities · `entities@7.0.1` |
| mermaid | 11.17.2 | MIT | https://github.com/mermaid-js/mermaid · `mermaid@11.17.2` |

## What ships where

- **`../render.mjs`** — one bundle built by `../build.mjs` from
  `../src/render.mjs`. It contains beautiful-mermaid (MIT) and entities
  (BSD-2-Clause). Its only imports are `node:fs` and `./vendor/elk.bundled.js`;
  it does **not** contain elkjs.
- **`../vendor/elk.bundled.js`** — elkjs 0.11.1, **unmodified**. Its sha256 is
  `20dd2114d683ce758b3ce19bcc56e28a504a617b0d280f760407c37314631d0e`, byte-identical
  to the published `elkjs@0.11.1` `lib/elk.bundled.js`. It is its own file,
  imported by `render.mjs` by a relative path, never concatenated into it.
- **`../vendor/mermaid.min.js`** — the upstream `mermaid@11.17.2`
  `dist/mermaid.min.js` browser build, **unmodified**.

## EPL-2.0 (elkjs)

elkjs is under the Eclipse Public License 2.0, a file-level weak-copyleft
licence. Its obligations attach to the elkjs file, not to the plugin as a whole:
the plugin's own code stays under MIT. Shipping it obliges us to include the
EPL-2.0 text (`elkjs.LICENSE.md`) and its copyright notices, to say how its
source can be obtained (the links above), and to record that we have not modified
it (true: byte-identical, sha256 above). **elkjs is never modified here.** If it
ever needs a change, that decision goes back to `opum-doc` (DEC-169).

## Source availability

Each component's source is the release its version names, at the repository or
npm package above — not a modified copy.
