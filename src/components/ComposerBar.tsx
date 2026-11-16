import React, { useState, useRef, useEffect } from 'react';
import type { ZaiModelId } from '../data/zaiCatalog';
import { detectTextDirection } from '../utils/portalLogic';

interface ComposerBarProps {
  value: string;
  activeModel: ZaiModelId;
  deepThink: boolean;
  webSearch: boolean;
  attachmentName: string | null;
  validationError: string | null;
  onChange: (val: string) => void;
  onToggleDeepThink: () => void;
  onToggleWebSearch: () => void;
  onAttachFile: (fileName: string | null) => void;
  onOpenModelPicker: () => void;
  onSubmit: () => void;
}

export const ComposerBar: React.FC<ComposerBarProps> = ({
  value,
  activeModel,
  deepThink,
  webSearch,
  attachmentName,
  validationError,
  onChange,
  onToggleDeepThink,
  onToggleWebSearch,
  onAttachFile,
  onOpenModelPicker,
  onSubmit,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (ev: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(ev.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [moreOpen]);

  const handleVoiceToggle = () => {
    if (voiceActive) {
      setVoiceActive(false);
      return;
    }
    setVoiceActive(true);
    setTimeout(() => {
      setVoiceActive(false);
      if (!value.trim()) {
        onChange('لطفاً یک برنامهٔ خلاصه و کاربردی برای مدیریت کارهای روزانه بنویس.');
      }
    }, 900);
  };

  const inputDir = value.trim() ? detectTextDirection(value) : 'rtl';

  return (
    <div className="shrink-0 border-t border-[#E5E7EB] bg-white px-3 pb-3 pt-2.5 dark:border-[#262A35] dark:bg-[#0B0C0F] sm:px-5">
      <div className="mx-auto w-full max-w-[760px]">
        {(deepThink || webSearch || attachmentName) && (
          <div className="anim-fade-up mb-2 flex flex-wrap items-center gap-3 px-1 text-xs text-[#5B6370] dark:text-[#9CA3AF]">
            {deepThink && (
              <button
                type="button"
                onClick={onToggleDeepThink}
                className="press-spring inline-flex items-center gap-1 font-medium text-[#2563EB] hover:underline dark:text-[#3B82F6]"
              >
                <span>استدلال عمیق فعال</span>
                <span aria-hidden="true">×</span>
              </button>
            )}
            {webSearch && (
              <button
                type="button"
                onClick={onToggleWebSearch}
                className="press-spring inline-flex items-center gap-1 font-medium text-[#2563EB] hover:underline dark:text-[#3B82F6]"
              >
                <span>جستجوی وب فعال</span>
                <span aria-hidden="true">×</span>
              </button>
            )}
            {attachmentName && (
              <button
                type="button"
                onClick={() => onAttachFile(null)}
                className="press-spring inline-flex items-center gap-1 font-medium text-[#0F1115] hover:underline dark:text-[#F4F5F7]"
              >
                <span>فایل: {attachmentName}</span>
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>
        )}

        {validationError && (
          <div
            role="alert"
            className="anim-fade-up mb-2 rounded-xl border border-[#DC2626]/30 bg-[#FEF2F2] px-3 py-2 text-xs text-[#DC2626] dark:bg-[#2A1215] dark:text-[#FCA5A5]"
          >
            {validationError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-2.5 transition-all duration-200 focus-within:border-[#2563EB] focus-within:bg-white focus-within:shadow-sm dark:border-[#262A35] dark:bg-[#14161B] dark:focus-within:bg-[#181B22]"
        >
          <label htmlFor="chat-composer-input" className="sr-only">
            پیام به Z.ai
          </label>
          <textarea
            id="chat-composer-input"
            dir={inputDir}
            rows={2}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="هر چه می‌خواهید از Z.ai بپرسید یا بنویسید..."
            className={`w-full resize-none bg-transparent px-1.5 py-1 text-[15px] leading-relaxed text-[#0F1115] placeholder:text-right placeholder:text-[#94A3B8] focus:outline-none dark:text-[#F4F5F7] bidi-auto ${
              inputDir === 'rtl' ? 'text-right' : 'text-left'
            }`}
          />

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="relative flex items-center gap-1" ref={moreRef}>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onAttachFile(file.name);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-label="ابزارها و قابلیت‌های بیشتر"
                className="press-spring inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#0F1115] hover:bg-[#F0F2F5] dark:border-[#262A35] dark:bg-[#1C1F26] dark:text-[#F4F5F7]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`transition-transform duration-200 ${moreOpen ? 'rotate-45' : ''}`}
                  aria-hidden="true"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleVoiceToggle}
                aria-label={voiceActive ? 'توقف ضبط صدا' : 'ورودی صوتی'}
                className={`press-spring inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium ${
                  voiceActive
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] dark:bg-[#172554] dark:text-[#93C5FD]'
                    : 'border-[#E5E7EB] bg-white text-[#5B6370] hover:text-[#0F1115] dark:border-[#262A35] dark:bg-[#1C1F26] dark:text-[#9CA3AF]'
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                </svg>
                <span className="hidden sm:inline">{voiceActive ? 'در حال گوش دادن...' : 'صدا'}</span>
              </button>

              {moreOpen && (
                <div
                  role="dialog"
                  aria-label="ابزارهای پیشرفته گفتگو"
                  className="anim-pop-in absolute bottom-11 start-0 z-40 w-60 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-lg dark:border-[#262A35] dark:bg-[#14161B]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onToggleDeepThink();
                      setMoreOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-[#0F1115] hover:bg-[#F7F8FA] dark:text-[#F4F5F7] dark:hover:bg-[#1C1F26]"
                  >
                    <span>استدلال عمیق (Deep Think)</span>
                    <span className="text-[11px] font-semibold text-[#2563EB]">
                      {deepThink ? 'روشن' : 'خاموش'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleWebSearch();
                      setMoreOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-[#0F1115] hover:bg-[#F7F8FA] dark:text-[#F4F5F7] dark:hover:bg-[#1C1F26]"
                  >
                    <span>جستجوی وب (Web Search)</span>
                    <span className="text-[11px] font-semibold text-[#2563EB]">
                      {webSearch ? 'روشن' : 'خاموش'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-[#0F1115] hover:bg-[#F7F8FA] dark:text-[#F4F5F7] dark:hover:bg-[#1C1F26]"
                  >
                    <span>پیوست فایل یا تصویر</span>
                    <span className="text-[11px] text-[#5B6370] dark:text-[#9CA3AF]">انتخاب</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenModelPicker}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#5B6370] hover:bg-[#E5E7EB]/60 hover:text-[#0F1115] dark:text-[#9CA3AF] dark:hover:bg-[#222630] dark:hover:text-[#F4F5F7] whitespace-nowrap"
                dir="ltr"
              >
                {activeModel}
              </button>

              <button
                type="submit"
                aria-label="ارسال پیام"
                className="press-spring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0F1115] text-white hover:opacity-90 dark:bg-[#F4F5F7] dark:text-[#0B0C0F]"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
