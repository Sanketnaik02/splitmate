import React from 'react';

export default function BottomSheet({ isOpen, onClose, children, title }) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl px-5 pt-3 pb-8 animate-slide-up z-10">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        {title && <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
