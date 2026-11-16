import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-[#393344] bg-[#1E1B29]/95 px-4 py-2 text-xs font-medium text-[#F8F6F1] shadow-xl backdrop-blur-sm"
    >
      {message}
    </div>
  );
};
