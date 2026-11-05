import type { Metadata } from 'next';
import { JoinScreen } from '@/components/screens/JoinScreen';

export const metadata: Metadata = {
  title: 'Join a friend',
};

export default function JoinPage() {
  return <JoinScreen />;
}
