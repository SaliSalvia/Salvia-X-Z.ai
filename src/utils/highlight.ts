const KW = {
  clike:
    'abstract as async await break case catch class const continue debugger default delete do else enum export extends false final finally for from func function get go goto if implements import in instanceof interface internal is let long new null operator override package private protected public readonly return sealed set static struct super switch this throw throws trait true try type typeof val var virtual void volatile when where while with yield',
  python:
    'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield self',
  bash:
    'if then else elif fi for while do done case esac function return in echo exit local read export set unset shift cd source alias',
  sql:
    'select from where and or not null is insert into values update set delete create table drop alter add primary key foreign references join left right inner outer on group by order having limit offset distinct as count sum avg min max union all index view',
};

export type LangFamily = 'clike' | 'css' | 'json' | 'xml' | 'python' | 'bash' | 'sql' | 'yaml' | '';

export function famOf(lang: string): LangFamily {
  switch (lang) {
    case 'javascript':
    case 'typescript':
    case 'jsx':
    case 'tsx':
    case 'java':
    case 'kotlin':
    case 'cpp':
    case 'c':
    case 'csharp':
    case 'go':
    case 'rust':
    case 'dart':
    case 'swift':
    case 'php':
    case 'scala':
      return 'clike';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    case 'json':
      return 'json';
    case 'xml':
    case 'html':
    case 'svg':
    case 'xsl':
      return 'xml';
    case 'python':
      return 'python';
    case 'bash':
    case 'sh':
    case 'shell':
    case 'zsh':
      return 'bash';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'ini':
    case 'properties':
      return 'yaml';
    default:
      return '';
  }
}

function regexFor(fam: LangFamily): RegExp | null {
  switch (fam) {
    case 'clike':
      return new RegExp(
        '(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*)' +
          '|("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`)' +
          '|\\b(' +
          KW.clike.split(' ').join('|') +
          ')\\b' +
          '|\\b(0x[0-9a-fA-F]+|\\d+\\.?\\d*(?:[eE][+-]?\\d+)?)',
        'g'
      );
    case 'python':
      return new RegExp(
        '(#[^\\n]*)' +
          '|("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\')' +
          '|\\b(' +
          KW.python.split(' ').join('|') +
          ')\\b' +
          '|(^\\s*@\\w+)' +
          '|\\b(\\d+\\.?\\d*)',
        'gm'
      );
    case 'bash':
      return new RegExp(
        '(#[^\\n]*)' +
          '|("(?:\\\\.|[^"\\\\])*"|\'[^\']*\')' +
          '|\\b(' +
          KW.bash.split(' ').join('|') +
          ')\\b' +
          '|(\\$[\\w{][\\w}]*|\\b\\d+\\b)',
        'g'
      );
    case 'sql':
      return new RegExp(
        '(--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' +
          '|(\'(?:\'\'|[^\'])*\'|"(?:[^"])*")' +
          '|\\b(' +
          KW.sql.split(' ').join('|') +
          ')\\b' +
          '|\\b(\\d+\\.?\\d*)',
        'gi'
      );
    case 'json':
      return /("(?:\\.|[^"\\])*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g;
    case 'yaml':
      return new RegExp(
        '(#[^\\n]*)' +
          '|("(?:\\\\.|[^"\\\\])*"|\'[^\']*\')' +
          '|(^[ \\t]*-?[ \\t]*[\\w.\\-]+(?=:))' +
          '|\\b(true|false|null|yes|no|on|off)\\b' +
          '|\\b(\\d+\\.?\\d*)',
        'gm'
      );
    case 'css':
      return /(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(#[0-9a-fA-F]{3,8}\b)|(\.[\w-]+|@[\w-]+|:[\w-]+)/g;
    case 'xml':
      return /(<!--[\s\S]*?-->)|("(?:[^"])*"|'(?:[^'])*')|(<\/?[\w:.-]+|\/?>|<!\[CDATA\[|\]\]>)/g;
    default:
      return null;
  }
}

export function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tokenClass(fam: LangFamily, groups: RegExpExecArray): string {
  switch (fam) {
    case 'clike':
    case 'python':
    case 'bash':
    case 'sql':
    case 'yaml':
      if (groups[1]) return 't-c';
      if (groups[2]) return 't-s';
      if (groups[3]) return 't-k';
      if (groups[4]) return 't-n';
      return '';
    case 'css':
      if (groups[1]) return 't-c';
      if (groups[2]) return 't-s';
      if (groups[3]) return 't-n';
      if (groups[4]) return 't-k';
      return '';
    case 'xml':
      if (groups[1]) return 't-c';
      if (groups[2]) return 't-s';
      if (groups[3]) return 't-t';
      return '';
    case 'json':
      if (groups[1] && groups[2]) return 't-k';
      if (groups[1]) return 't-s';
      if (groups[3]) return 't-k';
      if (groups[4]) return 't-n';
      return '';
    default:
      return '';
  }
}

export function highlightCode(code: string, lang: string): string {
  const fam = famOf(lang);
  const re = regexFor(fam);
  if (!re) return escHtml(code);
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out += escHtml(code.slice(last, m.index));
    const cls = tokenClass(fam, m);
    out += cls ? `<span class="${cls}">${escHtml(m[0])}</span>` : escHtml(m[0]);
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  out += escHtml(code.slice(last));
  return out;
}
