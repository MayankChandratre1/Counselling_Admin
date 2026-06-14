/**
 * INR formatting helpers.
 * Razorpay webhook/API amounts are in paise; plan prices and user premium fields are in rupees.
 */

export function formatCurrency(amount, { fromPaise = false } = {}) {
  if (amount == null || amount === '') return 'N/A';
  const num = Number(amount);
  if (Number.isNaN(num)) return 'N/A';
  const rupees = fromPaise ? num / 100 : num;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(rupees);
}

/** Format Razorpay payment/order amounts (stored in paise). */
export function formatRazorpayAmount(amount) {
  return formatCurrency(amount, { fromPaise: true });
}
