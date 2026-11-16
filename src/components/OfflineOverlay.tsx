import React from 'react';

interface OfflineOverlayProps {
  visible: boolean;
  onRetry: () => void;
}

export const OfflineOverlay: React.FC<OfflineOverlayProps> = ({ visible, onRetry }) => {
  if (!visible) return null;

  return (
    <div
      role="alert"
      data-testid="offline-overlay"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#08070D] p-8 text-center"
    >
      <img
        src="/assets/sali_logo_icon.png"
        alt=""
        className="h-16 w-16 object-contain opacity-40"
      />
      <h2 className="mt-5 text-lg font-bold text-[#F8F6F1]">
        اتصال برقرار نشد
      </h2>
      <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#B9B4C1]">
        اینترنت دستگاه را بررسی کنید و دوباره تلاش کنید.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 flex h-[46px] min-w-[150px] items-center justify-center rounded-xl bg-[#6C4BE0] px-7 text-sm font-bold text-[#F8F6F1] transition-colors hover:bg-[#7D5EEF] active:scale-[0.98] cursor-pointer"
      >
        تلاش مجدد
      </button>

      <a
        href="https://chat.z.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 flex h-[44px] min-w-[150px] items-center justify-center rounded-xl border border-[#393344] bg-[#1E1B29] px-5 text-[13px] text-[#9E86FF] transition-colors hover:bg-[#2A1F4D]"
      >
        باز کردن در مرورگر
      </a>
    </div>
  );
};
