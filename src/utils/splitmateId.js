export function isSplitmateId(value) {
  return /^SM\d{5}$/i.test(value);
}

export function formatSplitmateId(value) {
  if (!value) return '';
  const cleaned = value.replace(/[^0-9]/g, '');
  return `SM${cleaned.padStart(5, '0').slice(0, 5)}`;
}
