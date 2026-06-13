const currencyConfig = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
};

export function formatCurrency(amount) {
  return `${currencyConfig.symbol}${Number(amount).toFixed(2)}`;
}

export function formatCurrencyInt(amount) {
  return `${currencyConfig.symbol}${Math.round(Number(amount))}`;
}

export function parseCurrencyInput(value) {
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export { currencyConfig };
