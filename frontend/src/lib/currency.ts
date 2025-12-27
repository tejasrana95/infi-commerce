// Format price based on currency object or code
export function formatPrice(price: number, currency: import('@/types').Currency | string, convert = true): string {
    if (typeof currency === 'string') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(price);
    }

    // Custom formatting using Currency object

    let val = price * (currency.exchangeRate || 1);
    if (!convert) {
        val = price;
    }
    const formatted = val.toFixed(currency.decimalPlaces || 2);

    // Add thousands separator if needed (simplified)
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator || ',');

    const result = parts.join(currency.decimalSeparator || '.');

    return currency.symbolPosition === 'after'
        ? `${result} ${currency.symbol}`
        : `${currency.symbol}${result}`;
}