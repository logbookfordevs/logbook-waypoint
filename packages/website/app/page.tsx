import Image from 'next/image';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  Crosshair,
  GitFork,
  LockKeyhole,
  Radio,
  Route,
} from 'lucide-react';

import { LaunchStatus } from '@/components/launch-status';
import { RouteJourney } from '@/components/route-journey';

const localProof = [
  {
    icon: LockKeyhole,
    label: 'Loopback-first',
    copy: 'The supported server boundary stays on IPv4 loopback—not your LAN.',
  },
  {
    icon: Route,
    label: 'Local and retained',
    copy: 'The Queue and Resolution Records remain inspectable on your machine.',
  },
  {
    icon: Radio,
    label: 'Non-destructive Watch',
    copy: 'Delivery never silently Claims, resolves, or removes your feedback.',
  },
] as const;

export default function HomePage() {
  return (
    <main id="main-content" className="home-journey">
      <section className="journey-hero" aria-labelledby="hero-title">
        <div className="journey-hero__copy">
          <p className="journey-eyebrow"><span /> Local-first visual feedback</p>
          <h1 id="hero-title">Pin the point.<br />Chart the change.</h1>
          <p className="journey-hero__statement">
            Leave precise notes on a running interface. Waypoint keeps the context together so your coding agent can act—and you can verify what came back.
          </p>

          <div className="journey-hero__actions" aria-label="Start exploring Logbook Waypoint">
            <a className="journey-action journey-action--primary" href="#journey">
              Follow the route <ArrowDown aria-hidden="true" />
            </a>
            <a className="journey-action" href="/docs">
              <BookOpen aria-hidden="true" /> Docs
            </a>
            <a
              className="journey-action"
              href="https://github.com/logbookfordevs/logbook-waypoint"
              target="_blank"
              rel="noreferrer"
            >
              <GitFork aria-hidden="true" /> Repository
            </a>
          </div>

          <div className="journey-hero__status">
            <LaunchStatus />
            <p>Development preview · Chrome extension + local MCP server</p>
          </div>
        </div>

        <div className="journey-hero__instrument" aria-label="An annotation entering the Waypoint route">
          <svg className="journey-hero__chart-line" viewBox="0 0 680 600" aria-hidden="true">
            <path d="M62 110 C188 44 220 204 346 160 S476 88 594 180 S544 384 612 510" />
            <circle cx="62" cy="110" r="8" />
            <circle cx="346" cy="160" r="8" />
            <circle cx="612" cy="510" r="8" />
          </svg>

          <div className="journey-window">
            <div className="journey-window__chrome" aria-hidden="true">
              <span /><span /><span />
              <code>localhost:3000/dashboard</code>
            </div>
            <div className="journey-window__canvas">
              <div className="journey-window__nav" />
              <div className="journey-window__content">
                <span />
                <span />
                <span className="journey-window__target"><i>1</i></span>
              </div>
            </div>
          </div>

          <div className="journey-note">
            <div className="journey-note__pin"><Crosshair aria-hidden="true" /></div>
            <p><span>Annotation #1842</span><strong>Tighten the empty state.</strong></p>
            <code>section.empty-state</code>
          </div>

          <div className="journey-route-ticket">
            <span><Check aria-hidden="true" /></span>
            <p><strong>Context retained</strong><small>Ready for the Queue</small></p>
          </div>
        </div>
      </section>

      <RouteJourney />

      <section id="local-first" className="journey-assurance" aria-labelledby="assurance-title">
        <div className="journey-assurance__intro">
          <p className="journey-eyebrow journey-eyebrow--light"><span /> Kept aboard</p>
          <h2 id="assurance-title">The route stays local.<br />The history stays useful.</h2>
          <p>
            Waypoint gives your agent a working channel without turning your browser into a public control surface.
          </p>
          <a href="/docs/security">Read the security model <ArrowRight aria-hidden="true" /></a>
        </div>

        <ol className="journey-assurance__ledger">
          {localProof.map((item, index) => (
            <li key={item.label}>
              <span className="journey-assurance__index">0{index + 1}</span>
              <item.icon aria-hidden="true" />
              <div><strong>{item.label}</strong><p>{item.copy}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="journey-payoff" aria-labelledby="payoff-title">
        <div className="journey-payoff__chart" aria-hidden="true">
          <svg viewBox="0 0 640 400">
            <path d="M28 318 C140 118 242 380 350 182 S530 66 612 110" />
            <circle cx="28" cy="318" r="7" />
            <circle cx="350" cy="182" r="7" />
            <circle cx="612" cy="110" r="7" />
          </svg>
          <Image src="/brand/thelu-profile.webp" alt="" width={310} height={310} />
        </div>

        <div className="journey-payoff__copy">
          <p className="journey-eyebrow"><span /> Choose the next bearing</p>
          <h2 id="payoff-title">Leave a usable waypoint.</h2>
          <p>
            Read the field guide, inspect the source, or follow development while the public release takes shape.
          </p>
          <div className="journey-payoff__links">
            <a className="journey-action journey-action--primary" href="/docs">
              Open the field guide <ArrowRight aria-hidden="true" />
            </a>
            <a
              className="journey-action"
              href="https://github.com/logbookfordevs/logbook-waypoint"
              target="_blank"
              rel="noreferrer"
            >
              View repository <GitFork aria-hidden="true" />
            </a>
          </div>
          <p className="journey-payoff__note">Design Actions and Named Variants join the same Annotation when the work needs a sharper instrument.</p>
        </div>
      </section>
    </main>
  );
}
