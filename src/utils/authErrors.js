const RATE_LIMIT_MSG = 'Too many authentication requests were sent. Please wait a few minutes and try again.';

export function getAuthErrorMessage(error) {
  if (!error) return null;

  const message = (error.message || '').toLowerCase();
  const status = error.status || error.code;

  if (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('email rate limit')
  ) {
    return RATE_LIMIT_MSG;
  }

  if (message.includes('already registered')) {
    return 'This email is already registered. Please login instead.';
  }

  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }

  return null;
}
