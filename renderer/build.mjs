/**
 * Rebuilds ./render.mjs by bundling src/render.mjs and everything it imports
 * (beautiful-mermaid and its dependencies elkjs, entities) into one file, so a
 * git install of the plugin needs no `npm install`.
 *
 * The committed render.mjs is the output. Running this is only needed to change
 * it, from a checkout that has the inputs installed:
 *
 *     npm install && npm run build
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))
const banner = [
  '// Bundled from beautiful-mermaid 1.1.3 (MIT) and its dependencies:',
  '// elkjs 0.11.1 (EPL-2.0) and entities 7.0.1 (BSD-2-Clause).',
  '// Licence texts: ./NOTICES.md and ./licenses/. Do not edit by hand; run build.mjs.',
].join('\n')

await build({
  entryPoints: [join(here, 'src/render.mjs')],
  outfile: join(here, 'render.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  minify: true,
  legalComments: 'eof',
  banner: { js: banner },
})

console.log('wrote', join(here, 'render.mjs'))
