import type { Metadata } from 'next';
import { MarginLab } from '@/app/labs/margin/margin-lab';
import '@/app/labs/margin/margin.css';

export const metadata: Metadata = {
  title: 'The Margin Becomes the Message — Waypoint Lab',
  robots: { index: false, follow: false },
};

export default function MarginPage() {
  return <MarginLab />;
}
