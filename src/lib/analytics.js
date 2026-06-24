import posthog from 'posthog-js';

let enabled = false;

export function initAnalytics() {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    console.log('[Analytics] VITE_POSTHOG_KEY not set — skipping initialization');
    return false;
  }

  try {
    posthog.init(apiKey, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
      loaded: (ph) => {
        if (import.meta.env.DEV) {
          ph.opt_out_capturing();
          console.log('[Analytics] disabled in development mode');
        }
      },
    });
    enabled = true;
    console.log('[Analytics] initialized, host:', host);
  } catch (err) {
    console.warn('[Analytics] init failed:', err);
  }

  return enabled;
}

export function track(event, properties = {}) {
  if (!enabled) return;
  try {
    posthog.capture(event, properties);
  } catch (err) {
    console.warn('[Analytics] track failed:', err);
  }
}

export function identify(userId, traits = {}) {
  if (!enabled || !userId) return;
  try {
    posthog.identify(userId, traits);
  } catch (err) {
    console.warn('[Analytics] identify failed:', err);
  }
}

export function resetAnalytics() {
  if (!enabled) return;
  try {
    posthog.reset();
  } catch (err) {
    console.warn('[Analytics] reset failed:', err);
  }
}
