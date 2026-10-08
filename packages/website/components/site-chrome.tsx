'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export function SiteChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  const showsDocumentShell = usePathname() !== '/';

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {showsDocumentShell && <SiteHeader />}
      {children}
      {showsDocumentShell && <SiteFooter />}
    </>
  );
}
