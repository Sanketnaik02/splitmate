import React from 'react';

export default function AmountInput({ value, onChange, label, error }) {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    if ((raw.match(/\./g) || []).length > 1) return;
    onChange(raw);
  };

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className={`relative flex items-center border rounded-xl transition-all bg-white ${error ? 'border-red-300' : 'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 border-gray-200'}`}>
        <span className="absolute left-4 text-lg font-semibold text-gray-500">₹</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="0.00"
          className="w-full bg-transparent pl-8 pr-4 py-3 text-xl font-semibold text-gray-900 placeholder-gray-300 outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
