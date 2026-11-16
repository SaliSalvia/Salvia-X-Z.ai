export type ZaiModelId = 'GLM-5.3-Flash' | 'GLM-5.3' | 'GLM-5.2';
export type EffortLevel = 'سریع' | 'متعادل' | 'حداکثر';

export interface ZaiModelInfo {
  id: ZaiModelId;
  label: string;
  summary: string;
  tier: string;
}

export interface WorkspaceMode {
  id: string;
  englishName: string;
  titleFa: string;
  subtitleFa: string;
  starterPrompt: string;
}

export interface ChatCodeBlock {
  lang: string;
  filename: string;
  code: string;
}

export interface ThinkingStage {
  title: string;
  detail: string;
}

export interface SystemPromptConfig {
  enabled: boolean;
  text: string;
}

export interface SystemPromptPreset {
  id: string;
  label: string;
  text: string;
}

export const SYSTEM_PROMPT_PRESETS: SystemPromptPreset[] = [
  {
    id: 'engineer',
    label: 'مهندس ارشد کدنویسی',
    text: 'به‌عنوان مهندس ارشد نرم‌افزار پاسخ بده: کد تمیز، تایپ‌شده، بدون باگ و همراه با توضیح کوتاه و دقیق فارسی ارائه کن.',
  },
  {
    id: 'translator',
    label: 'مترجم دقیق فارسی',
    text: 'متن‌ها را روان، طبیعی و امانت‌دار به فارسی معیار ترجمه کن و اصطلاحات تخصصی را با املای استاندارد حفظ کن.',
  },
  {
    id: 'analyst',
    label: 'تحلیلگر ساختاریافته',
    text: 'پاسخ‌ها را مرحله‌به‌مرحله، همراه با فهرست شماره‌دار یا جدول مقایسه، استدلال شفاف و جمع‌بندی عملی ارائه بده.',
  },
  {
    id: 'concise',
    label: 'پاسخ مستقیم و خلاصه',
    text: 'از حاشیه‌روی پرهیز کن؛ مستقیم راه‌حل نهایی و اجرایی را در کوتاه‌ترین و دقیق‌ترین شکل بیان کن.',
  },
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  thinking?: string;
  thinkingDuration?: string;
  thinkingSteps?: ThinkingStage[];
  usedSearch?: boolean;
  appliedSystemPrompt?: string;
  codeBlocks?: ChatCodeBlock[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: ZaiModelId;
  updatedAt: string;
  pinned?: boolean;
  messages: ChatMessage[];
}

export const ZAI_MODELS: ZaiModelInfo[] = [
  {
    id: 'GLM-5.3-Flash',
    label: 'GLM-5.3-Flash',
    summary: 'فوق‌سریع و رایگان برای گفتگوی روزمره، کدنویسی و خلاصه‌سازی',
    tier: 'رایگان · وب‌سایت',
  },
  {
    id: 'GLM-5.3',
    label: 'GLM-5.3',
    summary: 'استدلال چندمرحله‌ای، معماری نرم‌افزار و تحلیل‌های تخصصی',
    tier: 'رایگان · وب‌سایت',
  },
  {
    id: 'GLM-5.2',
    label: 'GLM-5.2',
    summary: 'مدل پایدار و متوازن برای نگارش فارسی و ترجمه دقیق',
    tier: 'رایگان · وب‌سایت',
  },
];

export const EFFORT_LEVELS: EffortLevel[] = ['سریع', 'متعادل', 'حداکثر'];

export const WORKSPACE_MODES: WorkspaceMode[] = [
  {
    id: 'fullstack',
    englishName: 'Full-Stack',
    titleFa: 'فول‌استک',
    subtitleFa: 'ساخت اپ و رابط کاربری',
    starterPrompt: 'یک داشبورد مدیریتی مدرن با HTML و CSS واکنش‌گرا و تم روشن/تاریک بساز.',
  },
  {
    id: 'writing',
    englishName: 'Writing',
    titleFa: 'نگارش',
    subtitleFa: 'متن، ایمیل و مقاله',
    starterPrompt: 'یک گزارش فنی ساختاریافته به صورت Markdown دربارهٔ معماری موبایل بنویس.',
  },
  {
    id: 'data',
    englishName: 'Data Insight',
    titleFa: 'تحلیل داده',
    subtitleFa: 'جدول، الگو و کد پایتون',
    starterPrompt: 'یک اسکریپت پایتون برای تحلیل داده‌های فروش ماهانه و شناسایی روند رشد بنویس.',
  },
  {
    id: 'ppt',
    englishName: 'PPT',
    titleFa: 'اسلاید',
    subtitleFa: 'طراحی ارائه و ساختار',
    starterPrompt: 'ساختار یک ارائهٔ ۶ اسلایدی در قالب Markdown برای معرفی محصول هوشمند آماده کن.',
  },
  {
    id: 'website',
    englishName: 'Web Site',
    titleFa: 'وب‌سایت',
    subtitleFa: 'صفحهٔ فرود حرفه‌ای',
    starterPrompt: 'یک صفحهٔ فرود مینیمال به زبان فارسی با HTML برای معرفی استودیوی طراحی بساز.',
  },
  {
    id: 'scheduled',
    englishName: 'Scheduled',
    titleFa: 'زمان‌بندی',
    subtitleFa: 'برنامه‌ریزی و پیگیری',
    starterPrompt: 'یک برنامهٔ هفتگی دقیق برای مطالعه، کدنویسی و مرور پروژه‌ها تنظیم کن.',
  },
];

export const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-ui-card',
    title: 'طراحی کارت آمار واکنش‌گرا',
    model: 'GLM-5.3-Flash',
    updatedAt: 'امروز · ۱۴:۲۰',
    pinned: true,
    messages: [
      {
        id: 'm1',
        role: 'user',
        text: 'یک کارت خلاصه وضعیت پروژه به زبان فارسی با HTML تمیز بساز که در پیش‌نمایش زنده اجرا شود.',
        timestamp: '۱۴:۱۸',
      },
      {
        id: 'm2',
        role: 'assistant',
        thinkingDuration: '۱.۲ ثانیه',
        thinkingSteps: [
          {
            title: 'تحلیل نیاز و جهت نوشتار (RTL)',
            detail: 'ساختار کامپوننت باید کاملاً راست‌به‌چپ باشد و اعداد فارسی در گرید ۳ستونه تراز شوند.',
          },
          {
            title: 'بهینه‌سازی CSS موبایلی',
            detail: 'استفاده از فونت سیستمی خوانا، حاشیهٔ ظریف و کنتراست بالا بدون وابستگی خارجی.',
          },
          {
            title: 'آماده‌سازی فایل خروجی قابل اجرا',
            detail: 'بسته‌بندی در فایل status-card.html برای اجرای فوری در پنل پیش‌نمایش کشویی.',
          },
        ],
        text: 'این کد یک کارت وضعیت تمیز و واکنش‌گرا با پشتیبانی کامل از راست‌به‌چپ می‌سازد. می‌توانید از دکمهٔ «پیش‌نمایش» یا پنل فایل‌های کشویی برای مشاهدهٔ نتیجهٔ زنده استفاده کنید:',
        codeBlocks: [
          {
            lang: 'html',
            filename: 'status-card.html',
            code: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>
    body { margin:0; padding:24px; font-family:Tahoma,sans-serif; background:#F7F8FA; color:#0F1115; }
    .card { max-width:420px; margin:0 auto; background:#FFFFFF; border:1px solid #E5E7EB; border-radius:16px; padding:20px; }
    .kicker { font-size:12px; color:#2563EB; font-weight:600; margin-bottom:6px; }
    h2 { margin:0 0 8px; font-size:18px; }
    p { margin:0 0 16px; font-size:13px; color:#5B6370; line-height:1.7; }
    .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; border-top:1px solid #E5E7EB; padding-top:14px; }
    .val { font-size:17px; font-weight:700; }
    .lbl { font-size:11px; color:#6B7280; margin-top:2px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="kicker">پورتال موبایل Z.ai</div>
    <h2>عملکرد نسخهٔ جدید رابط کاربری</h2>
    <p>چیدمان ریسپانسیو برای نمایش بی‌نقص گفتگو، بلوک‌های کد و خروجی زنده در گوشی.</p>
    <div class="grid">
      <div><div class="val">۹۹.۴٪</div><div class="lbl">پایداری نشست</div></div>
      <div><div class="val">۱۲۰ms</div><div class="lbl">تزریق پوسته</div></div>
      <div><div class="val">۳ مدل</div><div class="lbl">GLM رایگان</div></div>
    </div>
  </div>
</body>
</html>`,
          },
        ],
        timestamp: '۱۴:۲۰',
      },
    ],
  },
  {
    id: 'conv-python',
    title: 'تحلیل داده‌های فروش با پایتون',
    model: 'GLM-5.3',
    updatedAt: 'دیروز · ۲۱:۰۵',
    messages: [
      {
        id: 'm3',
        role: 'user',
        text: 'یک تابع پایتون سریع برای محاسبهٔ نرخ رشد ماهانه بنویس.',
        timestamp: '۲۱:۰۴',
      },
      {
        id: 'm4',
        role: 'assistant',
        thinkingDuration: '۰.۹ ثانیه',
        thinkingSteps: [
          {
            title: 'بررسی حالت‌های مرزی داده',
            detail: 'مدیریت لیست‌های کوتاه‌تر از ۲ عنصر و جلوگیری از تقسیم بر صفر هنگام مقدار قبلی برابر با ۰.',
          },
          {
            title: 'نگارش کد تایپ‌شده و خوانا',
            detail: 'استفاده از type hints استاندارد پایتون و گرد کردن خروجی تا دو رقم اعشار.',
          },
        ],
        text: 'در ادامه یک تابع تمیز و بدون وابستگی خارجی برای محاسبهٔ نرخ رشد درصد ماهانه آورده شده است:',
        codeBlocks: [
          {
            lang: 'python',
            filename: 'growth_rate.py',
            code: `def monthly_growth(values: list[float]) -> list[float]:
    if len(values) < 2:
        return []
    rates: list[float] = []
    for prev, curr in zip(values, values[1:]):
        if prev == 0:
            rates.append(0.0)
        else:
            rates.append(round(((curr - prev) / prev) * 100, 2))
    return rates

if __name__ == "__main__":
    sales = [120, 145, 160, 198]
    print("Monthly growth %:", monthly_growth(sales))`,
          },
        ],
        timestamp: '۲۱:۰۵',
      },
    ],
  },
];
