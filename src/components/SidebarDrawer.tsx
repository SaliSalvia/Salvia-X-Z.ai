import React from 'react';
import type { Conversation } from '../data/zaiCatalog';

interface SidebarDrawerProps {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  searchQuery: string;
  signedIn: boolean;
  onSearchChange: (q: string) => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
  onSyncHistory: () => void;
  onToggleSignIn: () => void;
  onClose: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  open,
  conversations,
  activeId,
  searchQuery,
  signedIn,
  onSearchChange,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  onSyncHistory,
  onToggleSignIn,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <aside
        aria-label="تاریخچه گفتگوهای Z.ai"
        className="anim-drawer-rtl relative z-10 flex h-full w-[280px] max-w-[82vw] flex-col border-e border-[#E5E7EB] bg-[#F7F8FA] shadow-2xl dark:border-[#262A35] dark:bg-[#14161B]"
      >
        <div className="flex h-[52px] items-center justify-between border-b border-[#E5E7EB] px-4 dark:border-[#262A35]">
          <span className="text-sm font-bold text-[#0F1115] dark:text-[#F4F5F7]">
            گفتگوهای ذخیره شده
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن نوار تاریخچه"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5B6370] hover:bg-[#E5E7EB]/60 dark:text-[#9CA3AF] dark:hover:bg-[#222630]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F1115] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-[#F4F5F7] dark:text-[#0B0C0F]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              <span>گفتگوی جدید</span>
            </button>
            <button
              type="button"
              onClick={onSyncHistory}
              aria-label="همگام‌سازی تاریخچه با سایت"
              className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#0F1115] transition-colors hover:bg-[#F0F2F5] dark:border-[#262A35] dark:bg-[#1C1F26] dark:text-[#F4F5F7] whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              <span>همگام‌سازی</span>
            </button>
          </div>

          <div>
            <label htmlFor="chat-search" className="sr-only">
              جستجو در گفتگوها
            </label>
            <input
              id="chat-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="جستجو در عنوان یا پیام‌ها..."
              className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#0F1115] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none dark:border-[#262A35] dark:bg-[#0B0C0F] dark:text-[#F4F5F7]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-[#5B6370] dark:text-[#9CA3AF]">
              هیچ گفتگویی مطابق جستجو پیدا نشد.
            </div>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conv) => {
                const active = conv.id === activeId;
                return (
                  <li key={conv.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectConversation(conv.id);
                        onClose();
                      }}
                      className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 text-start transition-colors ${
                        active
                          ? 'bg-white border border-[#E5E7EB] dark:bg-[#1C1F26] dark:border-[#262A35]'
                          : 'hover:bg-white/70 dark:hover:bg-[#1A1D24]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {conv.pinned && (
                          <span className="text-[10.5px] font-semibold text-[#2563EB] dark:text-[#60A5FA]" title="پین‌شده">
                            ★
                          </span>
                        )}
                        <span className="truncate text-[13px] font-medium text-[#0F1115] dark:text-[#F4F5F7]">
                          {conv.title}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#5B6370] dark:text-[#9CA3AF]">
                        <span dir="ltr">{conv.model}</span>
                        <span aria-hidden="true">·</span>
                        <span>{conv.updatedAt}</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteConversation(conv.id)}
                      aria-label={`حذف گفتگوی ${conv.title}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#FEE2E2] hover:text-[#DC2626] dark:hover:bg-[#3B1818]"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-[#E5E7EB] p-3 dark:border-[#262A35]">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-2.5 border border-[#E5E7EB] dark:bg-[#1A1D24] dark:border-[#262A35]">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F1115] text-xs font-bold text-white dark:bg-[#F4F5F7] dark:text-[#0B0C0F]">
                {signedIn ? 'S' : 'G'}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-[#0F1115] dark:text-[#F4F5F7]">
                  {signedIn ? 'حساب کاربری Z.ai' : 'حالت مهمان'}
                </div>
                <div className="truncate text-[11px] text-[#5B6370] dark:text-[#9CA3AF] tabular-nums">
                  {signedIn ? `متصل · ${conversations.length} گفتگو` : 'ورود با ایمیل یا گوگل'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSignIn}
              className="shrink-0 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-[11px] font-semibold text-[#0F1115] hover:bg-[#F3F4F6] dark:border-[#353B49] dark:text-[#F4F5F7] dark:hover:bg-[#222630] whitespace-nowrap"
            >
              {signedIn ? 'خروج' : 'ورود'}
            </button>
          </div>
        </div>
      </aside>
      <button
        type="button"
        aria-label="بستن پس‌زمینه"
        onClick={onClose}
        className="anim-fade flex-1 bg-[#0F1115]/40 backdrop-blur-[2px] dark:bg-black/60"
      />
    </div>
  );
};
