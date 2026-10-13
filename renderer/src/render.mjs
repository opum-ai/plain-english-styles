// renderer/src/render.mjs -> bundled into renderer/render.mjs by build.mjs.
//
// The diagram helper for the plain-english-styles Mermaid mod. One job: take a
// Mermaid source, hand back the Unicode art (for the terminal) and the SVG (for
// the remote surfaces) as one JSON object on stdout.
//
//   stdin   the Mermaid source (or argv[2], used by tests)
//   stdout  {"ok":true,"kind":"flowchart","unicode":"...","svg":"<svg .../>"}
//        or {"ok":false,"reason":"unsupported-type"|"render-error"|"too-large","kind":"..."}
//
// It never runs the source: beautiful-mermaid parses it into a graph and draws
// that. A source it cannot draw is a reported failure, never a partial drawing.
import { readFileSync } from 'node:fs'
import {
  renderMermaidASCII,
  renderMermaidSVG,
} from 'beautiful-mermaid'

// The design's limit: a fence longer than this is left as source.
const MAX_SOURCE = 20000

// beautiful-mermaid's SVG embeds a remote Google Fonts `@import`. The design
// refuses any drawing that leaves the machine, so the import is stripped: the
// diagram keeps its geometry and falls back to a local font.
const REMOTE_IMPORT = /@import\s+url\((['"])https?:\/\/[^'"]*\1\)\s*;?/g

// The types beautiful-mermaid draws in the pane. quadrantChart, gantt and
// timeline are deliberately absent - the design sends those to the browser
// view, which uses the vendored mermaid.js, not this helper.
const SUPPORTED = new Set([
  'flowchart',
  'state',
  'sequence',
  'class',
  'er',
  'xychart',
])

/** The diagram type, from the fence's first word. */
export function kindOf (source) {
  const first = String(source).trimStart().split('\n', 1)[0].trim()
  if (/^(graph|flowchart)\b/.test(first)) return 'flowchart'
  if (/^stateDiagram/.test(first)) return 'state'
  if (/^sequenceDiagram/.test(first)) return 'sequence'
  if (/^classDiagram/.test(first)) return 'class'
  if (/^erDiagram/.test(first)) return 'er'
  if (/^xychart/.test(first)) return 'xychart'
  if (/^quadrantChart/.test(first)) return 'quadrant'
  if (/^gantt/.test(first)) return 'gantt'
  if (/^timeline/.test(first)) return 'timeline'
  return 'unknown'
}

/** Render one source. Returns the JSON-able result object; never throws. */
export function render (source) {
  const text = String(source ?? '')
  const kind = kindOf(text)

  if (text.length > MAX_SOURCE) {
    return { ok: false, reason: 'too-large', kind, length: text.length }
  }
  if (!SUPPORTED.has(kind)) {
    return { ok: false, reason: 'unsupported-type', kind }
  }

  try {
    // colorMode 'none' keeps the art plain text; the surface paints it.
    const unicode = renderMermaidASCII(text, { colorMode: 'none' })
    // Strip any remote @import so the drawn SVG fetches nothing.
    const svg = renderMermaidSVG(text, { transparent: true }).replace(REMOTE_IMPORT, '')
    return { ok: true, kind, unicode, svg }
  } catch (error) {
    return {
      ok: false,
      reason: 'render-error',
      kind,
      message: String(error && error.message ? error.message : error),
    }
  }
}

function readInput (argv) {
  if (argv[2] !== undefined) return argv[2]
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

// Only write when run as the helper, not when imported by a test.
if (import.meta.url === `file://${process.argv[1]}` || process.env.PES10_STDIN === '1') {
  process.stdout.write(JSON.stringify(render(readInput(process.argv))))
}
