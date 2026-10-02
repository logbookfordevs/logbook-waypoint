import type { Metadata } from 'next';
import { TheatreLab } from '@/app/labs/theatre/theatre-lab';
import '@/app/labs/theatre/theatre.css';

export const metadata: Metadata = {
  title: 'The marked page — Theatre lab',
  robots: { index: false, follow: false },
};

export default function TheatrePage() {
  return <TheatreLab />;
}
