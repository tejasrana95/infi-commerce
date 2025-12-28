/**
 * Formats a numeric amount into a currency string.
 *
 * @param amount The numeric amount in base currency.
 * @param options Object containing the currency code and exchange rate.
 * @returns Formatted currency string.
 */
export function formatPrice(
    amount: number,
    options: { code: string; exchangeRate?: number }
): string {
    const { code, exchangeRate = 1 } = options;
    const finalAmount = amount * exchangeRate;

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: code || 'INR',
        minimumFractionDigits: 2
    }).format(finalAmount);
}
