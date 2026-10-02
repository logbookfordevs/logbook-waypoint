import type { Metadata } from 'next';
import { PixiLab } from '@/components/pixi-lab/pixi-lab';
import './pixi-lab.css';

export const metadata: Metadata = {
  title: 'The living field note — Waypoint lab',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PixiLab />;
}
