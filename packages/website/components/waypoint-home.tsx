'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ArrowRight, BookOpen, Check, GitFork, LockKeyhole, Radio } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { EditorialDemo } from '@/components/editorial-demo';
import { SiteFooter } from '@/components/site-footer';
import { chromeWebStoreUrl } from '@/lib/site-config';
import type { InkMapJourneyProps } from '@/components/ink-map-journey';

const LazyInkMap = dynamic<InkMapJourneyProps>(
  () => import('@/components/ink-map-journey').then(module => module.InkMapJourney).catch(() => JourneyUnavailable),
  { ssr: false, loading: JourneyLoading },
);

function JourneyLoading() {
  return <div className="home-map-pending"><nav aria-label="Opening chart"><a href="#waypoint-details">Skip to details</a></nav><p className="home-map-loading" role="status">Unfolding the chart…</p></div>;
}

function JourneyUnavailable({ onContinue }: InkMapJourneyProps) {
  return <div className="home-map-pending"><nav aria-label="Opening chart"><button type="button" onClick={onContinue}>Skip to details</button></nav><div className="home-map-unavailable"><h2>The chart couldn’t load.</h2><p>The rest of Waypoint is ready below.</p><button type="button" className="ink-button ink-button--primary" onClick={onContinue}>More details <ArrowRight aria-hidden="true" /></button></div></div>;
}

export function WaypointHome() {
  const destinationFrame = useRef<number | null>(null);

  const continueJourney = useCallback(() => {
    if (destinationFrame.current !== null) cancelAnimationFrame(destinationFrame.current);
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('waypoint-details')?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    destinationFrame.current = requestAnimationFrame(() => {
      destinationFrame.current = null;
      document.getElementById('ink-hero-title')?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => () => {
    if (destinationFrame.current !== null) cancelAnimationFrame(destinationFrame.current);
  }, []);

  return (
    <div className="ink-route-home waypoint-home">
      <main id="main-content">
        <section id="waypoint-journey" className="home-opening" aria-label="Waypoint Ink Map Journey">
          <LazyInkMap inline onContinue={continueJourney} onExit={continueJourney} />
          <noscript><div className="home-map-unavailable"><h2>Follow the route through Waypoint.</h2><p>The animated chart needs JavaScript. The full website continues below.</p><a className="ink-button" href="#waypoint-details">More details <ArrowRight aria-hidden="true" /></a></div></noscript>
        </section>
        <section id="waypoint-details" className="home-prologue" aria-labelledby="ink-hero-title">
          <div className="ink-paper-grain" aria-hidden="true" />
          <header className="ink-masthead">
            <a className="ink-brand" href="/" aria-label="Logbook Waypoint home">
              <Image src="/brand/waypoint-mark.svg" alt="" width={48} height={48} />
              <span><b>Logbook</b><strong>Waypoint</strong></span>
            </a>
            <nav aria-label="Homepage"><a href="/docs">Docs</a><a href="https://github.com/logbookfordevs/logbook-waypoint" target="_blank" rel="noreferrer">Source</a></nav>
          </header>
          <div className="ink-hero">
            <div className="ink-hero__copy">
              <h1 id="ink-hero-title" tabIndex={-1}><span>Pin the point.</span>{' '}<strong>Chart the change.</strong></h1>
              <p className="ink-hero__promise">Precise visual feedback.<br />Trustworthy agent work.</p>
              <p className="ink-hero__body">Mark what you see on a running interface. Waypoint keeps the context together, gives your coding agent a route through the work, and brings the evidence back.</p>
              <div className="ink-hero__actions">
                <a className="ink-button ink-button--primary" href={chromeWebStoreUrl} target="_blank" rel="noreferrer">Get the extension <ArrowRight aria-hidden="true" /></a>
                <a className="ink-button" href="/docs/agent-setup"><Radio aria-hidden="true" /> Connect your agent</a>
              </div>
              <div className="home-explore">
                <a href="#try-waypoint">Or try a field note</a>
              </div>
              <p className="ink-hero__availability">The extension captures the context. The local CLI connects it to your coding agent.</p>
            </div>
            <div className="ink-hero__thelu">
              <div className="ink-hero__coordinates" aria-hidden="true">37° 47.20′ N&nbsp;&nbsp;122° 24.80′ W</div>
              <Image src="/brand/thelu-ink-route-hero.webp" alt="Thelu, a tabby cat in a rust scarf, holding a green logbook" width={1122} height={1402} priority sizes="(max-width: 832px) 78vw, 46vw" />
              <svg viewBox="0 0 620 720" aria-hidden="true"><path d="M66 610 C136 526 156 420 114 328 C76 244 132 142 254 118 C376 94 514 162 548 290" /><path d="M456 78 l14 32 l32 14 l-32 14 l-14 32 l-14-32 l-32-14 l32-14z" /></svg>
            </div>
          </div>
        </section>

        <EditorialDemo />

        <section id="local-first" className="ink-payoff" aria-labelledby="ink-payoff-title">
          <div className="ink-paper-grain" aria-hidden="true" />
          <div className="ink-payoff__route" aria-hidden="true">
            <svg viewBox="0 0 620 440"><path d="M42 362 C128 244 228 394 304 238 S466 50 570 112" /><circle cx="42" cy="362" r="8" /><circle cx="304" cy="238" r="8" /><circle cx="570" cy="112" r="8" /></svg>
            <Image src="/brand/thelu-profile.webp" alt="" width={260} height={260} />
          </div>
          <div className="ink-payoff__copy">
            <h2 id="ink-payoff-title">Local by default.{' '}<br />Useful after the work.</h2>
            <p>Waypoint keeps Annotation history inspectable on your machine. Your agent gets a narrow working channel—not a public browser control surface.</p>
            <ul>
              <li><LockKeyhole aria-hidden="true" /><span><b>Loopback-first</b><small>Supported server boundary on IPv4 loopback</small></span></li>
              <li><Radio aria-hidden="true" /><span><b>Non-destructive Watch</b><small>Delivery never silently Claims or removes feedback</small></span></li>
              <li><Check aria-hidden="true" /><span><b>Retained evidence</b><small>Resolution remains inspectable until explicit Deletion</small></span></li>
            </ul>
            <div className="ink-payoff__actions">
              <a className="ink-button ink-button--primary" href={chromeWebStoreUrl} target="_blank" rel="noreferrer">Get the extension <ArrowRight aria-hidden="true" /></a>
              <a className="ink-button" href="/docs/agent-setup"><Radio aria-hidden="true" /> Connect your agent</a>
              <a className="ink-button" href="/docs">Read the field guide <BookOpen aria-hidden="true" /></a>
              <a className="ink-text-link" href="https://github.com/logbookfordevs/logbook-waypoint" target="_blank" rel="noreferrer"><GitFork aria-hidden="true" /> View source</a>
            </div>
            <p className="ink-payoff__note">Install the extension from the Chrome Web Store. Add the local server separately from npm or a verified GitHub Release when you want Queue synchronization and agent workflows.</p>
          </div>
        </section>
      </main>
      <SiteFooter />

    </div>
  );
}
