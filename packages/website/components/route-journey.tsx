'use client';

import { useEffect, useRef } from 'react';
import { Check, Crosshair, Radio, Route } from 'lucide-react';

const journeyBeats = [
  {
    number: '01',
    label: 'Annotate',
    title: 'Mark the rendered target.',
    copy: 'Pin the exact element. Waypoint keeps its route, selector, screenshot, and your requested change together.',
    evidence: 'Target · route · visual context',
    icon: Crosshair,
  },
  {
    number: '02',
    label: 'Queue',
    title: 'Keep the field note intact.',
    copy: 'The local Queue preserves lifecycle and context, so feedback does not dissolve into a screenshot or another chat message.',
    evidence: 'Pending · Claimed · Resolved',
    icon: Route,
  },
  {
    number: '03',
    label: 'Agent',
    title: 'Turn context into action.',
    copy: 'Through MCP, an agent can Watch and Claim the Annotation before changing the source. Waypoint remains the authority.',
    evidence: 'Watch · Claim · implement',
    icon: Radio,
  },
  {
    number: '04',
    label: 'Verify',
    title: 'Return with evidence.',
    copy: 'The result comes back to the original point with a Resolution Record, ready for a human to inspect and continue.',
    evidence: 'Change · checks · resolution',
    icon: Check,
  },
] as const;

export function RouteJourney() {
  const journeyRef = useRef<HTMLElement>(null);
  const routePathRef = useRef<SVGPathElement>(null);
  const tracerRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const journey = journeyRef.current;
    const path = routePathRef.current;
    const tracer = tracerRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!journey || !path || !tracer) {
      return;
    }

    const checkpoints = Array.from(journey.querySelectorAll<HTMLElement>('[data-route-beat]'));
    let animationFrame = 0;
    let latestProgress = -1;
    let latestActiveBeat = -1;

    const render = () => {
      animationFrame = 0;

      if (reducedMotion.matches) {
        journey.style.setProperty('--route-progress', '1');
        path.style.opacity = '0';
        return;
      }

      const bounds = journey.getBoundingClientRect();
      const travel = Math.max(bounds.height - window.innerHeight, 1);
      const progress = Math.min(Math.max(-bounds.top / travel, 0), 1);

      if (Math.abs(progress - latestProgress) < 0.0005) {
        return;
      }

      latestProgress = progress;
      journey.style.setProperty('--route-progress', progress.toFixed(4));

      const pathLength = path.getTotalLength();
      path.style.strokeDasharray = `${pathLength}`;
      path.style.strokeDashoffset = `${pathLength * (1 - progress)}`;
      path.style.opacity = '1';
      const point = path.getPointAtLength(pathLength * progress);
      tracer.setAttribute('cx', point.x.toFixed(2));
      tracer.setAttribute('cy', point.y.toFixed(2));

      const activeBeat = Math.min(Math.floor(progress * journeyBeats.length), journeyBeats.length - 1);
      if (activeBeat !== latestActiveBeat) {
        latestActiveBeat = activeBeat;
        checkpoints.forEach((checkpoint, index) => {
          checkpoint.toggleAttribute('data-route-active', index === activeBeat);
          checkpoint.toggleAttribute('data-route-visited', index < activeBeat);
        });
      }
    };

    const scheduleRender = () => {
      if (!reducedMotion.matches && !animationFrame) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const handleMotionPreference = () => {
      latestProgress = -1;
      latestActiveBeat = -1;
      render();
    };

    render();
    window.addEventListener('scroll', scheduleRender, { passive: true });
    window.addEventListener('resize', scheduleRender);
    reducedMotion.addEventListener('change', handleMotionPreference);

    return () => {
      window.removeEventListener('scroll', scheduleRender);
      window.removeEventListener('resize', scheduleRender);
      reducedMotion.removeEventListener('change', handleMotionPreference);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section ref={journeyRef} id="journey" className="route-journey" aria-labelledby="journey-title">
      <header className="route-journey__heading">
        <p className="route-kicker">The working route</p>
        <h2 id="journey-title">A field note your agent can follow.</h2>
        <p>
          Waypoint carries one precise observation from the rendered page to implementation—and brings the evidence back.
        </p>
      </header>

      <div className="route-journey__chart">
        <div className="route-journey__mobile-line" aria-hidden="true"><span /></div>
        <svg
          className="route-journey__line"
          viewBox="0 0 1000 1760"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className="route-journey__line-base" d="M500 20 C500 150 218 170 218 390 S782 620 782 820 S218 1060 218 1280 S500 1480 500 1740" />
          <path ref={routePathRef} className="route-journey__line-progress" pathLength="1" d="M500 20 C500 150 218 170 218 390 S782 620 782 820 S218 1060 218 1280 S500 1480 500 1740" />
          <circle ref={tracerRef} className="route-journey__tracer" r="12" cx="500" cy="20" />
        </svg>

        <ol className="route-journey__beats">
          {journeyBeats.map((beat, index) => {
            const Icon = beat.icon;
            return (
              <li key={beat.label} data-route-beat data-route-active={index === 0 ? '' : undefined}>
                <article>
                  <div className="route-beat__meta">
                    <span>{beat.number}</span>
                    <span>{beat.label}</span>
                  </div>
                  <span className="route-beat__icon" aria-hidden="true"><Icon /></span>
                  <h3>{beat.title}</h3>
                  <p>{beat.copy}</p>
                  <code>{beat.evidence}</code>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
