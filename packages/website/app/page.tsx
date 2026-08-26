import Image from 'next/image';
import Link from 'next/link';
import {
  Anchor,
  ArrowRight,
  Crosshair,
  Eye,
  Layers3,
  LockKeyhole,
  Radio,
  Route,
  Sparkles,
} from 'lucide-react';

import { LaunchStatus } from '@/components/launch-status';
import { WorkflowDemo } from '@/components/workflow-demo';

const manifestItems = [
  { icon: Crosshair, title: 'Pin with precision', copy: 'Capture the rendered Target, route, screenshot, and implementation context.' },
  { icon: Layers3, title: 'Retain the full brief', copy: 'Attachments, Element Edits, Design Intent, and Variant Intent travel together.' },
  { icon: Route, title: 'Route through the Queue', copy: 'Watch delivers activity without taking ownership or erasing retained state.' },
  { icon: Radio, title: 'Let agents act', copy: 'Claim makes work explicit. Resolution Records preserve what changed and how it was checked.' },
];

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <h1 id="hero-title">Pin the point. Chart the change.</h1>
          <p className="hero__statement">Visual feedback your coding agent can act on.</p>
          <div className="hero__actions">
            <a className="primary-action" href="#workflow">
              See how it works <ArrowRight aria-hidden="true" />
            </a>
            <LaunchStatus />
          </div>
        </div>

        <div className="hero-route" aria-label="Waypoint workflow: Annotate, Queue, Resolve">
          <svg viewBox="0 0 620 120" role="img" aria-hidden="true">
            <path d="M36 58 C142 8 218 108 310 58 S480 10 584 58" />
          </svg>
          <ol>
            <li><span><Crosshair /></span><strong>Annotate</strong><small>Rendered Target</small></li>
            <li><span><Route /></span><strong>Queue</strong><small>Retained context</small></li>
            <li><span><Anchor /></span><strong>Resolve</strong><small>Agent evidence</small></li>
          </ol>
        </div>
      </section>

      <WorkflowDemo />

      <section id="manifest" className="manifest-section" aria-labelledby="manifest-title">
        <div className="section-heading">
          <h2 id="manifest-title">Better feedback keeps its bearings.</h2>
          <p>Waypoint carries what the agent needs without turning the interface review into another prompt-writing chore.</p>
        </div>
        <div className="manifest-ledger">
          {manifestItems.map((item, index) => (
            <article key={item.title}>
              <span className="manifest-ledger__index">0{index + 1}</span>
              <item.icon aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="local-boundary" aria-labelledby="boundary-title">
        <div className="local-boundary__instrument" aria-hidden="true">
          <div className="boundary-radar">
            <span />
            <i />
          </div>
          <p>127.0.0.1</p>
        </div>
        <div className="local-boundary__copy">
          <h2 id="boundary-title">Your feedback stays aboard.</h2>
          <p>
            Waypoint binds its active server boundary to IPv4 loopback, persists the Queue locally,
            and exposes no public page-world Annotation CRUD bridge.
          </p>
          <dl>
            <div><dt><LockKeyhole /> Loopback-first</dt><dd>No LAN exposure in the supported boundary.</dd></div>
            <div><dt><Eye /> Retained history</dt><dd>Resolved and Discarded work remains inspectable until Deletion.</dd></div>
            <div><dt><Radio /> Non-destructive Watch</dt><dd>Delivery never silently Claims or removes Queue activity.</dd></div>
          </dl>
          <Link href="/docs/security">Read the security model <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="guided-work" aria-labelledby="guided-work-title">
        <div className="section-heading">
          <h2 id="guided-work-title">Give the brief sharper instruments.</h2>
          <p>Advanced direction joins the Annotation. It never creates a second authority beside Waypoint.</p>
        </div>
        <div className="guided-work__routes">
          <article>
            <span><Sparkles aria-hidden="true" /> Design Actions</span>
            <h3>Ask for deliberate design work.</h3>
            <p>Choose one structured Design Action or let the comment carry freeform Impeccable direction.</p>
            <div className="action-chips" aria-label="Example Design Actions">
              <span>Polish</span><span>Layout</span><span>Typeset</span><span>Animate</span>
            </div>
            <a href="https://impeccable.style/">Requires Impeccable <ArrowRight aria-hidden="true" /></a>
          </article>
          <article>
            <span><Layers3 aria-hidden="true" /> Named Variants</span>
            <h3>Compare directions without leaving debris.</h3>
            <p>Waypoint owns the Variant Set, Active Variant, Scaffold, and clean Finalization of the chosen candidate.</p>
            <div className="variant-strip" aria-label="Three illustrative named variants">
              <span>Quiet current</span><span>Signal-led</span><span>Wide bearing</span>
            </div>
            <Link href="/docs/variants">Explore the Variant model <ArrowRight aria-hidden="true" /></Link>
          </article>
        </div>
      </section>

      <section className="docs-passage" aria-labelledby="docs-passage-title">
        <div>
          <h2 id="docs-passage-title">Read the route before launch.</h2>
          <p>
            Installation remains development-only, but the workflow, agent setup, lifecycle, Variants,
            Design Actions, security, and troubleshooting guides are ready to inspect.
          </p>
          <Link className="primary-action primary-action--paper" href="/docs">
            Open documentation <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="docs-passage__chart">
          <svg viewBox="0 0 520 300" aria-hidden="true">
            <path d="M35 230 C110 75 210 285 290 120 S425 42 485 82" />
            <circle cx="35" cy="230" r="8" />
            <circle cx="290" cy="120" r="8" />
            <circle cx="485" cy="82" r="8" />
          </svg>
          <Image
            src="/brand/thelu-profile.webp"
            alt="Thelu, the Logbook for Devs navigator"
            width={280}
            height={280}
            loading="eager"
          />
        </div>
      </section>
    </main>
  );
}
