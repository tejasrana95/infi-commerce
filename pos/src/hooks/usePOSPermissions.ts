import { useUser } from '@/contexts/UserContext';

export interface POSPermissions {
    canApplyDiscount: boolean;
}

/**
 * Hook to check user's POS permissions
 * Checks both posPermissions and role-based permissions
 */
export function usePOSPermissions(): POSPermissions {
    const { user } = useUser();

    // Super admin has all permissions
    if (user?.role === 'super_admin' || user?.role === 'admin') {
        return {
            canApplyDiscount: true,
        };
    }

    // Check posPermissions
    const canApplyDiscount = user?.posPermissions?.canApplyDiscount ?? false;
    return {
        canApplyDiscount,
    };
}

/**
 * Utility to check if user has a specific permission
 */
export function hasPermission(
    user: any,
    permission: 'canApplyDiscount'
): boolean {
    // Super admin has all permissions
    if (user?.role === 'super_admin' || user?.role === 'admin') {
        return true;
    }

    return user?.posPermissions?.[permission] ?? false;
}
