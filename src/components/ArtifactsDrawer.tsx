import React from 'react';
import type { ConversationArtifact } from '../utils/portalLogic';
import type { ChatCodeBlock } from '../data/zaiCatalog';

interface ArtifactsDrawerProps {
  open: boolean;
  artifacts: ConversationArtifact[];
  onPreviewArtifact: (block: ChatCodeBlock) => void;
  onClose: () => void;
}

export const ArtifactsDrawer: React.FC<ArtifactsDrawerProps> = ({
  open,
  artifacts,
  onPreviewArtifact,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="بستن پنل کشویی فایل‌ها"
        onClick={onClose}
        className="anim-fade flex-1 bg-[#0F1115]/45 backdrop-blur-[2px] dark:bg-black/65"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="فایل‌ها و پیش‌نمایش‌های ساخته‌شده"
        className="anim-sheet-up flex max-h-[76vh] w-full flex-col rounded-t-[20px] border-t border-[#E5E7EB] bg-white shadow-2xl dark:border-[#262A35] dark:bg-[#14161B]"
      >
        <div className="flex justify-center py-2">
          <span className="h-1 w-10 rounded-full bg-[#D1D5DB] dark:bg-[#353B49]" />
        </div>

        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 pb-3 dark:border-[#262A35]">
          <div>
            <h2 className="text-sm font-bold text-[#0F1115] dark:text-[#F4F5F7]">
              فایل‌ها و خروجی‌های ساخته‌شده
            </h2>
            <p className="mt-0.5 text-[11.5px] text-[#5B6370] dark:text-[#9CA3AF]">
              انتخاب هر فایل برای باز شدن فوری در پنل پیش‌نمایش کشویی
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5B6370] hover:bg-[#F3F4F6] dark:text-[#9CA3AF] dark:hover:bg-[#20242D]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {artifacts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E5E7EB] px-4 py-8 text-center text-xs text-[#5B6370] dark:border-[#262A35] dark:text-[#9CA3AF]">
              هنوز فایل یا بلوک کدی در گفتگوی فعلی تولید نشده است. از دکمه‌های حالت یا درخواست ساخت HTML / Markdown / کد استفاده کنید.
            </div>
          ) : (
            <ul className="space-y-2">
              {artifacts.map((item, idx) => {
                const lineCount = item.code.split('\n').length;
                return (
                  <li
                    key={item.id}
                    style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
                    className="anim-fade-up"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onPreviewArtifact(item);
                        onClose();
                      }}
                      className="press-spring flex w-full items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-3 text-start hover:border-[#2563EB] hover:bg-white dark:border-[#262A35] dark:bg-[#1A1D24] dark:hover:border-[#3B82F6] dark:hover:bg-[#20242D]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white font-mono text-[11px] font-bold uppercase text-[#0F1115] dark:border-[#2C313D] dark:bg-[#111318] dark:text-[#F4F5F7]">
                          {item.lang.slice(0, 4)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-[#0F1115] dark:text-[#F4F5F7]" dir="ltr">
                            {item.filename}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#5B6370] dark:text-[#9CA3AF]">
                            <span className="tabular-nums">فایل #{idx + 1}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{lineCount} خط</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-[#0F1115] px-2.5 py-1.5 text-[11px] font-semibold text-white dark:bg-[#F4F5F7] dark:text-[#0B0C0F]">
                        پیش‌نمایش
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};
