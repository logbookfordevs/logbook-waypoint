'use client';

import { GitFork, Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const navigationItems = [
  { href: '/#workflow', label: 'Workflow' },
  { href: '/#manifest', label: 'Manifest' },
  { href: '/docs', label: 'Docs' },
];

export function SiteHeader() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [appearance, setAppearance] = useState<'day' | 'night'>('day');
  const navigationTriggerRef = useRef<HTMLButtonElement>(null);

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

  const toggleAppearance = () => {
    const nextAppearance = appearance === 'day' ? 'night' : 'day';
    setAppearance(nextAppearance);
    document.documentElement.dataset.appearance = nextAppearance;
  };

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
          {isNavigationOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav
          id="primary-navigation"
          className="primary-navigation"
          aria-label="Primary navigation"
          data-open={isNavigationOpen}
        >
          {navigationItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setIsNavigationOpen(false)}>
              {item.label}
            </a>
          ))}
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
            aria-label={appearance === 'day' ? 'Switch to Night Watch' : 'Switch to Day Chart'}
          >
            {appearance === 'day' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
          </button>
          <a className="launch-action" href="/#launch">Coming soon</a>
        </nav>
      </div>
    </header>
  );
}
