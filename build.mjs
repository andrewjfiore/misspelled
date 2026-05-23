// One-shot build: strips React/lucide imports and `export default` from MisspelledApp.jsx,
// runs esbuild to compile JSX, and splices the result into index.html between the
// import lines and the createRoot() call. Idempotent.
import { readFileSync, writeFileSync } from 'node:fs';
import { transform } from 'esbuild';

const SRC = 'MisspelledApp.jsx';
const HTML = 'index.html';

const raw = readFileSync(SRC, 'utf8');
const stripped = raw
  .replace(/^import React.*from ['"]react['"];?\s*$/m, '')
  .replace(/^import\s*\{[^}]*\}\s*from ['"]lucide-react['"];?\s*$/m, '')
  .replace(/^export default function MisspelledApp/m, 'function MisspelledApp');

const result = await transform(stripped, {
  loader: 'jsx',
  target: 'es2020',
  jsx: 'transform',
});
const compiled = result.code.trim();

const html = readFileSync(HTML, 'utf8');
// Replace everything between the lucide-react import line and the `    createRoot(` line.
const startMarker = /(} from ['"]lucide-react['"];\s*\n)/;
const endMarker = /(\n\s*createRoot\(document\.getElementById)/;
const startMatch = html.match(startMarker);
const endMatch = html.match(endMarker);
if (!startMatch || !endMatch) {
  console.error('Could not find splice markers in index.html');
  process.exit(1);
}
const startIdx = startMatch.index + startMatch[0].length;
const endIdx = endMatch.index;

const newHtml = html.slice(0, startIdx) + '\n' + compiled + '\n' + html.slice(endIdx);
writeFileSync(HTML, newHtml);
console.log(`Compiled ${compiled.length} chars, wrote ${HTML} (${newHtml.length} chars total)`);
