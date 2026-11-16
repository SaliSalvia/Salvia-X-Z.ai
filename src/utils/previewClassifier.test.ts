import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCodePayload,
  classifyFilePayload,
  extOf,
  guessFileName,
  isInternalHost,
  kindFor,
  normalizeLang,
  resetPreviewCounter,
  sanitizeFileName,
} from './previewClassifier';

test('normalizeLang maps aliases consistently with PreviewController.kt', () => {
  assert.equal(normalizeLang(''), 'text');
  assert.equal(normalizeLang('plaintext'), 'text');
  assert.equal(normalizeLang('JS'), 'javascript');
  assert.equal(normalizeLang('ts'), 'typescript');
  assert.equal(normalizeLang('py'), 'python');
  assert.equal(normalizeLang('kts'), 'kotlin');
  assert.equal(normalizeLang('zsh'), 'bash');
  assert.equal(normalizeLang('htm'), 'html');
  assert.equal(normalizeLang('c++'), 'cpp');
  assert.equal(normalizeLang('c#'), 'csharp');
});

test('kindFor classifies html/svg, markdown, and code blocks', () => {
  assert.equal(kindFor('html'), 'HTML');
  assert.equal(kindFor('svg'), 'HTML');
  assert.equal(kindFor('md'), 'MARKDOWN');
  assert.equal(kindFor('markdown'), 'MARKDOWN');
  assert.equal(kindFor('python'), 'CODE');
});

test('isInternalHost allows z.ai subdomains and OAuth providers only', () => {
  assert.equal(isInternalHost('chat.z.ai'), true);
  assert.equal(isInternalHost('z.ai'), true);
  assert.equal(isInternalHost('accounts.google.com'), true);
  assert.equal(isInternalHost('github.com'), true);
  assert.equal(isInternalHost('evilz.ai'), false);
  assert.equal(isInternalHost('example.com'), false);
  assert.equal(isInternalHost(null), false);
});

test('guessFileName handles RFC5987, quoted filename, bare name, and URL path', () => {
  assert.equal(
    guessFileName("attachment; filename*=UTF-8''%D8%B3%D9%84%D8%A7%D9%85.md", 'https://chat.z.ai/x', 'text/markdown'),
    'سلام.md'
  );
  assert.equal(
    guessFileName('attachment; filename="report.json"', 'https://chat.z.ai/x', 'application/json'),
    'report.json'
  );
  assert.equal(
    guessFileName('chart.svg', 'blob:https://chat.z.ai/123', 'image/svg+xml'),
    'chart.svg'
  );
  assert.equal(
    guessFileName('', 'https://chat.z.ai/files/demo.py?dl=1', 'text/x-python'),
    'demo.py'
  );
});

test('sanitizeFileName removes unsafe path chars and caps length', () => {
  assert.equal(sanitizeFileName('a/b\\c:d*e?.txt'), 'a_b_c_d_e_.txt');
  assert.equal(sanitizeFileName('   '), 'file.bin');
  assert.equal(extOf('photo.jpeg', 'image/jpeg'), 'jpeg');
  assert.equal(extOf('noext', 'image/jpeg'), 'jpg');
});

test('buildCodePayload and classifyFilePayload produce expected PreviewPayload', () => {
  resetPreviewCounter(1);
  const p = buildCodePayload('<h1>Hi</h1>', 'htm');
  assert.equal(p.name, 'preview-1.html');
  assert.equal(p.kind, 'HTML');
  assert.equal(p.lang, 'html');
  assert.equal(p.mime, 'text/html');

  const img = classifyFilePayload('avatar.png', 'image/png', 'data:image/png;base64,AAA');
  assert.ok(img);
  assert.equal(img.kind, 'IMAGE');

  const pdf = classifyFilePayload('doc.pdf', 'application/pdf', '');
  assert.equal(pdf, null);
});
