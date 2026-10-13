/**
 * Rebuilds ./render.mjs by bundling src/render.mjs and its dependencies into one
 * file, so a git install of the plugin needs no `npm install`.
 *
 * elkjs is the exception: it ships UNMODIFIED as its own file under ./vendor/
 * and render.mjs imports it, rather than concatenating it (DEC-169, option A).
 * That keeps the EPL-2.0 code in its own file, where its licence travels with it.
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
  '// Bundled from beautiful-mermaid 1.1.3 (MIT) and entities 7.0.1 (BSD-2-Clause).',
  '// elkjs 0.11.1 (EPL-2.0) is NOT concatenated here: render.mjs imports it',
  '// unmodified from ./vendor/elk.bundled.js, where its licence travels with it.',
  '// Licences and sources: ./licenses/THIRD-PARTY-NOTICES.md.',
  '// Do not edit by hand; rebuild with build.mjs.',
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
  // Send elkjs's import to the committed file beside this bundle and leave it
  // external, so its code stays in its own file and is never inlined.
  alias: { 'elkjs/lib/elk.bundled.js': './vendor/elk.bundled.js' },
  external: ['./vendor/elk.bundled.js'],
  banner: { js: banner },
})

console.log('wrote', join(here, 'render.mjs'))
