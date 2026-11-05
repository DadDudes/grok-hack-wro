import type { Metadata } from 'next';
import { BuildingScreen } from '@/components/screens/BuildingScreen';

export const metadata: Metadata = {
  title: 'Building your game',
};

export default function BuildingPage() {
  return <BuildingScreen />;
}
