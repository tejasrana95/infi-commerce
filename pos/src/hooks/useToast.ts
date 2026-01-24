import { useToastContext } from '@/contexts/ToastContext';

export function useToast() {
    const { toast, dismiss } = useToastContext();
    return { toast, dismiss };
}
