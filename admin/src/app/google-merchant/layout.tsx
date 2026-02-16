import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = {
    title: 'Google Merchant Center | Admin',
    description: 'Manage your Google Merchant Center product feed',
};

export default function GoogleMerchantLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <DashboardLayout>{children}</DashboardLayout>
        </ProtectedRoute>
    );
}
