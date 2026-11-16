import React from 'react';
import { WORKSPACE_MODES, type WorkspaceMode } from '../data/zaiCatalog';

interface ControlSheetProps {
  open: boolean;
  dark: boolean;
  enhancedMobile: boolean;
  mobileFrame: boolean;
  onClose: () => void;
  onSelectMode: (mode: WorkspaceMode) => void;
  onToggleTheme: () => void;
  onToggleEnhance: () => void;
  onToggleViewport: () => void;
  onNewChat: () => void;
  onResetSession: () => void;
}

export const ControlSheet: React.FC<ControlSheetProps> = ({
  open,
  dark,
  enhancedMobile,
  mobileFrame,
  onClose,
  onSelectMode,
  onToggleTheme,
  onToggleEnhance,
  onToggleViewport,
  onNewChat,
  onResetSession,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="بستن منوی پورتال"
        onClick={onClose}
        className="anim-fade flex-1 bg-[#0F1115]/45 backdrop-blur-[2px] dark:bg-black/65"
      />
      <section
        aria-label="منوی امکانات پورتال Z.ai"
        className="anim-sheet-up mx-auto w-full max-w-[540px] rounded-t-[22px] border-t border-x border-[#E5E7EB] bg-white pb-3 pt-2.5 shadow-2xl dark:border-[#262A35] dark:bg-[#14161B]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#D1D5DB] dark:bg-[#353B49]" />

        <div className="px-5 pb-2 text-[11px] font-semibold text-[#5B6370] dark:text-[#9CA3AF]">
          حالت‌های کاری Z.ai
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 pb-3">
          {WORKSPACE_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSelectMode(m);
                onClose();
              }}
              className="shrink-0 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-3.5 py-2 text-xs font-medium text-[#0F1115] hover:bg-[#F0F2F5] dark:border-[#262A35] dark:bg-[#1C1F26] dark:text-[#F4F5F7] whitespace-nowrap"
            >
              {m.titleFa}
            </button>
          ))}
        </div>

        <div className="border-t border-[#E5E7EB] dark:border-[#262A35]">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex w-full items-center justify-between px-5 py-3 text-start hover:bg-[#F7F8FA] dark:hover:bg-[#1A1D24]"
          >
            <div>
              <div className="text-sm font-medium text-[#0F1115] dark:text-[#F4F5F7]">
                گفتگوی جدید
              </div>
              <div className="text-[11px] text-[#5B6370] dark:text-[#9CA3AF]">
                شروع مکالمهٔ تازه با مدل‌های رایگان GLM
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex w-full items-center justify-between border-t border-[#E5E7EB]/60 px-5 py-3 text-start hover:bg-[#F7F8FA] dark:border-[#262A35] dark:hover:bg-[#1A1D24]"
          >
            <div>
              <div className="text-sm font-medium text-[#0F1115] dark:text-[#F4F5F7]">
                {dark ? 'تم: تاریک (شبانه)' : 'تم: روشن (مطابق Z.ai)'}
              </div>
              <div className="text-[11px] text-[#5B6370] dark:text-[#9CA3AF]">
                هماهنگ‌سازی همزمان پوستهٔ اپ و پورتال chat.z.ai
              </div>
            </div>
            <span className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6]">تغییر</span>
          </button>

          <button
            type="button"
            onClick={onToggleEnhance}
            className="flex w-full items-center justify-between border-t border-[#E5E7EB]/60 px-5 py-3 text-start hover:bg-[#F7F8FA] dark:border-[#262A35] dark:hover:bg-[#1A1D24]"
          >
            <div>
              <div className="text-sm font-medium text-[#0F1115] dark:text-[#F4F5F7]">
                بهینه‌سازی نمایش موبایل
              </div>
              <div className="text-[11px] text-[#5B6370] dark:text-[#9CA3AF]">
                رفع برش تیترها، چیدمان واکنش‌گرا و راست‌به‌چپ هوشمند
              </div>
            </div>
            <span className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6]">
              {enhancedMobile ? 'روشن' : 'خاموش'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleViewport}
            className="flex w-full items-center justify-between border-t border-[#E5E7EB]/60 px-5 py-3 text-start hover:bg-[#F7F8FA] dark:border-[#262A35] dark:hover:bg-[#1A1D24]"
          >
            <div>
              <div className="text-sm font-medium text-[#0F1115] dark:text-[#F4F5F7]">
                {mobileFrame ? 'حالت نمایش: شبیه‌ساز گوشی' : 'حالت نمایش: تمام‌عرض'}
              </div>
              <div className="text-[11px] text-[#5B6370] dark:text-[#9CA3AF]">
                جابجایی بین نمای تمام‌صفحه و قاب موبایل اندروید
              </div>
            </div>
            <span className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6]">تبدیل</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onResetSession();
              onClose();
            }}
            className="flex w-full items-center justify-between border-t border-[#E5E7EB]/60 px-5 py-3 text-start hover:bg-[#FEF2F2] dark:border-[#262A35] dark:hover:bg-[#2A1215]"
          >
            <div>
              <div className="text-sm font-medium text-[#DC2626] dark:text-[#F87171]">
                بازنشانی نشست و گفتگوهای آزمایشی
              </div>
              <div className="text-[11px] text-[#5B6370] dark:text-[#9CA3AF]">
                پاک‌سازی پیام‌های فعلی و بازگشت به حالت اولیه
              </div>
            </div>
          </button>
        </div>

        <div className="border-t border-[#E5E7EB] pt-1 dark:border-[#262A35]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-center text-xs font-bold text-[#5B6370] hover:text-[#0F1115] dark:text-[#9CA3AF] dark:hover:text-[#F4F5F7]"
          >
            بستن
          </button>
        </div>
      </section>
    </div>
  );
};
