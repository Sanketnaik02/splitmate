export default function ConfirmDialog({ isOpen, onClose, title, message, confirmLabel = 'Confirm', onConfirm, variant = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-xl z-10 p-6 text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${variant === 'danger' ? 'bg-red-100' : 'bg-gray-100'}`}>
          <span className="text-xl">{variant === 'danger' ? '⚠️' : 'ℹ️'}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
        {message && <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">{message}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={() => { onConfirm?.(); onClose(); }} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white dark:text-gray-900 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 dark:hover:bg-red-400' : 'bg-gray-800 dark:bg-gray-200 hover:bg-gray-900 dark:hover:bg-gray-300'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
