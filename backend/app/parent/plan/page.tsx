import type { Metadata } from 'next';
import { PlanScreen } from '@/components/screens/PlanScreen';

export const metadata: Metadata = {
  title: "Prof's tasks",
};

export default function PlanPage() {
  return <PlanScreen />;
}
