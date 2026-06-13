import { CATEGORIES } from '../../config/constants';

export default function CategoryPicker({ value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">Category</label>
      <div className="grid grid-cols-5 gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all ${
              value === cat.id
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{cat.icon}</span>
            <span className="text-[10px] font-medium leading-tight text-center">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
