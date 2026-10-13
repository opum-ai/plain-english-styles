// Parse one Mermaid source with Mermaid's own parser, headless.
//
// Mermaid's parser is asynchronous and needs a DOM (its parse path runs
// DOMPurify over the source for some diagram types), while a deterministic
// check in this harness is synchronous. So the parse runs here, in a child
// process: stanza on stdin, exit 0 when it parses and 1 when it does not, the
// reason on stderr. checks.mjs calls this through execFileSync, which keeps
// `scoreDeterministic` synchronous.
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

// Node has its own navigator (a getter-only global), so only the DOM pieces
// Mermaid's parse path reaches for are taken from jsdom.
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.DOMParser = dom.window.DOMParser

const mermaid = (await import('mermaid')).default
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' })

const source = readFileSync(0, 'utf8')
try {
  await mermaid.parse(source)
  process.exit(0)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(message.slice(0, 300))
  process.exit(1)
}
