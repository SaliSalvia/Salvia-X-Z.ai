import test from 'node:test';
import assert from 'node:assert/strict';
import { mdToHtml, safeUrl } from './markdown';

test('safeUrl blocks javascript: URLs and allows http/https/mailto/data-image', () => {
  assert.equal(safeUrl('https://chat.z.ai'), 'https://chat.z.ai');
  assert.equal(safeUrl('mailto:test@example.com'), 'mailto:test@example.com');
  assert.equal(safeUrl('data:image/png;base64,ABC'), 'data:image/png;base64,ABC');
  assert.equal(safeUrl('javascript:alert(1)'), '');
});

test('mdToHtml renders headings, fenced code, lists, tables, and strips unsafe links', () => {
  const md = [
    '# عنوان اصلی',
    '',
    'متن با **تاکید** و `inline()` و [خطر](javascript:alert(1)).',
    '',
    '```python',
    'def hi():',
    '    return 1',
    '```',
    '',
    '| ستون ۱ | ستون ۲ |',
    '| --- | --- |',
    '| الف | ب |',
  ].join('\n');

  const html = mdToHtml(md);
  assert.match(html, /<h1>عنوان اصلی<\/h1>/);
  assert.match(html, /<strong>تاکید<\/strong>/);
  assert.match(html, /<code>inline\(\)<\/code>/);
  assert.equal(html.includes('javascript:alert'), false);
  assert.match(html, /<pre><code><span class="t-k">def<\/span>/);
  assert.match(html, /<table><thead><tr><th>ستون ۱<\/th>/);
});
