import test from 'node:test';
import assert from 'node:assert/strict';
import { famOf, highlightCode } from './highlight';

test('famOf maps languages to highlighter families', () => {
  assert.equal(famOf('typescript'), 'clike');
  assert.equal(famOf('kotlin'), 'clike');
  assert.equal(famOf('python'), 'python');
  assert.equal(famOf('html'), 'xml');
  assert.equal(famOf('json'), 'json');
  assert.equal(famOf('unknown'), '');
});

test('highlightCode escapes HTML and wraps keywords, strings, numbers, and comments', () => {
  const out = highlightCode('const x = "hi"; // note <script>', 'javascript');
  assert.match(out, /<span class="t-k">const<\/span>/);
  assert.match(out, /<span class="t-s">&quot;hi&quot;<\/span>/);
  assert.match(out, /<span class="t-c">\/\/ note &lt;script&gt;<\/span>/);
  assert.equal(out.includes('<script>'), false);
});

test('highlightCode differentiates JSON keys from string values', () => {
  const out = highlightCode('{"name": "SaliX-Z", "ok": true, "n": 42}', 'json');
  assert.match(out, /<span class="t-k">&quot;name&quot;:<\/span>/);
  assert.match(out, /<span class="t-s">&quot;SaliX-Z&quot;<\/span>/);
  assert.match(out, /<span class="t-k">true<\/span>/);
  assert.match(out, /<span class="t-n">42<\/span>/);
});
