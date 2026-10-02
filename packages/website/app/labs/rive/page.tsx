import type { Metadata } from 'next';

import { FieldGuide } from '@/app/labs/rive/field-guide';
import '@/app/labs/rive/rive-lab.css';

export const metadata: Metadata = {
  title: 'The living field guide — Rive lab',
  robots: { index: false, follow: false },
};

export default function RiveLabPage() {
  return <FieldGuide />;
}
