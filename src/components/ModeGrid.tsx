import React from 'react';
import { WORKSPACE_MODES, type WorkspaceMode } from '../data/zaiCatalog';

interface ModeGridProps {
  enhancedMobile: boolean;
  onSelectMode: (mode: WorkspaceMode) => void;
}

const MODE_PREVIEWS: Record<string, React.ReactNode> = {
  fullstack: (
    <div className="flex h-12 w-full flex-col justify-between rounded-lg border border-[#E5E7EB] bg-white p-2 dark:border-[#262A35] dark:bg-[#0B0C0F]">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-6 rounded bg-[#0F1115] dark:bg-[#F4F5F7]" />
        <span className="h-1.5 w-3 rounded bg-[#CBD5E1] dark:bg-[#353B49]" />
      </div>
      <div className="grid grid-cols-3 gap-1">
        <span className="h-3 rounded bg-[#EFF6FF] dark:bg-[#172554]" />
        <span className="h-3 rounded bg-[#F0F2F5] dark:bg-[#1C1F26]" />
        <span className="h-3 rounded bg-[#F0F2F5] dark:bg-[#1C1F26]" />
      </div>
    </div>
  ),
  writing: (
    <div className="flex h-12 w-full flex-col justify-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white p-2 dark:border-[#262A35] dark:bg-[#0B0C0F]">
      <span className="h-1.5 w-4/5 rounded bg-[#0F1115]/80 dark:bg-[#F4F5F7]/80" />
      <span className="h-1.5 w-3/5 rounded bg-[#CBD5E1] dark:bg-[#353B49]" />
      <span className="h-1.5 w-2/3 rounded bg-[#2563EB]/60" />
    </div>
  ),
  data: (
    <div className="flex h-12 w-full items-end gap-1.5 rounded-lg border border-[#E5E7EB] bg-white p-2 dark:border-[#262A35] dark:bg-[#0B0C0F]">
      <span className="h-3 flex-1 origin-bottom rounded-xs bg-[#CBD5E1] transition-transform duration-200 group-hover:scale-y-110 dark:bg-[#353B49]" />
      <span className="h-6 flex-1 origin-bottom rounded-xs bg-[#2563EB]/70 transition-transform duration-200 delay-75 group-hover:scale-y-110" />
      <span className="h-4 flex-1 origin-bottom rounded-xs bg-[#CBD5E1] transition-transform duration-200 delay-100 group-hover:scale-y-110 dark:bg-[#353B49]" />
      <span className="h-8 flex-1 origin-bottom rounded-xs bg-[#2563EB] transition-transform duration-200 delay-150 group-hover:scale-y-110" />
    </div>
  ),
  ppt: (
    <div className="flex h-12 w-full items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#0F1115] p-2 dark:border-[#262A35] dark:bg-[#1C1F26]">
      <div className="text-center">
        <div className="text-[9px] font-bold tracking-wider text-white">SLIDE DECK</div>
        <div className="mx-auto mt-1 h-0.5 w-8 origin-center bg-[#3B82F6] transition-transform duration-200 group-hover:scale-x-125" />
      </div>
    </div>
  ),
  website: (
    <div className="flex h-12 w-full flex-col justify-between rounded-lg border border-[#E5E7EB] bg-white p-2 dark:border-[#262A35] dark:bg-[#0B0C0F]">
      <div className="h-2 w-10 rounded bg-[#0F1115] dark:bg-[#F4F5F7]" />
      <div className="flex gap-1.5">
        <span className="h-4 flex-1 rounded bg-[#F0F2F5] dark:bg-[#1C1F26]" />
        <span className="h-4 w-6 rounded bg-[#2563EB]/80 transition-transform duration-200 group-hover:scale-105" />
      </div>
    </div>
  ),
  scheduled: (
    <div className="flex h-12 w-full flex-col justify-center gap-1 rounded-lg border border-[#E5E7EB] bg-white p-2 dark:border-[#262A35] dark:bg-[#0B0C0F]">
      <div className="flex items-center justify-between text-[9px] text-[#5B6370] dark:text-[#9CA3AF]">
        <span>۰۸:۰۰</span>
        <span className="h-1.5 w-10 rounded bg-[#2563EB]/70" />
      </div>
      <div className="flex items-center justify-between text-[9px] text-[#5B6370] dark:text-[#9CA3AF]">
        <span>۱۶:۳۰</span>
        <span className="h-1.5 w-8 rounded bg-[#CBD5E1] dark:bg-[#353B49]" />
      </div>
    </div>
  ),
};

export const ModeGrid: React.FC<ModeGridProps> = ({ enhancedMobile, onSelectMode }) => {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-[680px] flex-col items-center justify-center px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-6 text-center anim-fade-up">
          <p className="text-xs font-medium text-[#2563EB] dark:text-[#3B82F6]">
            پورتال رایگان مدل‌های GLM-5.3 · بدون نیاز به API
          </p>
          <h1
            className={`mt-2 font-bold text-[#0F1115] dark:text-[#F4F5F7] ${
              enhancedMobile
                ? 'text-xl sm:text-2xl leading-snug text-balance'
                : 'text-2xl whitespace-nowrap overflow-hidden text-ellipsis max-w-[290px] sm:max-w-none'
            }`}
          >
            هر چه تصور کنید بسازید
          </h1>
          <p className="mt-1.5 text-xs text-[#5B6370] dark:text-[#9CA3AF]">
            حالت کاری را انتخاب کنید یا مستقیم گفتگوی خود را بنویسید
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {WORKSPACE_MODES.map((mode, idx) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode)}
              style={{ animationDelay: `${Math.min(idx * 45, 225)}ms` }}
              className="anim-fade-up press-spring group flex flex-col items-stretch gap-2 rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-2.5 text-start hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-[#2563EB] dark:border-[#262A35] dark:bg-[#14161B] dark:hover:border-[#353B49] dark:hover:bg-[#1A1D24]"
            >
              <div className="transition-transform duration-200 group-hover:-translate-y-0.5">
                {MODE_PREVIEWS[mode.id]}
              </div>
              <div className="px-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[13px] font-semibold text-[#0F1115] dark:text-[#F4F5F7] whitespace-nowrap">
                    {mode.titleFa}
                  </span>
                  <span className="text-[10.5px] text-[#5B6370] dark:text-[#9CA3AF]" dir="ltr">
                    {mode.englishName}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-[#5B6370] dark:text-[#9CA3AF]">
                  {mode.subtitleFa}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };
