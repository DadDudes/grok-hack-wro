import type { Metadata } from 'next';
import { WinScreen } from '@/components/screens/WinScreen';

export const metadata: Metadata = {
  title: 'You did it',
};

export default function WinPage() {
  return <WinScreen />;
}
