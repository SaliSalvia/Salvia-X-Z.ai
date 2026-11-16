import React, { useState } from 'react';
import type { ChatCodeBlock, ChatMessage } from '../data/zaiCatalog';
import { detectTextDirection } from '../utils/portalLogic';

interface ChatThreadProps {
  messages: ChatMessage[];
  modelLabel: string;
  onPreviewCode: (block: ChatCodeBlock) => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  modelLabel,
  onPreviewCode,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (code: string, key: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard API fallback ignored cleanly in restricted contexts
    }
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1400);
  };

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-5 px-3 py-5 sm:px-5">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const paragraphs = msg.text.split(/\n{2,}/).filter((p) => p.length > 0);
        const hasThinking = Boolean(msg.thinkingSteps?.length || msg.thinking);

        return (
          <div
            key={msg.id}
            className={`anim-fade-up flex flex-col ${isUser ? 'items-start' : 'items-stretch'}`}
          >
            <div
              className={
                isUser
                  ? 'max-w-[88%] rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-2.5 text-[14px] leading-relaxed text-[#0F1115] dark:border-[#262A35] dark:bg-[#14161B] dark:text-[#F4F5F7]'
                  : 'space-y-3 text-[14px] leading-relaxed text-[#0F1115] dark:text-[#F4F5F7]'
              }
            >
              {!isUser && (
                <div className="flex items-center gap-2 text-[11.5px] text-[#5B6370] dark:text-[#9CA3AF]">
                  <span className="font-semibold text-[#0F1115] dark:text-[#F4F5F7]" dir="ltr">
                    {modelLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{msg.timestamp}</span>
                  {msg.usedSearch && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#2563EB] dark:text-[#3B82F6]">جستجوی وب</span>
                    </>
                  )}
                  {msg.appliedSystemPrompt && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#2563EB] dark:text-[#60A5FA]">دستورالعمل سیستمی</span>
                    </>
                  )}
                </div>
              )}

              {hasThinking && (
                <details className="group rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-3.5 py-2.5 text-xs text-[#5B6370] dark:border-[#262A35] dark:bg-[#14161B] dark:text-[#9CA3AF]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold text-[#0F1115] dark:text-[#F4F5F7]">
                    <span className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#2563EB]" aria-hidden="true">
                        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                      </svg>
                      <span>مراحل تفکر مدل</span>
                    </span>
                    <span className="flex items-center gap-2 text-[11px] font-medium text-[#5B6370] dark:text-[#9CA3AF]">
                      {msg.thinkingDuration && <span className="tabular-nums">{msg.thinkingDuration}</span>}
                      {msg.thinkingSteps?.length ? (
                        <span className="tabular-nums">{msg.thinkingSteps.length} مرحله</span>
                      ) : null}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      >
                        <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                      </svg>
                    </span>
                  </summary>

                  {msg.thinkingSteps?.length ? (
                    <ol className="mt-2.5 space-y-2 border-t border-[#E5E7EB] pt-2.5 dark:border-[#262A35]">
                      {msg.thinkingSteps.map((step, stepIdx) => {
                        const stepDir = detectTextDirection(`${step.title} ${step.detail}`);
                        return (
                          <li
                            key={`${msg.id}-step-${stepIdx}`}
                            dir={stepDir}
                            style={{ animationDelay: `${stepIdx * 55}ms` }}
                            className={`anim-fade-up flex items-start gap-2.5 rounded-lg bg-white/80 px-2.5 py-2 dark:bg-[#0B0C0F]/60 ${
                              stepDir === 'rtl' ? 'text-right' : 'text-left'
                            }`}
                          >
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#EFF6FF] text-[10.5px] font-bold text-[#2563EB] tabular-nums dark:bg-[#172554] dark:text-[#93C5FD]">
                              {stepIdx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-[#0F1115] dark:text-[#F4F5F7]">
                                {step.title}
                              </div>
                              <p className="mt-0.5 leading-relaxed text-[#5B6370] dark:text-[#9CA3AF]">
                                {step.detail}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    msg.thinking && (
                      <p
                        dir={detectTextDirection(msg.thinking)}
                        className={`mt-2 border-t border-[#E5E7EB] pt-2 leading-relaxed dark:border-[#262A35] ${
                          detectTextDirection(msg.thinking) === 'rtl' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {msg.thinking}
                      </p>
                    )
                  )}
                </details>
              )}

              <div className="space-y-2">
                {paragraphs.map((para, pIdx) => {
                  const pDir = detectTextDirection(para);
                  return (
                    <p
                      key={`${msg.id}-p-${pIdx}`}
                      dir={pDir}
                      className={`whitespace-pre-wrap bidi-auto ${
                        pDir === 'rtl' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {para}
                    </p>
                  );
                })}
              </div>

              {msg.codeBlocks?.map((block, idx) => {
                const key = `${msg.id}-${idx}`;
                const copied = copiedKey === key;
                const normLang = block.lang.trim().toLowerCase();
                const isRtlDoc =
                  (normLang === 'md' || normLang === 'markdown' || normLang === 'text') &&
                  detectTextDirection(block.code) === 'rtl';
                return (
                  <div
                    key={key}
                    className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] dark:border-[#262A35] dark:bg-[#111318]"
                    dir="ltr"
                  >
                    <div className="flex h-9 items-center justify-between border-b border-[#E5E7EB] bg-[#F7F8FA] px-3 dark:border-[#262A35] dark:bg-[#14161B]">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[#5B6370] dark:text-[#9CA3AF]">
                        {block.lang} · {block.filename}
                      </span>
                      <div className="flex items-center gap-1.5" dir="rtl">
                        <button
                          type="button"
                          onClick={() => onPreviewCode(block)}
                          className="press-spring rounded-lg bg-[#0F1115] px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90 dark:bg-[#F4F5F7] dark:text-[#0B0C0F]"
                        >
                          پیش‌نمایش
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(block.code, key)}
                          className={`press-spring rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                            copied
                              ? 'border-transparent bg-[#16A34A] text-white'
                              : 'border-[#E5E7EB] bg-white text-[#0F1115] hover:bg-[#F0F2F5] dark:border-[#2C313D] dark:bg-[#1C1F26] dark:text-[#F4F5F7]'
                          }`}
                        >
                          {copied ? 'کپی شد' : 'کپی'}
                        </button>
                      </div>
                    </div>
                    <pre
                      dir={isRtlDoc ? 'rtl' : 'ltr'}
                      className={`max-h-64 overflow-x-auto p-3 text-[12.5px] leading-relaxed text-[#0F1115] dark:text-[#E5E7EB] ${
                        isRtlDoc ? 'text-right font-sans whitespace-pre-wrap' : 'text-left font-mono'
                      }`}
                    >
                      <code className={isRtlDoc ? 'font-sans' : 'font-mono'}>{block.code}</code>
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
