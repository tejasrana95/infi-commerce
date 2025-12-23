import { useStore } from '@/providers/StoreProvider';
import { Currency } from '@/types';

/**
 * Hook to get the current currency from the store context.
 * Returns the currency object if available, or 'USD' as a fallback string.
 * This unifies currency access across components.
 */
export function useCurrency(): Currency | string {
    const { currentCurrency } = useStore();
    return currentCurrency || 'USD';
}
