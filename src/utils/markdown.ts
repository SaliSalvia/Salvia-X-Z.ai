import { escHtml, highlightCode } from './highlight';

export function safeUrl(u: string): string {
  const url = String(u || '').trim();
  if (/^(https?:|mailto:)/i.test(url)) return url;
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(url)) return url;
  return '';
}

function inlineMd(sIn: string): string {
  let s = escHtml(sIn);
  s = s.replace(/`([^`]+)`/g, (_, c: string) => `<code>${c}</code>`);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (_, alt: string, url: string) => {
    const safe = safeUrl(url.replace(/&amp;/g, '&'));
    return safe ? `<img src="${escHtml(safe)}" alt="${alt}">` : alt;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (_, text: string, url: string) => {
    const safe = safeUrl(url.replace(/&amp;/g, '&'));
    return safe ? `<a href="${escHtml(safe)}" target="_blank" rel="noreferrer">${text}</a>` : text;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return s;
}

export function mdToHtml(src: string): string {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  let html = '';
  let i = 0;
  let para: string[] = [];

  function flush(): void {
    if (para.length) {
      html += `<p>${para.map(inlineMd).join('<br>')}</p>`;
      para = [];
    }
  }

  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      flush();
      const lang = l.slice(3).trim().toLowerCase();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      html += `<pre><code>${highlightCode(buf.join('\n'), lang)}</code></pre>`;
      continue;
    }

    const h = l.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      flush();
      html += `<h${h[1].length}>${inlineMd(h[2])}</h${h[1].length}>`;
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) {
      flush();
      html += '<hr>';
      i++;
      continue;
    }

    if (/^\s*>\s?/.test(l)) {
      flush();
      const q: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        q.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      html += `<blockquote>${mdToHtml(q.join('\n'))}</blockquote>`;
      continue;
    }

    if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
      flush();
      const ordered = /^\s*\d/.test(l);
      const items: string[] = [];
      let tmp: RegExpMatchArray | null;
      while (i < lines.length && (tmp = lines[i].match(/^\s*([-*+]|\d+[.)])\s+(.*)/))) {
        items.push(tmp[2]);
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      html += `<${tag}>${items.map((x) => `<li>${inlineMd(x)}</li>`).join('')}</${tag}>`;
      continue;
    }

    if (l.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      flush();
      const head = l
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((x) => x.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(
          lines[i]
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((x) => x.trim())
        );
        i++;
      }
      html +=
        `<table><thead><tr>${head.map((x) => `<th>${inlineMd(x)}</th>`).join('')}</tr></thead><tbody>` +
        rows
          .map((r) => `<tr>${r.map((x) => `<td>${inlineMd(x)}</td>`).join('')}</tr>`)
          .join('') +
        '</tbody></table>';
      continue;
    }

    if (l.trim() === '') {
      flush();
      i++;
      continue;
    }

    para.push(l);
    i++;
  }

  flush();
  return html;
}
