import React from 'react';

interface IntroOverlayProps {
  visible: boolean;
  fading: boolean;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ visible, fading }) => {
  if (!visible) return null;

  return (
    <div
      data-testid="intro-overlay"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08070D] transition-opacity duration-300 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center">
        <img
          src="/assets/sali_logo_splash.png"
          alt="لوگوی SaliX-Z"
          className="h-[108px] w-[108px] object-contain animate-[fadeIn_420ms_ease-out]"
        />
        <h1 className="mt-5 text-[28px] font-bold tracking-[0.06em] text-[#F8F6F1]">
          SaliX-Z
        </h1>
        <p className="mt-2 text-xs text-[#B9B4C1]">
          دستیار هوشمند — چت رایگان Z.ai
        </p>
        <div
          aria-label="در حال بارگذاری"
          className="mt-6 h-[26px] w-[26px] animate-spin rounded-full border-[3px] border-[#393344] border-t-[#6C4BE0]"
        />
      </div>
    </div>
  );
};
