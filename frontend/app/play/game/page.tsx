import type { Metadata } from 'next';
import { GameScreen } from '@/components/screens/GameScreen';

export const metadata: Metadata = {
  title: 'Game',
};

export default function GamePage() {
  return <GameScreen />;
}
