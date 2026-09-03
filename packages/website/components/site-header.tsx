'use client';

import { GitFork, Menu, Moon, Sun, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useThemeBoundary } from '@/components/theme-boundary';
import { useMediaQuery } from '@/lib/use-media-query';

const navigationItems = [
  { href: '/#journey', label: 'Journey' },
  { href: '/#local-first', label: 'Local-first' },
  { href: '/docs', label: 'Docs' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { appearance, toggleAppearance } = useThemeBoundary();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState('');
  const navigationTriggerRef = useRef<HTMLButtonElement>(null);
  const isMobileNavigation = useMediaQuery('(max-width: 52rem)');
  const isNavigationHidden = isMobileNavigation && !isNavigationOpen;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !isNavigationOpen) {
        return;
      }

      setIsNavigationOpen(false);
      navigationTriggerRef.current?.focus();
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isNavigationOpen]);

  useEffect(() => {
    const updateCurrentHash = () => setCurrentHash(window.location.hash);
    updateCurrentHash();
    window.addEventListener('hashchange', updateCurrentHash);
    return () => window.removeEventListener('hashchange', updateCurrentHash);
  }, []);

  const navigationIcon = isNavigationOpen
    ? <X aria-hidden="true" />
    : <Menu aria-hidden="true" />;
  const appearanceIcon = appearance === 'day'
    ? <Moon aria-hidden="true" />
    : <Sun aria-hidden="true" />;
  const appearanceLabel = appearance === 'day' ? 'Switch to Night Watch' : 'Switch to Day Chart';

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-brand" href="/" aria-label="Logbook Waypoint home">
          <img src="/brand/waypoint-mark.svg" alt="" width="42" height="42" />
          <span>
            <strong>Logbook</strong>
            <b>Waypoint</b>
          </span>
        </a>

        <button
          ref={navigationTriggerRef}
          type="button"
          className="navigation-trigger"
          aria-label={isNavigationOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isNavigationOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsNavigationOpen((isOpen) => !isOpen)}
        >
          {navigationIcon}
        </button>

        <nav
          id="primary-navigation"
          className="primary-navigation"
          aria-label="Primary navigation"
          data-open={isNavigationOpen}
          aria-hidden={isNavigationHidden}
          inert={isNavigationHidden}
        >
          {navigationItems.map((item) => {
            const isDocsItem = item.href === '/docs';
            const itemHash = item.href.startsWith('/#') ? item.href.slice(1) : '';
            const isCurrent = isDocsItem
              ? pathname.startsWith('/docs')
              : pathname === '/' && (currentHash === itemHash || (!currentHash && itemHash === '#journey'));

            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => setIsNavigationOpen(false)}
              >
                {item.label}
              </a>
            );
          })}
          <a
            href="https://github.com/logbookfordevs/logbook-waypoint"
            target="_blank"
            rel="noreferrer"
            className="repository-link"
          >
            <GitFork aria-hidden="true" /> Repository
          </a>
          <button
            type="button"
            className="appearance-toggle"
            onClick={toggleAppearance}
            aria-label={appearanceLabel}
          >
            {appearanceIcon}
          </button>
          <a className="launch-action" href="/docs/installation">Install</a>
        </nav>
      </div>
    </header>
  );
}
