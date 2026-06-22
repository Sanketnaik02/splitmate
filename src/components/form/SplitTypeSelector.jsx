import { SPLIT_TYPES } from '../../config/constants';

const splitOptions = [
  { id: SPLIT_TYPES.EQUAL, label: 'Equal', icon: '➗', desc: 'Split equally among all' },
  { id: SPLIT_TYPES.PERCENTAGE, label: 'Percentage', icon: '💯', desc: 'Each pays a percentage', disabled: true, badge: 'Coming Soon' },
  { id: SPLIT_TYPES.EXACT, label: 'Exact', icon: '🎯', desc: 'Enter exact amounts', disabled: true, badge: 'Coming Soon' },
  { id: SPLIT_TYPES.SHARES, label: 'Shares', icon: '📊', desc: 'Split by ratio/shares', disabled: true, badge: 'Coming Soon' },
];

export default function SplitTypeSelector({ value, onChange }) {
  const handleClick = (opt) => {
    if (opt.disabled) return;
    onChange(opt.id);
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Split Type</label>
      <div className="grid grid-cols-2 gap-2">
        {splitOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleClick(opt)}
            disabled={opt.disabled}
            className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all text-left ${
              opt.disabled
                ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                : value === opt.id
                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                  : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg mt-0.5">{opt.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className={`text-sm font-medium ${
                  opt.disabled
                    ? 'text-gray-400 dark:text-gray-500'
                    : value === opt.id
                      ? 'text-primary-700'
                      : 'text-gray-900 dark:text-white'
                }`}>{opt.label}</p>
                {opt.badge && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    🔒 {opt.badge}
                  </span>
                )}
              </div>
              <p className={`text-[11px] leading-tight mt-0.5 ${opt.disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-300'}`}>{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
