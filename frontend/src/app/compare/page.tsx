import { Metadata } from 'next';
import ComparePageContainer from '@/components/templates/core/ComparePage/Container';

export const metadata: Metadata = {
    title: 'Compare Products',
    description: 'Compare products side by side to find the best option for you.',
};

export default function ComparePage() {
    return <ComparePageContainer />;
}
