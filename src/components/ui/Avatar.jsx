import React from 'react';

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ src, name, size = 'md', className = '', onClick }) {
  const [error, setError] = React.useState(false);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setError(true)}
        onClick={onClick}
        className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${sizeMap[size]} rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
