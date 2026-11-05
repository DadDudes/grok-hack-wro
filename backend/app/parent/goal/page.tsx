import type { Metadata } from 'next';
import { GoalScreen } from '@/components/screens/GoalScreen';

export const metadata: Metadata = {
  title: 'New goal',
};

export default function GoalPage() {
  return <GoalScreen />;
}
