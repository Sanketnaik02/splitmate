export default function Card({ children, className = '', padding = 'p-4', onClick, elevated = true }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-50 rounded-2xl ${padding} ${elevated ? 'shadow-sm' : ''} ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
