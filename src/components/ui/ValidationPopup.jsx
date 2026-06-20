import React, { useEffect, useState } from 'react';

export default function ValidationPopup({ isOpen, onClose, title, message, icon = '⚠️', duration = 4000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      if (duration > 0) {
        const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [isOpen, duration, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div
        className={`relative bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-xl z-10 overflow-hidden transition-all duration-300 ${visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
      >
        <div className="p-6 text-center">
          <div className="text-4xl mb-3 animate-bounce">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>
        <div className="px-6 pb-5">
          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
