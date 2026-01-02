export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    name?: string;
    email: string;
    phone?: string;
    role: 'admin' | 'manager' | 'staff' | 'super_admin' | 'store_admin';
    storeIds?: string[];
    permissions?: string[];
    twoFactorEnabled?: boolean;
}
