export type PreviewKind = 'CODE' | 'HTML' | 'MARKDOWN' | 'IMAGE';

export interface PreviewPayload {
  name: string;
  lang: string;
  kind: PreviewKind;
  content: string; // text for CODE/HTML/MARKDOWN, or URL/dataURL/blobURL for IMAGE
  mime: string;
  sizeBytes?: number;
}

export const MAX_RENDER_CHARS = 400_000;

const INTERNAL_DOMAINS = ['z.ai'];
const AUTH_DOMAINS = [
  'accounts.google.com',
  'appleid.apple.com',
  'github.com',
  'login.microsoftonline.com',
];

export function isInternalHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  return (
    INTERNAL_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`)) ||
    AUTH_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`))
  );
}

export function normalizeLang(langIn: string): string {
  const l = langIn.trim().toLowerCase();
  switch (l) {
    case '':
    case 'plaintext':
    case 'text':
    case 'txt':
    case 'none':
      return 'text';
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'py':
      return 'python';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'rs':
      return 'rust';
    case 'sh':
    case 'shell':
    case 'zsh':
      return 'bash';
    case 'yml':
      return 'yaml';
    case 'htm':
      return 'html';
    case 'c++':
    case 'cpp':
    case 'cxx':
      return 'cpp';
    case 'cs':
    case 'c#':
      return 'csharp';
    default:
      return l;
  }
}

export function kindFor(lang: string): PreviewKind {
  if (lang === 'html' || lang === 'svg') return 'HTML';
  if (lang === 'md' || lang === 'markdown') return 'MARKDOWN';
  return 'CODE';
}

const EXT_BY_LANG: Record<string, string> = {
  html: '.html',
  svg: '.svg',
  md: '.md',
  markdown: '.md',
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
  kotlin: '.kt',
  java: '.java',
  json: '.json',
  xml: '.xml',
  css: '.css',
  scss: '.scss',
  sql: '.sql',
  bash: '.sh',
  c: '.c',
  cpp: '.cpp',
  csharp: '.cs',
  go: '.go',
  rust: '.rs',
  dart: '.dart',
  swift: '.swift',
  php: '.php',
  yaml: '.yaml',
  toml: '.toml',
  text: '.txt',
};

let previewCounter = 1;

export function resetPreviewCounter(startAt = 1): void {
  previewCounter = startAt;
}

export function suggestName(lang: string, kind: PreviewKind): string {
  const ext =
    EXT_BY_LANG[lang] ??
    (kind === 'HTML'
      ? '.html'
      : kind === 'MARKDOWN'
        ? '.md'
        : kind === 'IMAGE'
          ? '.png'
          : '.txt');
  return `preview-${previewCounter++}${ext}`;
}

export function mimeFor(kind: PreviewKind): string {
  switch (kind) {
    case 'HTML':
      return 'text/html';
    case 'MARKDOWN':
      return 'text/markdown';
    case 'IMAGE':
      return 'image/png';
    case 'CODE':
      return 'text/plain';
  }
}

export function langForExt(ext: string): string {
  switch (ext) {
    case 'js':
    case 'mjs':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'py':
      return 'python';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'java':
      return 'java';
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
      return 'bash';
    case 'c':
      return 'c';
    case 'cpp':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'dart':
      return 'dart';
    case 'swift':
      return 'swift';
    case 'php':
      return 'php';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'toml':
      return 'toml';
    default:
      return 'text';
  }
}

export const IMAGE_EXTS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'heic',
  'avif',
]);

const TEXTUAL_EXTS = new Set([
  'js', 'mjs', 'ts', 'jsx', 'tsx', 'py', 'kt', 'kts', 'java', 'json', 'xml',
  'css', 'scss', 'less', 'sql', 'sh', 'bash', 'c', 'h', 'cpp', 'hpp', 'cs',
  'go', 'rs', 'dart', 'swift', 'php', 'yaml', 'yml', 'toml', 'ini', 'cfg',
  'txt', 'log', 'csv', 'gradle', 'properties', 'md',
]);

export function isHtmlFile(ext: string): boolean {
  return ext === 'html' || ext === 'htm' || ext === 'svg';
}

export function isTextual(ext: string, mime: string): boolean {
  return (
    mime.startsWith('text/') ||
    mime.startsWith('application/json') ||
    mime.startsWith('application/javascript') ||
    mime.startsWith('application/xml') ||
    TEXTUAL_EXTS.has(ext)
  );
}

export function extOf(name: string, mime: string): string {
  const idx = name.lastIndexOf('.');
  const ext = idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
  if (ext.length > 0 && ext.length <= 5) return ext;
  if (mime.startsWith('image/')) return mime.slice('image/'.length).replace('jpeg', 'jpg');
  if (mime === 'text/html') return 'html';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('text/')) return 'txt';
  return 'bin';
}

export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[/\\:*?"<>|\u0000-\u001F]/g, '_')
    .trim()
    .slice(0, 120);
  return cleaned || 'file.bin';
}

export function guessFileName(
  disposition: string | null | undefined,
  url: string,
  mime: string
): string {
  const raw = (disposition ?? '').trim();
  if (raw.length > 0) {
    const utf8Match = raw.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      const value = utf8Match[1].trim().replace(/^["'\s]+|["'\s]+$/g, '');
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
    const plainMatch = raw.match(/filename="?([^";]+)"?/i);
    if (plainMatch?.[1]) {
      return plainMatch[1].trim();
    }
    if (!raw.includes('/') && raw.includes('.') && !raw.includes(';')) {
      return raw;
    }
  }
  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    path = url;
  }
  const last = path.split('/').pop() ?? '';
  if (last.length > 0 && last.includes('.')) return last;
  const ext = extOf('', mime);
  const stamp = Math.floor(Date.now() / 1000) % 100000;
  return `download-${stamp}.${ext}`;
}

export function buildCodePayload(code: string, langIn: string, customName?: string): PreviewPayload {
  const lang = normalizeLang(langIn);
  const kind = kindFor(lang);
  const name = customName ? sanitizeFileName(customName) : suggestName(lang, kind);
  return {
    name,
    lang,
    kind,
    content: code,
    mime: mimeFor(kind),
  };
}

export function classifyFilePayload(
  nameIn: string,
  mime: string,
  content: string
): PreviewPayload | null {
  const name = sanitizeFileName(nameIn);
  const ext = extOf(name, mime);
  if (mime.startsWith('image/') || IMAGE_EXTS.has(ext)) {
    return {
      name,
      lang: ext || 'image',
      kind: 'IMAGE',
      content,
      mime: mime || 'image/*',
    };
  }
  if (isHtmlFile(ext) || mime.toLowerCase() === 'text/html') {
    return {
      name,
      lang: ext === 'svg' ? 'svg' : 'html',
      kind: 'HTML',
      content,
      mime: ext === 'svg' ? 'image/svg+xml' : 'text/html',
    };
  }
  if (ext === 'md' || ext === 'markdown' || mime.toLowerCase() === 'text/markdown') {
    return {
      name,
      lang: 'md',
      kind: 'MARKDOWN',
      content,
      mime: 'text/markdown',
    };
  }
  if (isTextual(ext, mime)) {
    return {
      name,
      lang: langForExt(ext),
      kind: 'CODE',
      content,
      mime: mime || 'text/plain',
    };
  }
  return null;
}
