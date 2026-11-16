import type {
  ChatCodeBlock,
  ChatMessage,
  Conversation,
  EffortLevel,
  ThinkingStage,
  ZaiModelId,
} from '../data/zaiCatalog';

export interface PreviewPayload {
  title: string;
  lang: string;
  mode: 'code' | 'html' | 'md';
  content: string;
}

export interface ConversationArtifact extends ChatCodeBlock {
  id: string;
  messageId: string;
  timestamp: string;
}

const PERSIAN_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const PERSIAN_GLOBAL_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const LATIN_GLOBAL_RE = /[A-Za-z]/g;

/**
 * Classifies natural paragraph direction: returns 'rtl' when Persian/Arabic
 * script is present as the primary prose script (even alongside technical Latin terms),
 * or 'ltr' when purely Latin/code.
 */
export function detectTextDirection(text: string): 'rtl' | 'ltr' {
  const s = text.trim();
  if (!s) return 'rtl';
  if (!PERSIAN_RE.test(s)) return 'ltr';
  const faCount = (s.match(PERSIAN_GLOBAL_RE) || []).length;
  const enCount = (s.match(LATIN_GLOBAL_RE) || []).length;
  return faCount >= 2 || faCount * 2 >= enCount ? 'rtl' : 'ltr';
}

export function normalizeLanguage(lang: string): string {
  const l = lang.trim().toLowerCase();
  const aliases: Record<string, string> = {
    '': 'text',
    plaintext: 'text',
    txt: 'text',
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    kt: 'kotlin',
    htm: 'html',
    yml: 'yaml',
    sh: 'bash',
  };
  return aliases[l] ?? l;
}

export function previewModeForLang(lang: string): 'code' | 'html' | 'md' {
  const norm = normalizeLanguage(lang);
  if (norm === 'html' || norm === 'svg') return 'html';
  if (norm === 'md' || norm === 'markdown') return 'md';
  return 'code';
}

export function filterConversations(conversations: Conversation[], query: string): Conversation[] {
  const q = query.trim().toLowerCase();
  if (!q) return conversations;
  return conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.messages.some((m) => m.text.toLowerCase().includes(q))
  );
}

export function extractConversationArtifacts(conversation: Conversation | null): ConversationArtifact[] {
  if (!conversation) return [];
  const artifacts: ConversationArtifact[] = [];
  for (const msg of conversation.messages) {
    if (!msg.codeBlocks?.length) continue;
    msg.codeBlocks.forEach((block, idx) => {
      artifacts.push({
        ...block,
        id: `${msg.id}-${idx}`,
        messageId: msg.id,
        timestamp: msg.timestamp,
      });
    });
  }
  return artifacts;
}

export function validatePrompt(raw: string, hasAttachment: boolean): string | null {
  const trimmed = raw.trim();
  if (!trimmed && !hasAttachment) {
    return 'لطفاً متن پیام را وارد کنید یا فایلی پیوست نمایید.';
  }
  if (trimmed.length > 8000) {
    return 'طول پیام از حد مجاز ۸۰۰۰ کاراکتر بیشتر است.';
  }
  return null;
}

