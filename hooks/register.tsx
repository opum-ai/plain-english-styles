/**
 * The diagram mod: draw every closed Mermaid fence in an assistant message in
 * place, per the design in opum-doc docs/reference/operator-questions-skill-design.md
 * ("Rendering the diagrams").
 *
 * A `ui.render` hook on the `AssistantMessage` site gets the block's markdown as
 * `e.props.text`. Closed ```mermaid fences in it are replaced by their drawing:
 * Unicode art on the terminal, `Svg` on desktop, VS Code and mobile. A type the
 * bundled renderer does not draw, a source too large, or art too wide for the
 * pane keeps its source and gains an "Open diagram" button that writes a
 * self-contained HTML page (with the vendored mermaid.js) and opens it.
 *
 * The render pass never waits on the helper: the first draw shows the source,
 * the helper runs off the render path, and its result is cached by the SHA-256
 * of (source, surface, width); the cache write calls `$.ui.invalidate`, which
 * redraws. A source the helper cannot draw is cached as a failure and drawn as
 * source + button, so a failing diagram is never re-run in a loop.
 *
 * The helper is one bundled file, `renderer/render.mjs`, committed so a git
 * install needs no `npm install`. It runs under whichever of `bun` or `node` is
 * on PATH; with neither, the mod keeps the source and says so.
 *
 * Every function that takes `$` is a top-level declaration: the plugin
 * validator accepts `$` only as an argument to one.
 */
import type { EngineInterface, Register, RenderNode } from 'claude-code'

const MAX_SOURCE = 20000 // a longer fence is left as source (the design's limit)
const MAX_SVG = 131072 // the `Svg` element's own cap
const MAX_DIAGRAMS = 8 // at most this many drawn per message
const HELPER_TIMEOUT_MS = 5000
const CACHE_LIMIT = 512

type Rendered =
  | { ok: true; kind: string; unicode: string; svg: string }
  | { ok: false; reason: string; kind?: string; message?: string }

type Fence = { start: number; end: number; source: string }

// Module-level, so it survives every redraw in a session (a reload starts it
// over, which only costs a re-render). Bounded so a long session cannot grow it
// without limit.
const cache = new Map<string, Rendered>()
const inflight = new Set<string>()
let runtimeChoice: string | null | undefined
let mermaidJsCache: string | undefined

/** The SHA-256 of a string, lowercase hex. */
async function sha256 (text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Remember one result, evicting the oldest when the cache is full. */
function remember (key: string, value: Rendered): void {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, value)
}

/**
 * The closed ```mermaid fences in a block of markdown, with their character
 * offsets. Any other fence is skipped whole. `hasOpenMermaid` is true when a
 * ```mermaid fence has no closing fence yet - a block still streaming - which
 * the caller treats by leaving the whole message to the engine's own renderer.
 */
