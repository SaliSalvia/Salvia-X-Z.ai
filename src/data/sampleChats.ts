import { PreviewPayload } from '../utils/previewClassifier';

export interface CodeArtifact {
  id: string;
  lang: string;
  filename: string;
  code: string;
}

export interface FileAttachment {
  name: string;
  mime: string;
  payload: PreviewPayload;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  model?: string;
  text: string;
  codeBlocks?: CodeArtifact[];
  attachments?: FileAttachment[];
}

const SAMPLE_HTML = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: linear-gradient(135deg, #12101A 0%, #2A1F4D 100%);
      color: #F8F6F1; font-family: system-ui, sans-serif;
    }
    .card {
      background: rgba(18, 16, 26, 0.86); border: 1px solid #6C4BE0;
      border-radius: 18px; padding: 24px 28px; max-width: 340px; text-align: center;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
    }
    h2 { margin: 0 0 8px; color: #4FD8E8; font-size: 20px; }
    p { margin: 0 0 16px; color: #B9B4C1; font-size: 13px; line-height: 1.7; }
    button {
      background: #6C4BE0; color: #fff; border: 0; border-radius: 10px;
      padding: 9px 18px; font-weight: 700; cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>پیش‌نمایش زندهٔ HTML</h2>
    <p id="status">اجرا در sandbox امن SaliX-Z</p>
    <button onclick="document.getElementById('status').textContent = 'رویداد کلیک با موفقیت اجرا شد ✓';">
      آزمایش تعامل
    </button>
  </div>
</body>
</html>`;

const SAMPLE_MARKDOWN = `# گزارش معماری SaliX-Z

پوستهٔ **SaliX-Z** برای اجرای سریع مدل‌های **GLM-5.3** و پیش‌نمایش خروجی‌ها طراحی شده است.

> سامانهٔ پیش‌نمایش فایل امکان مشاهدهٔ کد، رندر امن HTML/SVG، اسناد Markdown و تصاویر را در پنل قابل جمع‌شدن فراهم می‌کند.

## قابلیت‌های کلیدی

- تزریق خودکار دکمه‌های \`پیش‌نمایش\` و \`کپی\` روی بلوک‌های کد
- نمایشگر کد با شماره خط و هایلایت سینتکس
- پنل دوحالته (۶۲٪ / ۹۴٪) و جمع‌شدنی به pill شناور

| فرمت | نوع نمایش | وضعیت |
| --- | --- | --- |
| HTML / SVG | تب کد + نتیجه (sandbox) | فعال |
| Markdown | تب کد + رندر متنی | فعال |
| Python / TS / Kotlin | هایلایت سینتکس + شکستن خطوط | فعال |
`;

const SAMPLE_PYTHON = `from dataclasses import dataclass

@dataclass
class PreviewItem:
    name: str
    lang: str
    lines: int

def summarize(items: list[PreviewItem]) -> dict[str, int]:
    # شمارش خطوط کل خروجی‌های مدل
    total = sum(item.lines for item in items)
    return {"count": len(items), "total_lines": total}

print(summarize([PreviewItem("app.py", "python", 14)]))`;

const SAMPLE_SVG_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#08070D"/>
          <stop offset="50%" stop-color="#2A1F4D"/>
          <stop offset="100%" stop-color="#12101A"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bg)"/>
      <circle cx="320" cy="180" r="96" fill="none" stroke="#6C4BE0" stroke-width="4"/>
      <circle cx="320" cy="180" r="64" fill="none" stroke="#4FD8E8" stroke-width="2.5" stroke-dasharray="10 6"/>
      <text x="320" y="188" text-anchor="middle" fill="#F8F6F1" font-family="sans-serif" font-size="28" font-weight="bold">SaliX-Z</text>
      <text x="320" y="222" text-anchor="middle" fill="#E0BC7A" font-family="sans-serif" font-size="14">GLM-5.3 Visual Artifact</text>
    </svg>`
  );

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    text: 'یک کارت تعاملی HTML، مستند Markdown و یک اسکریپت پایتون نمونه بساز تا سامانهٔ پیش‌نمایش SaliX-Z را تست کنم.',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    model: 'GLM-5.3-Flash',
    text: 'خروجی‌های درخواستی آماده است. روی دکمهٔ «پیش‌نمایش» در هر بلوک کد بزنید تا در پنل دوحالته (۶۲٪ / ۹۴٪) باز شود یا آن را به pill شناور جمع کنید.',
    codeBlocks: [
      {
        id: 'cb-html',
        lang: 'html',
        filename: 'card-preview.html',
        code: SAMPLE_HTML,
      },
      {
        id: 'cb-md',
        lang: 'markdown',
        filename: 'architecture.md',
        code: SAMPLE_MARKDOWN,
      },
      {
        id: 'cb-py',
        lang: 'python',
        filename: 'summarize.py',
        code: SAMPLE_PYTHON,
      },
    ],
    attachments: [
      {
        name: 'salix-diagram.png',
        mime: 'image/svg+xml',
        payload: {
          name: 'salix-diagram.png',
          lang: 'svg',
          kind: 'IMAGE',
          content: SAMPLE_SVG_IMAGE,
          mime: 'image/svg+xml',
        },
      },
    ],
  },
];

export function generateLocalReply(prompt: string): ChatMessage {
  const lower = prompt.toLowerCase();
  const id = `msg-${Date.now()}`;

  if (lower.includes('html') || lower.includes('صفحه') || lower.includes('وب')) {
    return {
      id,
      role: 'assistant',
      model: 'GLM-5.3',
      text: 'صفحهٔ HTML درخواستی تولید شد. می‌توانید از تب «نتیجه» خروجی زنده را ببینید:',
      codeBlocks: [
        {
          id: `cb-${Date.now()}`,
          lang: 'html',
          filename: 'demo-widget.html',
          code: SAMPLE_HTML,
        },
      ],
    };
  }

  if (lower.includes('json') || lower.includes('config') || lower.includes('تنظیم')) {
    return {
      id,
      role: 'assistant',
      model: 'GLM-5.3-Flash',
      text: 'پیکربندی JSON آماده است:',
      codeBlocks: [
        {
          id: `cb-${Date.now()}`,
          lang: 'json',
          filename: 'config.json',
          code: JSON.stringify(
            {
              app: 'SaliX-Z',
              target: 'https://chat.z.ai',
              models: ['GLM-5.3', 'GLM-5.3-Flash', 'GLM-5.2'],
              preview: { sizes: ['62%', '94%'], pill: true },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  return {
    id,
    role: 'assistant',
    model: 'GLM-5.3-Flash',
    text: `پاسخ نمونه برای «${prompt.slice(0, 80)}» آماده شد. برای تست محیط واقعی chat.z.ai می‌توانید از منوی پوسته گزینهٔ «باز کردن در مرورگر» را بزنید یا فایل دلخواه خود را بارگذاری کنید.`,
    codeBlocks: [
      {
        id: `cb-${Date.now()}`,
        lang: 'typescript',
        filename: 'response.ts',
        code: `// Generated preview snippet\nexport function greet(topic: string): string {\n  return \`SaliX-Z ready for: \${topic}\`;\n}\nconsole.log(greet(${JSON.stringify(prompt.slice(0, 40))}));`,
      },
    ],
  };
}
