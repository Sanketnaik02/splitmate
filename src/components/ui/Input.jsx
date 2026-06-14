import React from 'react';

export default function Input({ label, error, icon, type = 'text', className = '', ...props }) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className={`relative flex items-center border rounded-xl transition-all bg-white dark:bg-gray-100 ${focused ? 'border-primary-500 ring-2 ring-primary-500/20' : error ? 'border-red-300' : 'border-gray-200'} ${className}`}>
        {icon && <span className="absolute left-3 text-gray-400 text-lg">{icon}</span>}
        <input
          type={type}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none ${icon ? 'pl-10' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
