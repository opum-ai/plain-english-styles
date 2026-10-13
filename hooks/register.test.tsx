/**
 * Tests for the diagram mod. The pure functions carry the parsing and the
 * surface decision, so they are tested directly; the render hook is mounted on
 * two surfaces to prove both directions of the design's behaviour:
 *   - a closed fence is drawn by the mod (the engine's own tree is replaced);
 *   - a fence still streaming is left to the engine (the base tree stays).
 *
 * The drawn path (Unicode art / Svg) needs the bundled helper, which runs via
 * `$.process` - absent in the test environment - so the hook tests prove the
 * fallback: the source kept, the line naming what is missing, and the button.
 */
import { describe, expect, test } from 'claude-code/testing'
import { altFor, chooseDrawing, escapeHtml, htmlPage, scanFences, widest } from './register'

const OK = { ok: true as const, kind: 'flowchart', unicode: '┌──┐\n│ab│\n└──┘', svg: '<svg/>' }
const CLOSED = 'Here it is:\n```mermaid\nflowchart TD\n  A --> B\n```\nThat is the plan.'
const STREAMING = 'Here it is:\n```mermaid\nflowchart TD\n  A --> B'

describe('scanFences', () => {
  test('finds one closed mermaid fence and its exact offsets', () => {
    const { fences, hasOpenMermaid } = scanFences(CLOSED)
    expect(hasOpenMermaid).toBe(false)
    expect(fences.length).toBe(1)
    expect(fences[0]?.source).toBe('flowchart TD\n  A --> B')
    expect(CLOSED.slice(fences[0]?.start, fences[0]?.end)).toBe('```mermaid\nflowchart TD\n  A --> B\n```')
  })

  test('a fence still streaming is reported and not drawn', () => {
    const { fences, hasOpenMermaid } = scanFences(STREAMING)
    expect(hasOpenMermaid).toBe(true)
    expect(fences.length).toBe(0)
  })

  test('a non-mermaid fence is skipped whole', () => {
    expect(scanFences('```js\nconst x = 1\n```').fences.length).toBe(0)
  })

  test('two mermaid fences are both found, in order', () => {
    const text = '```mermaid\ngraph TD\n A-->B\n```\ntext\n```mermaid\nstateDiagram-v2\n [*] --> S\n```'
    const { fences } = scanFences(text)
    expect(fences.length).toBe(2)
    expect(fences[0]?.source).toBe('graph TD\n A-->B')
    expect(fences[1]?.source).toBe('stateDiagram-v2\n [*] --> S')
  })
})

describe('widest', () => {
  test('the widest line in characters', () => {
    expect(widest('a\nbbb\ncc')).toBe(3)
    expect(widest('')).toBe(0)
  })
})

describe('chooseDrawing', () => {
  test('terminal draws the art when it fits', () => {
    expect(chooseDrawing(OK, 'terminal', 80)).toBe('art')
  })
  test('terminal falls back when the art is wider than the pane', () => {
    expect(chooseDrawing(OK, 'terminal', 2)).toBe('fallback')
  })
  test('every remote surface draws the svg', () => {
    expect(chooseDrawing(OK, 'desktop', 80)).toBe('svg')
    expect(chooseDrawing(OK, 'vscode', 80)).toBe('svg')
    expect(chooseDrawing(OK, 'mobile', 80)).toBe('svg')
  })
  test('an unsupported type falls back', () => {
    expect(chooseDrawing({ ok: false, reason: 'unsupported-type', kind: 'gantt' }, 'desktop', 80)).toBe('fallback')
  })
  test('no result yet falls back', () => {
    expect(chooseDrawing(undefined, 'terminal', 80)).toBe('fallback')
  })
  test('an svg over the element cap falls back', () => {
    expect(chooseDrawing({ ...OK, svg: 'x'.repeat(131073) }, 'desktop', 80)).toBe('fallback')
  })
})

describe('htmlPage', () => {
  test('is self-contained, strict and network-free', () => {
    const html = htmlPage('graph TD\n A-->B', '/*MERMAID*/', 'A diagram')
    expect(html).toContain("default-src 'none'")
    expect(html).toContain("script-src 'unsafe-inline'")
    expect(html).toContain("securityLevel: 'strict'")
    expect(html).toContain('/*MERMAID*/')
    expect(html).toContain(JSON.stringify('graph TD\n A-->B'))
  })
  test('escapes the title', () => {
    expect(escapeHtml('<a>&"\'')).toBe('&lt;a&gt;&amp;&quot;&#39;')
    expect(htmlPage('x', 'y', '<b>')).toContain('<title>&lt;b&gt;</title>')
  })
  test('altFor names the kind', () => {
    expect(altFor('flowchart')).toBe('Mermaid flowchart diagram')
  })
})

describe('the AssistantMessage render hook', () => {
  const SURFACES = ['terminal', 'desktop'] as const

  test('a closed fence is drawn by the mod: source kept, the missing line, the button', async ($, on) => {
    on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>ENGINE-OWN-TREE</Text>
    })
    for (const surface of SURFACES) {
      const ui = await $.ui.mount({
        plugin: 'plain-english-styles',
        surface,
        component: 'AssistantMessage',
        props: { text: CLOSED, isFirstOfReply: true },
        requestId: 'msg-1',
        viewport: { columns: 80, rows: 24 },
      })
      expect(await ui.find({ type: 'Code', text: /flowchart TD/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /bun or node/ })).toBeDefined()
      expect(await ui.find({ type: 'Button', text: /Open diagram/ })).toBeDefined()
      // The mod replaced the engine's tree, so the marker is gone.
      expect(await ui.find({ type: 'Text', text: /ENGINE-OWN-TREE/ })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('a still-streaming fence is left to the engine', async ($, on) => {
    on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>ENGINE-OWN-TREE</Text>
    })
    for (const surface of SURFACES) {
      const ui = await $.ui.mount({
        plugin: 'plain-english-styles',
        surface,
        component: 'AssistantMessage',
        props: { text: STREAMING, isFirstOfReply: true },
        requestId: 'msg-2',
        viewport: { columns: 80, rows: 24 },
      })
      // The mod drew nothing of its own; the engine's tree stands.
      expect(await ui.find({ type: 'Text', text: /ENGINE-OWN-TREE/ })).toBeDefined()
      expect(await ui.find({ type: 'Button', text: /Open diagram/ })).toBeUndefined()
      await ui.unmount()
    }
  })
})
