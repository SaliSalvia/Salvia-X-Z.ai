import React from 'react';
import { IconArrowDown, IconMenu } from './Icons';

interface ToolbarProps {
  immersive: boolean;
  progress: number;
  onOpenMenu: () => void;
  onExitImmersive: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  immersive,
  progress,
  onOpenMenu,
  onExitImmersive,
}) => {
  return (
    <>
      {!immersive && (
        <header
          className="relative z-20 flex-none shadow-md"
          style={{
            background: 'linear-gradient(180deg, #2A1F4D 0%, #08070D 100%)',
          }}
        >
          <div className="flex h-[58px] items-center px-3 pe-1.5">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#6C4BE0] bg-[#2A1F4D]">
              <img
                src="/assets/sali_logo_icon.png"
                alt=""
                className="h-6 w-6 object-contain"
              />
            </div>

            <div className="ms-2.5 flex flex-1 flex-col">
              <span className="text-[15px] font-bold tracking-wide text-[#F8F6F1]">
                SaliX-Z
              </span>
              <span
                dir="ltr"
                className="mt-0.5 w-fit text-[10px] text-[#9E86FF]"
              >
                chat.z.ai · GLM
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="منوی پوسته"
              className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-[#F8F6F1] transition-colors hover:bg-white/10 active:bg-white/15 cursor-pointer"
            >
              <IconMenu className="h-6 w-6" />
            </button>
          </div>
          <div className="h-px w-full bg-white/[0.08]" />
        </header>
      )}

      {/* Top 3px loading bar matching ProgressBar in activity_main.xml */}
      {progress > 0 && progress < 100 && (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative z-20 h-[3px] w-full flex-none bg-[#12101A]"
        >
          <div
            className="h-full bg-[#6C4BE0] transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Small floating handle to bring top bar back in immersive mode */}
      {immersive && (
        <button
          type="button"
          onClick={onExitImmersive}
          aria-label="نمایش نوار بالا"
          className="fixed top-2 start-2 z-30 flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#9E86FF] bg-[#2A1F4D] text-[#F8F6F1] shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <IconArrowDown className="h-5 w-5" />
        </button>
      )}
    </>
  );
};
