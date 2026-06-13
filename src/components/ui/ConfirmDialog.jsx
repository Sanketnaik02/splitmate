export default function ConfirmDialog({ isOpen, onClose, title, message, confirmLabel = 'Confirm', onConfirm, variant = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl z-10 p-6 text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${variant === 'danger' ? 'bg-red-100' : 'bg-gray-100'}`}>
          <span className="text-xl">{variant === 'danger' ? '⚠️' : 'ℹ️'}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        {message && <p className="text-sm text-gray-500 mb-5">{message}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { onConfirm?.(); onClose(); }} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-900'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
