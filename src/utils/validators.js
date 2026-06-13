export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export function validateGroupName(name) {
  if (!name || name.trim().length === 0) return 'Group name is required';
  if (name.trim().length > 50) return 'Group name must be under 50 characters';
  return null;
}

export function validateExpenseAmount(amount) {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return 'Amount must be greater than 0';
  if (num > 99999999) return 'Amount is too large';
  return null;
}

export function validateExpenseDescription(desc) {
  if (!desc || desc.trim().length === 0) return 'Description is required';
  if (desc.trim().length > 100) return 'Description must be under 100 characters';
  return null;
}
