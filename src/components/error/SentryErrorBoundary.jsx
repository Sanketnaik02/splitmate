import { ErrorBoundary } from '@sentry/react';
import Button from '../ui/Button';

function ErrorFallback({ error, componentStack, resetError }) {
  const reportUrl = 'mailto:sanketnaik393@gmail.com?subject=SplitMate%20Error%20Report';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          An unexpected error occurred. Please{' '}
          <a href={reportUrl} className="text-primary-600 hover:underline">report this issue</a>{' '}
          and we'll fix it as soon as possible.
        </p>
        <div className="space-y-3">
          <Button onClick={resetError}>Try Again</Button>
          <Button variant="secondary" fullWidth onClick={() => window.location.href = '/'}>
            Go to Home
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Error details</summary>
            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
              {error?.message}
              {componentStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default function SentryErrorBoundary({ children }) {
  return (
    <ErrorBoundary fallback={ErrorFallback} onError={(error, info) => {
      console.error('[ErrorBoundary] Caught:', error.message, info);
    }}>
      {children}
    </ErrorBoundary>
  );
}
