import type { Metadata } from 'next';
import { PickScreen } from '@/components/screens/PickScreen';

export const metadata: Metadata = {
  title: 'Pick a game',
};

export default function PickPage() {
  return <PickScreen />;
}
