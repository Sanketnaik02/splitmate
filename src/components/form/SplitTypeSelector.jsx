import { SPLIT_TYPES } from '../../config/constants';

const splitOptions = [
  { id: SPLIT_TYPES.EQUAL, label: 'Equal', icon: '➗', desc: 'Split equally among all' },
  { id: SPLIT_TYPES.PERCENTAGE, label: 'Percentage', icon: '💯', desc: 'Each pays a percentage' },
  { id: SPLIT_TYPES.EXACT, label: 'Exact', icon: '🎯', desc: 'Enter exact amounts' },
  { id: SPLIT_TYPES.SHARES, label: 'Shares', icon: '📊', desc: 'Split by ratio/shares' },
];

export default function SplitTypeSelector({ value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Split Type</label>
      <div className="grid grid-cols-2 gap-2">
        {splitOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all text-left ${
              value === opt.id
                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg mt-0.5">{opt.icon}</span>
            <div>
              <p className={`text-sm font-medium ${value === opt.id ? 'text-primary-700' : 'text-gray-900 dark:text-white'}`}>{opt.label}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-300 leading-tight mt-0.5">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
