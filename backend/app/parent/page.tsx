import type { Metadata } from 'next';
import { ParentHomeScreen } from '@/components/screens/ParentHomeScreen';

export const metadata: Metadata = {
  title: 'Home',
};

export default function ParentHomePage() {
  return <ParentHomeScreen />;
}
