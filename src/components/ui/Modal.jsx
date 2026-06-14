import React from 'react';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl z-10 max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 pb-4">{children}</div>
        {footer && <div className="px-5 pb-5 flex gap-3 justify-end border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">{footer}</div>}
      </div>
    </div>
  );
}
