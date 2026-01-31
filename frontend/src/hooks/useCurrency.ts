import { useCurrency as useCurrencyContext } from '@/providers/CurrencyProvider';
import { Currency } from '@/types';

/**
 * Hook to get currency utilities from the CurrencyProvider context.
 * Provides formatPrice, convertPrice, and other currency utilities.
 * Returns the full CurrencyContextType for rich currency functionality.
 * 
 * For backward compatibility, currentCurrency is available as a property.
 */
export function useCurrency() {
    return useCurrencyContext();
}
