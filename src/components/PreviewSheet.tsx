import React, { useMemo, useState } from 'react';
import { previewModeForLang, safeFileExtension } from '../utils/portalLogic';
import { highlightCode } from '../utils/highlight';
import { mdToHtml } from '../utils/markdown';

export interface ActivePreview {
  filename: string;
  lang: string;
  code: string;
  minimized: boolean;
}

interface PreviewSheetProps {
  preview: ActivePreview | null;
  onExpandToggle: () => void;
  expanded: boolean;
  onMinimize: () => void;
  onRestore: () => void;
  onClose: () => void;
}

export const PreviewSheet: React.FC<PreviewSheetProps> = ({
  preview,
  expanded,
  onExpandToggle,
  onMinimize,
  onRestore,
  onClose,
}) => {
  const [tab, setTab] = useState<'result' | 'code'>('result');
  const [wrap, setWrap] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewLang = preview?.lang ?? '';
  const previewCode = preview?.code ?? '';
  const mode = previewModeForLang(previewLang);

  const highlightedHtml = useMemo(
    () => (preview ? highlightCode(previewCode, previewLang) : ''),
    [preview, previewCode, previewLang]
  );
  const renderedMarkdown = useMemo(
    () => (preview && mode === 'md' ? mdToHtml(previewCode) : ''),
    [preview, mode, previewCode]
  );

  if (!preview) return null;

  const hasResult = mode === 'html' || mode === 'md';
  const activeTab = hasResult ? tab : 'code';

  if (preview.minimized) {
    return (
      <div className="anim-pill-in fixed bottom-36 start-4 z-40 flex items-center gap-1 rounded-full border border-[#D1D5DB] bg-white/95 py-1.5 pe-1.5 ps-3.5 shadow-lg backdrop-blur-md dark:border-[#353B49] dark:bg-[#181B22]/95">
        <button
          type="button"
          onClick={onRestore}
          className="flex items-center gap-2 text-xs font-medium text-[#0F1115] dark:text-[#F4F5F7]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
          </svg>
          <span className="max-w-[150px] truncate" dir="ltr">
            {preview.filename}
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن پیش‌نمایش جمع‌شده"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#5B6370] hover:bg-[#F0F2F5] dark:text-[#9CA3AF] dark:hover:bg-[#222630]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
    );
  }

  const lines = preview.code.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview.code);
    } catch {
      // Ignore in headless contexts
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleDownload = () => {
    const ext = safeFileExtension(preview.lang);
    const blob = new Blob([preview.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = preview.filename.includes('.') ? preview.filename : `salix-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="جمع کردن پنل پیش‌نمایش"
        onClick={onMinimize}
        className="anim-fade flex-1 bg-[#0F1115]/45 backdrop-blur-[2px] dark:bg-black/65"
      />
      <section
        aria-label={`پیش‌نمایش فایل ${preview.filename}`}
        className={`anim-sheet-up flex w-full flex-col rounded-t-[20px] border-t border-[#E5E7EB] bg-white shadow-2xl transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-[#262A35] dark:bg-[#14161B] ${
          expanded ? 'h-[92vh]' : 'h-[64vh]'
        }`}
      >
        <div className="flex justify-center py-2">
          <span className="h-1 w-10 rounded-full bg-[#D1D5DB] dark:bg-[#353B49]" />
        </div>

        <div className="flex h-11 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-sm font-bold text-[#0F1115] dark:text-[#F4F5F7]" dir="ltr">
              {preview.filename}
            </h2>
            <span className="rounded-md bg-[#F0F2F5] px-2 py-0.5 font-mono text-[11px] text-[#5B6370] dark:bg-[#20242D] dark:text-[#9CA3AF]">
              {preview.lang}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onExpandToggle}
              aria-label={expanded ? 'نمای نیم‌صفحه' : 'نمای تمام‌صفحه'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5B6370] hover:bg-[#F3F4F6] dark:text-[#9CA3AF] dark:hover:bg-[#20242D]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onMinimize}
              aria-label="جمع کردن (ادامه چت)"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5B6370] hover:bg-[#F3F4F6] dark:text-[#9CA3AF] dark:hover:bg-[#20242D]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6 19h12v-2H6v2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن پیش‌نمایش"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5B6370] hover:bg-[#F3F4F6] dark:text-[#9CA3AF] dark:hover:bg-[#20242D]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] px-4 py-2 dark:border-[#262A35]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-xl bg-[#0F1115] px-3.5 py-1.5 text-xs font-semibold text-white dark:bg-[#F4F5F7] dark:text-[#0B0C0F] whitespace-nowrap"
            >
              {copied ? 'کپی شد' : 'کپی کد'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-3.5 py-1.5 text-xs font-medium text-[#0F1115] hover:bg-[#F0F2F5] dark:border-[#262A35] dark:bg-[#1C1F26] dark:text-[#F4F5F7] whitespace-nowrap"
            >
              ذخیره فایل
            </button>
          </div>

          <div className="flex items-center gap-2">
            {hasResult && (
              <div className="flex items-center rounded-lg bg-[#F0F2F5] p-0.5 dark:bg-[#1C1F26]">
                <button
                  type="button"
                  onClick={() => setTab('result')}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    activeTab === 'result'
                      ? 'bg-white text-[#0F1115] shadow-xs dark:bg-[#0B0C0F] dark:text-[#F4F5F7]'
                      : 'text-[#5B6370] dark:text-[#9CA3AF]'
                  }`}
                >
                  نتیجه
                </button>
                <button
                  type="button"
                  onClick={() => setTab('code')}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    activeTab === 'code'
                      ? 'bg-white text-[#0F1115] shadow-xs dark:bg-[#0B0C0F] dark:text-[#F4F5F7]'
                      : 'text-[#5B6370] dark:text-[#9CA3AF]'
                  }`}
                >
                  کد
                </button>
              </div>
            )}
            {activeTab === 'code' && (
              <button
                type="button"
                onClick={() => setWrap((w) => !w)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
                  wrap
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-[#E5E7EB] text-[#5B6370] dark:border-[#262A35] dark:text-[#9CA3AF]'
                }`}
              >
                شکستن خطوط
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0C0F]">
          {activeTab === 'result' && mode === 'html' ? (
            <iframe
              title="HTML Preview"
              sandbox="allow-scripts"
              srcDoc={preview.code}
              className="h-full w-full border-0 bg-white"
            />
          ) : activeTab === 'result' && mode === 'md' ? (
            <div
              className="md-render h-full overflow-auto p-4 text-sm text-[#0F1115] dark:text-[#E5E7EB] bidi-auto"
              dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
            />
          ) : (
            <div className="flex h-full overflow-auto font-mono text-[12.5px] leading-relaxed" dir="ltr">
              {!wrap && (
                <div className="select-none border-r border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 text-right text-[#94A3B8] tabular-nums dark:border-[#262A35] dark:bg-[#0B0C0F]">
                  {lines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              )}
              <pre
                className={`flex-1 p-3 text-left text-[#0F1115] dark:text-[#E5E7EB] ${
                  wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                }`}
              >
                <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
              </pre>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
