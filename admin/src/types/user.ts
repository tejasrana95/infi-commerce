export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    name?: string;
    email: string;
    phone?: string;
    role: 'admin' | 'manager' | 'staff' | 'super_admin' | 'store_admin' | 'pos_user';
    storeIds?: string[];
    permissions?: string[];
    posPermissions?: {
        canApplyDiscount: boolean;
    };
    twoFactorEnabled?: boolean;
}