export function buildAssistantReply(params: {
  prompt: string;
  model: ZaiModelId;
  effort: EffortLevel;
  deepThink: boolean;
  webSearch: boolean;
  attachmentName?: string | null;
}): ChatMessage {
  const { prompt, model, effort, deepThink, webSearch, attachmentName } = params;
  const lower = prompt.toLowerCase();

  let codeBlocks: ChatCodeBlock[] | undefined;
  let replyText: string;

  if (
    lower.includes('html') ||
    lower.includes('وب') ||
    lower.includes('صفحه') ||
    lower.includes('فرود') ||
    lower.includes('داشبورد') ||
    lower.includes('کارت')
  ) {
    replyText = `خروجی HTML واکنش‌گرا با مدل ${model} (دقت: ${effort}) آماده شد. برای مشاهدهٔ نتیجهٔ رندرشده، دکمهٔ «پیش‌نمایش» یا پنل فایل‌های کشویی را بزنید:`;
    codeBlocks = [
      {
        lang: 'html',
        filename: 'zai-layout.html',
        code: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>
    body { margin:0; padding:24px; font-family:Tahoma,sans-serif; background:#FFFFFF; color:#0F1115; }
    .panel { max-width:460px; margin:0 auto; border:1px solid #E5E7EB; border-radius:16px; padding:20px; background:#F7F8FA; }
    h1 { font-size:18px; margin:0 0 8px; }
    p { font-size:13px; color:#5B6370; line-height:1.75; margin:0 0 14px; }
    .cta { display:inline-block; background:#0F1115; color:#fff; padding:9px 16px; border-radius:10px; font-size:12px; text-decoration:none; }
  </style>
</head>
<body>
  <div class="panel">
    <h1>پیش‌نمایش زنده در SaliX-Z</h1>
    <p>درخواست شما: ${prompt.replace(/</g, '&lt;').slice(0, 120)}</p>
    <a class="cta" href="#ok">تأیید ساختار</a>
  </div>
</body>
</html>`,
      },
    ];
  } else if (
    lower.includes('markdown') ||
    lower.includes('گزارش') ||
    lower.includes('مستند') ||
    lower.includes('اسلاید') ||
    lower.includes('ارائه')
  ) {
    replyText = `سند ساختاریافتهٔ Markdown با مدل ${model} آماده شد و در پنل کشویی فایل‌ها قابل پیش‌نمایش است:`;
    codeBlocks = [
      {
        lang: 'md',
        filename: 'brief-summary.md',
        code: `# جمع‌بندی و نقشهٔ اجرا

این گزارش با چیدمان راست‌به‌چپ فارسی و پشتیبانی از جداول و کد آماده شده است.

## گام‌های کلیدی
1. اتصال مستقیم به نشست کاربری \`chat.z.ai\`
2. همگام‌سازی کامل چت‌هیستوری اکانت در اپلیکیشن
3. پیش‌نمایش کشویی برای فایل‌های HTML، Markdown و کد

| بخش | وضعیت | توضیح |
| --- | --- | --- |
| RTL فارسی | فعال | تراز هوشمند پاراگراف و فهرست‌ها |
| پیش‌نمایش کشویی | فعال | نیم‌صفحه، تمام‌صفحه و pill شناور |`,
      },
    ];
  } else if (
    lower.includes('python') ||
    lower.includes('پایتون') ||
    lower.includes('داده') ||
    lower.includes('کد')
  ) {
    replyText = `اسکریپت پیشنهادی با مدل ${model} تولید شد. می‌توانید کد را کپی یا در پنل پیش‌نمایش کشویی بررسی کنید:`;
    codeBlocks = [
      {
        lang: 'python',
        filename: 'solution.py',
        code: `def summarize_metrics(items: list[dict]) -> dict:
    total = sum(x.get("value", 0) for x in items)
    count = len(items)
    return {
        "count": count,
        "total": total,
        "average": round(total / count, 2) if count else 0.0,
    }

sample = [{"name": "A", "value": 42}, {"name": "B", "value": 58}]
print(summarize_metrics(sample))`,
      },
    ];
  } else {
    const attachNote = attachmentName ? ` (بر اساس فایل «${attachmentName}»)` : '';
    const searchNote = webSearch ? ' همراه با بررسی منابع وب' : '';
    replyText = `پاسخ با مدل ${model}${attachNote}${searchNote} در سطح استدلال «${effort}» آماده شد.\n\nدر پورتال اندرویدی SaliX-Z، چت‌هیستوری اکانت، مراحل تفکر مدل، راست‌به‌چپ دقیق فارسی و پنل کشویی پیش‌نمایش فایل‌ها به‌صورت یکپارچه با نشست chat.z.ai کار می‌کنند.`;
  }

  const thinkingSteps: ThinkingStage[] | undefined = deepThink
    ? [
        {
          title: 'درک مسئله و استخراج قیدها',
          detail: `تحلیل ساختار درخواست و تطبیق لحن و چیدمان راست‌به‌چپ برای «${prompt.slice(0, 48)}».`,
        },
        {
          title: webSearch ? 'بررسی منابع و همبستگی داده' : 'انتخاب معماری و الگوی پاسخ',
          detail: `تنظیم عمق استدلال در سطح «${effort}» با مدل ${model}.`,
        },
        {
          title: 'بازبینی نهایی و آماده‌سازی خروجی',
          detail: codeBlocks?.length
            ? `تولید فایل ${codeBlocks[0].filename} و اتصال به پنل پیش‌نمایش کشویی.`
            : 'تایید دقت محتوا، تراز RTL و جداسازی اصطلاحات فنی.',
        },
      ]
    : undefined;

  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    text: replyText,
    thinking: deepThink ? `تحلیل چندمرحله‌ای در سطح ${effort} تکمیل شد.` : undefined,
    thinkingDuration: deepThink ? (effort === 'حداکثر' ? '۲.۱ ثانیه' : '۱.۱ ثانیه') : undefined,
    thinkingSteps,
    usedSearch: webSearch,
    codeBlocks,
    timestamp: 'هم‌اکنون',
  };
}

export function safeFileExtension(lang: string): string {
  const norm = normalizeLanguage(lang);
  const map: Record<string, string> = {
    html: 'html',
    svg: 'svg',
    md: 'md',
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    json: 'json',
    css: 'css',
  };
  return map[norm] ?? 'txt';
}
