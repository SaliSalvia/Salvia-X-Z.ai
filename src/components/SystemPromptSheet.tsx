import React, { useEffect, useState } from 'react';
import { SYSTEM_PROMPT_PRESETS, type SystemPromptConfig } from '../data/zaiCatalog';
import { detectTextDirection, MAX_SYSTEM_PROMPT_CHARS, sanitizeSystemPrompt } from '../utils/portalLogic';

interface SystemPromptSheetProps {
  open: boolean;
  config: SystemPromptConfig;
  onSave: (next: SystemPromptConfig) => void;
  onClose: () => void;
}

export const SystemPromptSheet: React.FC<SystemPromptSheetProps> = ({
  open,
  config,
  onSave,
  onClose,
}) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [text, setText] = useState(config.text);

  useEffect(() => {
    if (open) {
      setEnabled(config.enabled);
      setText(config.text);
    }
  }, [open, config]);

  if (!open) return null;

  const dir = detectTextDirection(text);
  const charCount = text.length;

  const handleSave = () => {
    const cleaned = sanitizeSystemPrompt(text);
    onSave({
      enabled: Boolean(enabled && cleaned.length > 0),
      text: cleaned,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="بستن تنظیمات پرامپت سیستمی"
        onClick={onClose}
        className="anim-fade flex-1 bg-[#0F1115]/45 backdrop-blur-[2px] dark:bg-black/65"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="پرامپت سیستمی با اولویت بالا"
        className="anim-sheet-up mx-auto w-full max-w-[560px] rounded-t-[22px] border-t border-x border-[#E5E7EB] bg-white px-5 pb-4 pt-2.5 shadow-2xl dark:border-[#262A35] dark:bg-[#14161B]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#D1D5DB] dark:bg-[#353B49]" />

        <div className="flex items-start justify-between gap-3 pb-3">
          <div>
            <h2 className="text-[15px] font-bold text-[#0F1115] dark:text-[#F4F5F7]">
              پرامپت سیستمی (اولویت بالا)
            </h2>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#5B6370] dark:text-[#9CA3AF]">
              پیش از تمام پیام‌های چت در لایهٔ اولویت بالا به مدل اعمال می‌شود.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="فعال‌سازی اولویت پرامپت سیستمی"
            onClick={() => setEnabled((v) => !v)}
            className={`press-spring relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
              enabled ? 'bg-[#2563EB]' : 'bg-[#D1D5DB] dark:bg-[#2C313D]'
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                enabled ? '-translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pb-2 text-[11px] font-semibold text-[#5B6370] dark:text-[#9CA3AF]">
          الگوهای آماده:
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3">
          {SYSTEM_PROMPT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setText(preset.text);
                setEnabled(true);
              }}
              className="press-spring shrink-0 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1.5 text-xs font-medium text-[#0F1115] hover:bg-[#F0F2F5] dark:border-[#262A35] dark:bg-[#1C1F26] dark:text-[#F4F5F7] whitespace-nowrap"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div>
          <textarea
            value={text}
            maxLength={MAX_SYSTEM_PROMPT_CHARS}
            onChange={(e) => {
              const next = e.target.value;
              setText(next);
              if (next.trim() && !enabled) setEnabled(true);
            }}
            dir={dir}
            rows={4}
            placeholder="مثال: همیشه با لحن مهندسی، کد تایپ‌شده و فارسی دقیق پاسخ بده و از حاشیه‌روی خودداری کن..."
            className={`w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-3 text-[13.5px] leading-relaxed text-[#0F1115] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none dark:border-[#262A35] dark:bg-[#0B0C0F] dark:text-[#F4F5F7] ${
              dir === 'rtl' ? 'text-right' : 'text-left'
            }`}
          />
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#5B6370] dark:text-[#9CA3AF]">
            <span>{enabled ? 'وضعیت: فعال با اولویت بالاتر از چت' : 'وضعیت: غیرفعال'}</span>
            <span className="tabular-nums" dir="ltr">
              {charCount} / {MAX_SYSTEM_PROMPT_CHARS}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-[#E5E7EB] pt-3 dark:border-[#262A35]">
          <button
            type="button"
            onClick={() => {
              setText('');
              setEnabled(false);
            }}
            className="press-spring rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] dark:border-[#262A35] dark:bg-[#1C1F26] dark:text-[#F87171]"
          >
            پاک کردن
          </button>
          <button
            type="button"
            onClick={onClose}
            className="press-spring rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-2.5 text-xs font-semibold text-[#5B6370] hover:text-[#0F1115] dark:border-[#262A35] dark:bg-[#1C1F26] dark:text-[#9CA3AF]"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="press-spring flex-1 rounded-xl bg-[#0F1115] px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 dark:bg-[#F4F5F7] dark:text-[#0B0C0F]"
          >
            ذخیره و اعمال اولویت
          </button>
        </div>
      </section>
    </div>
  );
};
