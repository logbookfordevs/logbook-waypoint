import type { Metadata } from 'next';
import { StorybookLab } from '@/components/storybook-lab/storybook-lab';
import './storybook.css';

export const metadata: Metadata = {
  title: 'The Atlas of Small Changes — Waypoint Lab',
  robots: { index: false, follow: false },
};

export default function StorybookPage() {
  return <StorybookLab />;
}