export function scanFences (text: string): { fences: Fence[]; hasOpenMermaid: boolean } {
  const lines = text.split('\n')
  const offsets: number[] = []
  let running = 0
  for (const line of lines) {
    offsets.push(running)
    running += line.length + 1
  }
  const isClose = (line: string): boolean => /^[ \t]*```[ \t]*$/.test(line)

  const fences: Fence[] = []
  let hasOpenMermaid = false
  for (let i = 0; i < lines.length; i++) {
    const open = /^[ \t]*```[ \t]*([^\s`]*)/.exec(lines[i] as string)
    if (!open) continue
    const info = (open[1] ?? '').toLowerCase()
    let j = i + 1
    while (j < lines.length && !isClose(lines[j] as string)) j++
    if (j >= lines.length) {
      if (info === 'mermaid') hasOpenMermaid = true
      break
    }
    if (info === 'mermaid') {
      fences.push({
        start: offsets[i] as number,
        end: (offsets[j] as number) + (lines[j] as string).length,
        source: lines.slice(i + 1, j).join('\n'),
      })
    }
    i = j
  }
  return { fences, hasOpenMermaid }
}

/** The widest line of a string, in characters. */
export function widest (text: string): number {
  let max = 0
  for (const line of text.split('\n')) max = Math.max(max, [...line].length)
  return max
}

/** The one-line text equivalent, for `Svg`'s alt. */
export function altFor (kind: string): string {
  return `Mermaid ${kind} diagram`
}

/**
 * The cells a terminal transcript row takes away from `viewport.columns`: the
 * row's own left indent and right gutter. Art that fills `viewport.columns`
 * wraps inside the row, so the check is against the drawable width, not the
 * viewport's.
 *
 * The engine exposes no constant for this, so it is the value the design's
 * ruling assumes - a diagram one cell under the viewport draws. If the engine's
 * real inset is larger, this one number is what to change.
 */
export const MESSAGE_INSET = 1

/** The columns a diagram may take inside a transcript row of `viewportColumns`. */
export function artColumns (viewportColumns: number): number {
  return Math.max(1, viewportColumns - MESSAGE_INSET)
}

/** How one rendered diagram is drawn on a surface. */
export type Drawing = 'art' | 'svg' | 'fallback'

/**
 * Which of the three drawings a surface gets for one rendered diagram:
 * Unicode art on the terminal when it fits, `Svg` on every other surface when
 * it is within the element's cap, and the source-plus-button fallback in every
 * other case (no result, a failure, art wider than the pane, an SVG too large).
 */
export function chooseDrawing (result: Rendered | undefined, surface: string, width: number): Drawing {
  if (result === undefined || !result.ok) return 'fallback'
  if (surface === 'terminal') return width === 0 || widest(result.unicode) <= width ? 'art' : 'fallback'
  return result.svg.length <= MAX_SVG ? 'svg' : 'fallback'
}

/** Escape the five characters that matter inside the HTML page. */
export function escapeHtml (text: string): string {
  const table: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return text.replace(/[&<>"']/g, c => table[c] ?? c)
}

/** A self-contained HTML page that draws one Mermaid source with the vendored mermaid.js. */
export function htmlPage (source: string, mermaidJs: string, title: string): string {
  const csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:"
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>body{margin:0;padding:24px;background:#fff;color:#18181b;font:14px system-ui,sans-serif}#d{display:flex;justify-content:center}</style>
</head><body><div id="d"></div>
<script>${mermaidJs}</script>
<script>
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
  mermaid.render('d0', ${JSON.stringify(source)}).then(function (r) { document.getElementById('d').innerHTML = r.svg; })
    .catch(function (e) { document.getElementById('d').textContent = 'Could not draw this diagram: ' + e.message; });
</script>
</body></html>
`
}

/** The runtime to run the helper with: `bun`, then `node`, else null. */
async function chooseRuntime ($: EngineInterface): Promise<string | null> {
  if (runtimeChoice !== undefined) return runtimeChoice
  for (const runtime of ['bun', 'node']) {
    try {
      const { exitCode } = await $.process.run([runtime, '--version'], { timeoutMs: 2000 })
      if (exitCode === 0) { runtimeChoice = runtime; return runtime }
    } catch { /* not on PATH */ }
  }
  runtimeChoice = null
  return null
}

/** Run the bundled helper on one source. Never throws. */
async function renderSource ($: EngineInterface, runtime: string, root: string, source: string): Promise<Rendered> {
  try {
    const { exitCode, stdout } = await $.process.run(
      [runtime, `${root}/renderer/render.mjs`],
      { stdin: source, timeoutMs: HELPER_TIMEOUT_MS },
    )
    if (exitCode !== 0) return { ok: false, reason: 'helper-exit', message: `exit ${exitCode}` }
    return JSON.parse(stdout) as Rendered
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, reason: 'helper-error', message }
  }
}

/** Write the self-contained HTML page and open it in the browser. */
async function openInBrowser ($: EngineInterface, root: string, source: string): Promise<void> {
  const key = await sha256(source)
  const path = `${root}/.cache/diagrams/${key}.html`
  let js = mermaidJsCache
  if (js === undefined) {
    js = await $.fs.read(`${root}/renderer/vendor/mermaid.min.js`)
    mermaidJsCache = js
  }
  await $.fs.write(path, htmlPage(source, js, 'Mermaid diagram'))
  await $.process.run(['open', path], { timeoutMs: HELPER_TIMEOUT_MS })
}

export const register: Register = (on, options) => {
  void options

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const text = e.props.text
    if (typeof text !== 'string' || !text.includes('```mermaid')) return next(e)

    const { fences, hasOpenMermaid } = scanFences(text)
    // A fence still streaming, or nothing to draw: leave the block to the engine.
    if (hasOpenMermaid || fences.length === 0) return next(e)

    const root = $.plugin.root
    const surface = e.surface
    const width = e.viewport?.columns ?? 0
    const shown = fences.slice(0, MAX_DIAGRAMS)

    const keys = await Promise.all(shown.map(fence => sha256(`${fence.source}\n${surface}\n${width}`)))

    const missing = shown.filter((_, i) => !cache.has(keys[i] as string))
    if (missing.length > 0) {
      const runtime = await chooseRuntime($)
      if (runtime !== null) {
        // Draw the source this pass, render off the render path, redraw when done.
        shown.forEach((fence, i) => {
          const key = keys[i] as string
          if (cache.has(key) || inflight.has(key) || fence.source.length > MAX_SOURCE) return
          inflight.add(key)
          void renderSource($, runtime, root, fence.source)
            .then(result => { remember(key, result) })
            .catch(() => { remember(key, { ok: false, reason: 'helper-error' }) })
            .finally(() => { inflight.delete(key); $.ui.invalidate('ui.render') })
        })
        return next(e)
      }
      // No runtime: fall through. Every diagram draws as source + the line naming
      // what is missing, which is the design's no-helper behaviour.
    }

    const elements = $.ui.resolve(e)
    const SvgEl = 'Svg' in elements ? elements.Svg : undefined
    const { Box, Text, Code, Button, Markdown } = elements
    const isTerminal = e.surface === 'terminal'
    const nodes: RenderNode[] = []
    let cursor = 0

    shown.forEach((fence, i) => {
      if (fence.start > cursor) nodes.push(<Markdown key={`t${i}`} text={text.slice(cursor, fence.start)} />)
      const key = keys[i] as string
      const result = cache.get(key)

      const why = fence.source.length > MAX_SOURCE
        ? 'This diagram is too large; open it in the browser.'
        : result !== undefined && result.ok === false && result.reason === 'unsupported-type'
          ? 'This diagram type needs the browser view.'
          : runtimeChoice === null
            ? 'Mermaid diagrams need bun or node on PATH.'
            : isTerminal
              ? 'This diagram is wider than the pane; open it in the browser.'
              : 'This diagram is too large; open it in the browser.'

      const decision = chooseDrawing(result, surface, artColumns(width))
      const node = ((): RenderNode => {
        if (result !== undefined && result.ok) {
          if (decision === 'art') {
            return <Text key={`d${i}`}>{result.unicode}</Text>
          }
          if (decision === 'svg' && SvgEl !== undefined) {
            return <SvgEl key={`d${i}`} source={result.svg} alt={altFor(result.kind)} />
          }
        }
        return (
          <Box key={`d${i}`} flexDirection="column">
            <Code source={fence.source} language="mermaid" />
            <Text dimColor>{why}</Text>
            <Button label="Open diagram" onPress={() => openInBrowser($, root, fence.source)} />
          </Box>
        )
      })()
      nodes.push(node)
      cursor = fence.end
    })
    if (cursor < text.length) nodes.push(<Markdown key="tail" text={text.slice(cursor)} />)
    return <Box flexDirection="column">{nodes}</Box>
  })
}
