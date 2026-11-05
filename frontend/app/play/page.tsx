import type { Metadata } from 'next';
import { KidHomeScreen } from '@/components/screens/KidHomeScreen';

export const metadata: Metadata = {
  title: 'Play',
};

export default function PlayPage() {
  return <KidHomeScreen />;
}
