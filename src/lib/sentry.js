import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.log('[Sentry] VITE_SENTRY_DSN not set — skipping initialization');
    return false;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
  });

  initialized = true;
  console.log('[Sentry] initialized for environment:', import.meta.env.MODE);
  return true;
}

export function captureError(error, context = {}) {
  if (!error) return;
  if (!initialized) {
    console.warn('[Sentry] not initialized — skipping capture:', error.message);
    return;
  }

  Sentry.withScope((scope) => {
    if (context.tag) {
      scope.setTag('error_tag', context.tag);
    }
    if (context.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }
    if (context.extra) {
      scope.setExtras(context.extra);
    }
    if (context.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

export function captureMessage(message, context = {}) {
  if (!message) return;
  if (!initialized) {
    console.warn('[Sentry] not initialized — skipping message:', message);
    return;
  }

  Sentry.withScope((scope) => {
    if (context.tag) {
      scope.setTag('error_tag', context.tag);
    }
    if (context.extra) {
      scope.setExtras(context.extra);
    }
    if (context.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureMessage(message, context.level || 'info');
  });
}

export { Sentry };
