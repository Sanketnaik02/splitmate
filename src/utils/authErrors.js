const RATE_LIMIT_MSG = 'Too many authentication requests. Please wait a few minutes and try again.';

export function getAuthErrorMessage(error) {
  if (!error) return null;

  const message = (error.message || '').toLowerCase();
  const status = error.status || error.code;
  const msg = error.msg || '';

  // Rate limit (Supabase returns 429 or rate limit messages)
  if (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('email rate limit')
  ) {
    return RATE_LIMIT_MSG;
  }

  // Network errors
  if (
    status === 0 ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('typeerror')
  ) {
    return 'Network error. Check your internet connection and try again.';
  }

  // Duplicate email
  if (
    message.includes('already registered') ||
    message.includes('already exists') ||
    message.includes('duplicate key') ||
    message.includes('email already registered')
  ) {
    return 'An account with this email already exists. Please sign in.';
  }

  // Weak password
  if (
    message.includes('password should be') ||
    message.includes('password must be') ||
    message.includes('weak password')
  ) {
    return 'Password must be at least 6 characters.';
  }

  // Invalid email format
  if (
    message.includes('invalid email') ||
    message.includes('unable to validate email') ||
    message.includes('email format') ||
    message.includes('malformed email')
  ) {
    return 'Please enter a valid email address.';
  }

  // Wrong credentials (sign in)
  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    message.includes('wrong password') ||
    message.includes('user not found') ||
    status === 400
  ) {
    return 'Invalid email or password.';
  }

  // Email not confirmed
  if (
    message.includes('email not confirmed') ||
    message.includes('email_not_confirmed')
  ) {
    return 'Please confirm your email address before signing in. Check your inbox.';
  }

  // Other Supabase errors with messages
  if (message) return message;

  // Fallback
  return 'Something went wrong. Please try again.';
}
