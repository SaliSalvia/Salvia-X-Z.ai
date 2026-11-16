import React, { useState } from 'react';
import {
  IconArrowDown,
  IconDelete,
  IconDesktop,
  IconExpand,
  IconInfo,
  IconMobile,
  IconOpenExt,
  IconRefresh,
} from './Icons';

interface MenuSheetProps {
  open: boolean;
  desktopMode: boolean;
  immersive: boolean;
  versionName: string;
  onClose: () => void;
  onRefresh: () => void;
  onToggleDesktop: () => void;
  onToggleImmersive: () => void;
  onClearData: () => void;
}

export const MenuSheet: React.FC<MenuSheetProps> = ({
  open,
  desktopMode,
  immersive,
  versionName,
  onClose,
  onRefresh,
  onToggleDesktop,
  onToggleImmersive,
  onClearData,
}) => {
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  if (!open && !confirmClearOpen && !aboutOpen) return null;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#08070D]/70"
          onClick={onClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="منوی پوسته"
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-in w-full max-w-2xl rounded-t-[20px] border border-b-0 border-[#393344] bg-[#12101A] pt-2.5 pb-2.5 shadow-2xl"
          >
            <div className="px-5 pb-2 text-[11px] font-bold tracking-wider text-[#9E86FF]">
              منوی پوسته
            </div>

            <div className="flex flex-col">
              {/* Refresh */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRefresh();
                }}
                className="flex w-full items-center px-5 py-3 text-start transition-colors hover:bg-white/[0.04] cursor-pointer"
              >
                <IconRefresh className="h-[22px] w-[22px] flex-none text-[#F8F6F1]" />
                <div className="ms-4 flex flex-col">
                  <span className="text-sm text-[#F8F6F1]">بازآوری صفحه</span>
                  <span className="mt-0.5 text-[11px] text-[#B9B4C1]">
                    بارگذاری دوباره صفحهٔ چت
                  </span>
                </div>
              </button>
              <div className="ms-[58px] h-px bg-white/[0.07]" />

              {/* Desktop / Mobile */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleDesktop();
                }}
                className="flex w-full items-center px-5 py-3 text-start transition-colors hover:bg-white/[0.04] cursor-pointer"
              >
                {desktopMode ? (
                  <IconMobile className="h-[22px] w-[22px] flex-none text-[#F8F6F1]" />
                ) : (
                  <IconDesktop className="h-[22px] w-[22px] flex-none text-[#F8F6F1]" />
                )}
                <div className="ms-4 flex flex-col">
                  <span className="text-sm text-[#F8F6F1]">
                    {desktopMode ? 'حالت موبایل' : 'حالت دسکتاپ'}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#B9B4C1]">
                    نمای دسکتاپ با عرض کامل صفحه
                  </span>
                </div>
              </button>
              <div className="ms-[58px] h-px bg-white/[0.07]" />

              {/* Immersive */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleImmersive();
                }}
                className="flex w-full items-center px-5 py-3 text-start transition-colors hover:bg-white/[0.04] cursor-pointer"
              >
                {immersive ? (
                  <IconArrowDown className="h-[22px] w-[22px] flex-none text-[#F8F6F1]" />
                ) : (
                  <IconExpand className="h-[22px] w-[22px] flex-none text-[#F8F6F1]" />
                )}
                <div className="ms-4 flex flex-col">
                  <span className="text-sm text-[#F8F6F1]">
                    {immersive ? 'نمایش نوار بالا' : 'نمایش تمام‌صفحه'}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#B9B4C1]">
                    پنهان‌کردن نوار بالا و نوارهای سیستم
                  </span>
                </div>
              </button>
              <div className="ms-[58px] h-px bg-white/[0.07]" />

              {/* Open in Browser */}
              <a
                href="https://chat.z.ai"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex w-full items-center px-5 py-3 text-start transition-colors hover:bg-white/[0.04]"
              >
                <IconOpenExt className="h-[22px] w-[22px] flex-none text-[#F8F6F1]" />
                <div className="ms-4 flex flex-col">
                  <span className="text-sm text-[#F8F6F1]">باز کردن در مرورگر</span>
                  <span className="mt-0.5 text-[11px] text-[#B9B4C1]">
                    ادامه در مرورگر پیش‌فرض
                  </span>
                </div>
              </a>
              <div className="ms-[58px] h-px bg-white/[0.07]" />

              {/* Clear Data */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setConfirmClearOpen(true);
                }}
                className="flex w-full items-center px-5 py-3 text-start transition-colors hover:bg-white/[0.04] cursor-pointer"
              >
                <IconDelete className="h-[22px] w-[22px] flex-none text-[#E25B5B]" />
                <div className="ms-4 flex flex-col">
                  <span className="text-sm text-[#E25B5B]">
                    پاک کردن کوکی و داده‌ها
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#B9B4C1]">
                    خروج و پاک‌کردن کوکی‌ها و کش
                  </span>
                </div>
              </button>
              <div className="ms-[58px] h-px bg-white/[0.07]" />

              {/* About */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setAboutOpen(true);
                }}
                className="flex w-full items-center px-5 py-3 text-start transition-colors hover:bg-white/[0.04] cursor-pointer"
              >
                <IconInfo className="h-[22px] w-[22px] flex-none text-[#F8F6F1]" />
                <div className="ms-4 flex flex-col">
                  <span className="text-sm text-[#F8F6F1]">دربارهٔ SaliX-Z</span>
                  <span className="mt-0.5 text-[11px] text-[#B9B4C1]">
                    نسخه {versionName}
                  </span>
                </div>
              </button>
            </div>

            <div className="mt-1.5 h-px w-full bg-white/[0.08]" />

            <button
              type="button"
              onClick={onClose}
              className="flex h-[50px] w-full items-center justify-center text-[13px] text-[#B9B4C1] transition-colors hover:bg-white/[0.04] cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* Clear data confirmation dialog */}
      {confirmClearOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08070D]/75 p-4"
          onClick={() => setConfirmClearOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-data-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[#393344] bg-[#12101A] p-5 shadow-2xl"
          >
            <h3 id="clear-data-title" className="text-base font-bold text-[#F8F6F1]">
              پاک کردن کوکی و داده‌ها
            </h3>
            <p className="mt-2.5 text-[13px] leading-6 text-[#B9B4C1]">
              همهٔ کوکی‌ها و داده‌های ورود از این پوسته پاک می‌شود. مطمئن هستید؟
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="rounded-lg border border-[#393344] bg-[#1E1B29] px-4 py-2 text-xs text-[#B9B4C1] hover:text-[#F8F6F1] cursor-pointer"
              >
                لغو
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmClearOpen(false);
                  onClearData();
                }}
                className="rounded-lg bg-[#E25B5B] px-4 py-2 text-xs font-bold text-white hover:bg-[#d14c4c] cursor-pointer"
              >
                بستن و پاک‌کردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About dialog */}
      {aboutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08070D]/75 p-4"
          onClick={() => setAboutOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[#393344] bg-[#12101A] p-5 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#6C4BE0] bg-[#2A1F4D]">
                <img
                  src="/assets/sali_logo_icon.png"
                  alt=""
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div>
                <h3 id="about-title" className="text-base font-bold text-[#F8F6F1]">
                  SaliX-Z
                </h3>
                <p className="text-xs text-[#9E86FF]">نسخه {versionName}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 text-[13px] leading-6 text-[#B9B4C1]">
              <p>
                پوستهٔ بهینه برای chat.z.ai — بدون واسط و بدون سرور میانی؛ مستقیم از وب‌سایت رسمی استفاده می‌کند.
              </p>
              <p>
                چگونه کار می‌کند: وب‌سایت با هویت بصری Sali-ZZ اجرا می‌شود و دسترسی رایگان به مدل‌های GLM همان تجربهٔ مرورگر است.
              </p>
              <p>
                سامانهٔ پیش‌نمایش فایل، خروجی‌های کد و فایل مدل‌ها را بهینه برای موبایل و به‌صورت قابل جمع‌شدن نمایش می‌دهد.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                className="rounded-lg bg-[#6C4BE0] px-5 py-2 text-xs font-bold text-[#F8F6F1] hover:bg-[#7D5EEF] cursor-pointer"
              >
                تأیید
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
