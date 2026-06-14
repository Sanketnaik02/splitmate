export default function LoadingSpinner({ size = 'md', overlay }) {
  const sizeMap = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

  const spinner = (
    <svg className={`animate-spin text-primary-600 ${sizeMap[size]}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 bg-white/80 dark:bg-gray-50/80 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center py-8">{spinner}</div>;
}
