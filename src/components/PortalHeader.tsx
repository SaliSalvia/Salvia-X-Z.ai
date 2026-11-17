import React, { useState, useRef, useEffect } from 'react';
import { EFFORT_LEVELS, ZAI_MODELS, type EffortLevel, type ZaiModelId } from '../data/zaiCatalog';

interface PortalHeaderProps {
  activeModel: ZaiModelId;
  effort: EffortLevel;
  dark: boolean;
  mobileFrame: boolean;
  artifactsCount: number;
  systemPromptActive: boolean;
  onSelectModel: (model: ZaiModelId) => void;
  onSelectEffort: (effort: EffortLevel) => void;
  onToggleSidebar: () => void;
  onOpenSystemPrompt: () => void;
  onOpenArtifacts: () => void;
  onNewChat: () => void;
  onToggleTheme: () => void;
  onOpenMenu: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  activeModel,
  effort,
  dark,
  artifactsCount,
  systemPromptActive,
  onSelectModel,
  onSelectEffort,
  onToggleSidebar,
  onOpenSystemPrompt,
  onOpenArtifacts,
  onNewChat,
  onToggleTheme,
  onOpenMenu,
}) => {
  const [modelOpen, setModelOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modelOpen) return;
    const onDown = (ev: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(ev.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [modelOpen]);

  return (
    <header className="relative z-30 flex h-[52px] shrink-0 items-center justify-between border-b border-[#E5E7EB]/90 bg-white/90 px-2 backdrop-blur-md dark:border-[#262A35]/90 dark:bg-[#0B0C0F]/90">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="تاریخچه گفتگوها"
          className="press-spring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#0F1115] hover:bg-[#F3F4F6] focus-visible:outline-2 focus-visible:outline-[#2563EB] dark:text-[#F4F5F7] dark:hover:bg-[#1A1D24] sm:h-10 sm:w-10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v12h5V6H4zm7 0v12h9V6h-9z" />
          </svg>
        </button>

        <div className="relative min-w-0" ref={popRef}>
          <button
            type="button"
            onClick={() => setModelOpen((v) => !v)}
            aria-expanded={modelOpen}
            aria-label="انتخاب مدل GLM"
            className="press-spring flex h-10 max-w-full items-center gap-2 rounded-lg px-1.5 hover:bg-[#F3F4F6] focus-visible:outline-2 focus-visible:outline-[#2563EB] dark:hover:bg-[#1A1D24] sm:gap-2.5 sm:px-2"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0F1115] text-white dark:bg-[#F4F5F7] dark:text-[#0B0C0F]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M5 6h14v2.6L9.4 17.4H19V20H5v-2.6L14.6 8.6H5V6z" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-col items-start text-start leading-tight">
              <span className="max-w-full truncate text-[13px] font-bold text-[#0F1115] dark:text-[#F4F5F7] whitespace-nowrap sm:text-sm" dir="ltr">
                Salvia X Z.ai
              </span>
              <span className="flex max-w-[120px] items-center gap-1 text-[11px] font-medium text-[#5B6370] dark:text-[#9CA3AF] whitespace-nowrap sm:max-w-none" dir="ltr">
                <span className="truncate">{activeModel}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`shrink-0 transition-transform duration-200 ${modelOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </span>
            </span>
          </button>

          {modelOpen && (
            <div
              role="dialog"
              aria-label="انتخاب مدل و سطح استدلال"
              className="anim-pop-in absolute start-0 top-12 z-50 w-[300px] rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-lg dark:border-[#262A35] dark:bg-[#14161B]"
            >
              <div className="px-2 py-1.5 text-[11px] font-semibold text-[#5B6370] dark:text-[#9CA3AF]">
                مدل‌های رایگان پورتال
              </div>
              <div className="space-y-1">
                {ZAI_MODELS.map((m) => {
                  const selected = m.id === activeModel;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(m.id);
                        setModelOpen(false);
                      }}
                      className={`flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-start transition-colors ${
                        selected
                          ? 'bg-[#F0F2F5] dark:bg-[#20242D]'
                          : 'hover:bg-[#F7F8FA] dark:hover:bg-[#1A1D24]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#0F1115] dark:text-[#F4F5F7]" dir="ltr">
                            {m.label}
                          </span>
                          <span className="text-[11px] text-[#2563EB] dark:text-[#3B82F6]">
                            {m.tier}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#5B6370] dark:text-[#9CA3AF]">
                          {m.summary}
                        </p>
                      </div>
                      {selected && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0 text-[#2563EB]" aria-hidden="true">
                          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 border-t border-[#E5E7EB] pt-2 dark:border-[#262A35]">
                <div className="mb-1.5 px-2 text-[11px] font-semibold text-[#5B6370] dark:text-[#9CA3AF]">
                  سطح استدلال (Effort)
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#F0F2F5] p-1 dark:bg-[#1C1F26]">
                  {EFFORT_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onSelectEffort(lvl)}
                      className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        effort === lvl
                          ? 'bg-white text-[#0F1115] shadow-xs dark:bg-[#0B0C0F] dark:text-[#F4F5F7]'
                          : 'text-[#5B6370] hover:text-[#0F1115] dark:text-[#9CA3AF] dark:hover:text-[#F4F5F7]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0 sm:gap-0.5">
        <button
          type="button"
          onClick={onOpenSystemPrompt}
          aria-label="پرامپت سیستمی (اولویت بالا)"
          title="پرامپت سیستمی (اولویت بالا)"
          className={`press-spring relative inline-flex h-9 w-9 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-[#2563EB] sm:h-10 sm:w-10 ${
            systemPromptActive
              ? 'bg-[#EFF6FF] text-[#2563EB] dark:bg-[#172554]/60 dark:text-[#60A5FA]'
              : 'text-[#0F1115] hover:bg-[#F3F4F6] dark:text-[#F4F5F7] dark:hover:bg-[#1A1D24]'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onOpenArtifacts}
          aria-label="فایل‌های ساخته‌شده"
          className="press-spring relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#0F1115] hover:bg-[#F3F4F6] focus-visible:outline-2 focus-visible:outline-[#2563EB] dark:text-[#F4F5F7] dark:hover:bg-[#1A1D24] sm:h-10 sm:w-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
          </svg>
          {artifactsCount > 0 && (
            <span className="anim-pill-in absolute end-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold leading-none text-white tabular-nums">
              {artifactsCount > 9 ? '9+' : artifactsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onNewChat}
          aria-label="گفتگوی جدید"
          className="press-spring inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#0F1115] hover:bg-[#F3F4F6] focus-visible:outline-2 focus-visible:outline-[#2563EB] dark:text-[#F4F5F7] dark:hover:bg-[#1A1D24] sm:h-10 sm:w-10"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={dark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
          className="press-spring inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#0F1115] hover:bg-[#F3F4F6] focus-visible:outline-2 focus-visible:outline-[#2563EB] dark:text-[#F4F5F7] dark:hover:bg-[#1A1D24] sm:h-10 sm:w-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="منوی امکانات Z.ai"
          className="press-spring inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#0F1115] hover:bg-[#F3F4F6] focus-visible:outline-2 focus-visible:outline-[#2563EB] dark:text-[#F4F5F7] dark:hover:bg-[#1A1D24] sm:h-10 sm:w-10"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>
    </header>
  );
};
