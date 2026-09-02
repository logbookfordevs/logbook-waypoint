'use client';

import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  Check,
  Crosshair,
  GitFork,
  LockKeyhole,
  Radio,
  Route,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const chapters = [
  {
    label: 'Annotation',
    bearing: '01 · Fix the point',
    title: 'The route begins exactly where the thought happened.',
    copy: 'Select the rendered Target. Waypoint keeps the route, selector, viewport, screenshot, and brief together—before context can drift.',
  },
  {
    label: 'Queue',
    bearing: '02 · Keep the context',
    title: 'A field note becomes retained work.',
    copy: 'The local Queue preserves identity and lifecycle. Watch can deliver the work without silently Claiming, resolving, or removing it.',
  },
  {
    label: 'Agent',
    bearing: '03 · Hand off with trust',
    title: 'Your agent receives a route, not a riddle.',
    copy: 'Through MCP, the agent reads the Target and brief, Claims the Annotation, changes the source, and reports through Waypoint’s lifecycle.',
  },
  {
    label: 'Resolution',
    bearing: '04 · Return with evidence',
    title: 'The route closes where it began.',
    copy: 'A Resolution Record brings the change, checks, and implementation note back to the original point—ready for your judgment.',
  },
] as const;

export function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function getChapterIndex(progress: number, count = chapters.length) {
  return Math.min(Math.floor(clampProgress(progress) * count), count - 1);
}

export function getChapterVisibility(progress: number, index: number, count = chapters.length) {
  const localProgress = clampProgress((clampProgress(progress) - index / count) * count);
  const enters = index === 0 ? 1 : clampProgress(localProgress / 0.14);
  const exits = index === count - 1 ? 1 : clampProgress((1 - localProgress) / 0.18);
  return Math.min(enters, exits);
}

class InkAudioBus {
  private context: AudioContext | null = null;

  async enable() {
    if (!this.context) {
      this.context = new AudioContext();
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  impact() {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(118, now);
    oscillator.frequency.exponentialRampToValueAtTime(54, now + 0.28);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(720, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.13, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    oscillator.connect(filter).connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.36);
  }

  destroy() {
    void this.context?.close();
    this.context = null;
  }
}

export function RouteJourney() {
  const rootRef = useRef<HTMLDivElement>(null);
  const prologueRef = useRef<HTMLElement>(null);
  const journeyRef = useRef<HTMLElement>(null);
  const sceneRefs = useRef<Array<HTMLElement | null>>([]);
  const audioBusRef = useRef<InkAudioBus | null>(null);
  const soundIntentRef = useRef(false);
  const impactPlayedRef = useRef(false);
  const activeChapterRef = useRef(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  const enableSound = useCallback(async () => {
    audioBusRef.current ??= new InkAudioBus();
    await audioBusRef.current.enable();
    soundIntentRef.current = true;
    setSoundOn(true);
  }, []);

  const activateJourney = useCallback(() => {
    const reducesMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducesMotion) {
      void enableSound();
    }
    journeyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const focusDelay = reducesMotion ? 0 : 900;
    window.setTimeout(() => journeyRef.current?.focus({ preventScroll: true }), focusDelay);
  }, [enableSound]);

  const toggleSound = useCallback(() => {
    if (soundOn) {
      soundIntentRef.current = false;
      setSoundOn(false);
      return;
    }

    void enableSound();
  }, [enableSound, soundOn]);

  const returnToHero = useCallback(() => {
    prologueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const prologue = prologueRef.current;
    const journey = journeyRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!root || !prologue || !journey) {
      return;
    }

    let animationFrame = 0;

    const render = () => {
      animationFrame = 0;
      const prologueBounds = prologue.getBoundingClientRect();
      const prologueTravel = Math.max(prologueBounds.height - window.innerHeight, 1);
      const prologueProgress = reducedMotion.matches ? 1 : clampProgress(-prologueBounds.top / prologueTravel);
      const journeyBounds = journey.getBoundingClientRect();
      const journeyTravel = Math.max(journeyBounds.height - window.innerHeight, 1);
      const journeyProgress = reducedMotion.matches ? 1 : clampProgress(-journeyBounds.top / journeyTravel);

      root.style.setProperty('--prologue-progress', prologueProgress.toFixed(4));
      root.style.setProperty('--journey-progress', journeyProgress.toFixed(4));

      const phase = prologueProgress < 0.18
        ? 'hero'
        : prologueProgress < 0.46
          ? 'clearing'
          : prologueProgress < 0.6
            ? 'silence'
            : prologueProgress < 0.78
              ? 'impact'
              : 'route';
      root.dataset.phase = phase;

      const nextChapter = getChapterIndex(journeyProgress);
      root.dataset.chapter = `${nextChapter}`;
      if (nextChapter !== activeChapterRef.current) {
        activeChapterRef.current = nextChapter;
        setActiveChapter(nextChapter);
      }

      sceneRefs.current.forEach((scene, index) => {
        if (!scene) {
          return;
        }

        const visibility = getChapterVisibility(journeyProgress, index);
        scene.style.setProperty('--scene-visibility', visibility.toFixed(4));
        scene.toggleAttribute('data-current', index === nextChapter);
      });

      const crossedImpact = prologueProgress >= 0.62 && !impactPlayedRef.current;
      if (crossedImpact && soundIntentRef.current && !reducedMotion.matches) {
        impactPlayedRef.current = true;
        audioBusRef.current?.impact();
      }

      if (prologueProgress < 0.42) {
        impactPlayedRef.current = false;
      }

    };

    const scheduleRender = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const handleMotionPreference = () => {
      root.toggleAttribute('data-reduced-motion', reducedMotion.matches);
      scheduleRender();
    };

    root.toggleAttribute('data-reduced-motion', reducedMotion.matches);
    scheduleRender();
    window.addEventListener('scroll', scheduleRender, { passive: true });
    window.addEventListener('resize', scheduleRender);
    reducedMotion.addEventListener('change', handleMotionPreference);

    return () => {
      window.removeEventListener('scroll', scheduleRender);
      window.removeEventListener('resize', scheduleRender);
      reducedMotion.removeEventListener('change', handleMotionPreference);
      window.cancelAnimationFrame(animationFrame);
      audioBusRef.current?.destroy();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="ink-route-home"
      data-sound={soundOn ? 'on' : 'off'}
    >
      <section ref={prologueRef} className="ink-prologue" aria-labelledby="ink-hero-title">
        <div className="ink-prologue__sticky">
          <div className="ink-paper-grain" aria-hidden="true" />
          <header className="ink-masthead">
            <a className="ink-brand" href="/" aria-label="Logbook Waypoint home">
              <img src="/brand/waypoint-mark.svg" alt="" width="48" height="48" />
              <span><b>Logbook</b><strong>Waypoint</strong></span>
            </a>
            <nav aria-label="Homepage">
              <a href="/docs">Docs</a>
              <a href="https://github.com/logbookfordevs/logbook-waypoint" target="_blank" rel="noreferrer">Source</a>
              <button type="button" onClick={toggleSound} aria-pressed={soundOn}>
                {soundOn && <Volume2 aria-hidden="true" />}
                {!soundOn && <VolumeX aria-hidden="true" />}
                <span>{soundOn ? 'Sound on' : 'Sound off'}</span>
              </button>
            </nav>
          </header>

          <div className="ink-hero">
            <div className="ink-hero__copy">
              <p className="ink-kicker">Local-first visual feedback</p>
              <h1 id="ink-hero-title"><span>Pin the point.</span>{' '}<strong>Chart the change.</strong></h1>
              <p className="ink-hero__promise">Precise visual feedback.<br />Trustworthy agent work.</p>
              <p className="ink-hero__body">
                Mark what you see on a running interface. Waypoint keeps the context together, gives your coding agent a route through the work, and brings the evidence back.
              </p>
              <div className="ink-hero__actions">
                <a className="ink-button ink-button--primary" href="/docs/installation">
                  Get Waypoint <ArrowRight aria-hidden="true" />
                </a>
                <button type="button" className="ink-journey-gate" onClick={activateJourney}>
                  <Route aria-hidden="true" /> See the journey <ArrowRight aria-hidden="true" />
                </button>
                <a className="ink-text-link" href="/docs"><BookOpen aria-hidden="true" /> Field guide</a>
              </div>
              <p className="ink-hero__availability">Development preview · source installation today</p>
            </div>

            <div className="ink-hero__thelu" aria-label="Thelu holding the Waypoint logbook">
              <div className="ink-hero__coordinates" aria-hidden="true">37° 47.20′ N&nbsp;&nbsp;122° 24.80′ W</div>
              <Image
                src="/brand/thelu-ink-route-hero.webp"
                alt="Thelu, a tabby cat in a rust scarf, holding a green logbook"
                width={1122}
                height={1402}
                priority
                sizes="(max-width: 760px) 78vw, 46vw"
              />
              <svg viewBox="0 0 620 720" aria-hidden="true">
                <path d="M66 610 C136 526 156 420 114 328 C76 244 132 142 254 118 C376 94 514 162 548 290" />
                <path d="M456 78 l14 32 l32 14 l-32 14 l-14 32 l-14-32 l-32-14 l32-14z" />
              </svg>
            </div>
          </div>

          <div className="ink-empty-frame" aria-hidden="true">
            <div className="ink-impact-origin"><span /><i /><b /></div>
            <svg viewBox="0 0 1000 700" preserveAspectRatio="none"><path d="M180 548 C218 522 238 480 214 446 C186 408 206 360 274 346" /></svg>
          </div>

          <div className="ink-scroll-cue" aria-hidden="true"><span>Scroll to chart the route</span><i /></div>
        </div>
      </section>

      <section ref={journeyRef} id="journey" className="ink-journey" aria-labelledby="journey-heading" tabIndex={-1}>
        <h2 id="journey-heading" className="sr-only">The Waypoint journey from Annotation to Resolution</h2>
        <div className="ink-journey__sticky">
          <div className="ink-paper-grain" aria-hidden="true" />
          <div className="ink-journey__topline">
            <button type="button" onClick={returnToHero}>← Waypoint</button>
            <p aria-live="polite"><span>Now charting</span>{chapters[activeChapter].label}</p>
            <button type="button" onClick={toggleSound} aria-pressed={soundOn}>
              {soundOn && <Volume2 aria-hidden="true" />}
              {!soundOn && <VolumeX aria-hidden="true" />}
              <span>{soundOn ? 'Sound on' : 'Sound off'}</span>
            </button>
          </div>

          <ol className="ink-chapter-index" aria-label="Journey chapters">
            {chapters.map((chapter, index) => (
              <li key={chapter.label} data-active={index === activeChapter ? '' : undefined}>
                <span>0{index + 1}</span><b>{chapter.label}</b>
              </li>
            ))}
          </ol>

          <div className="ink-scenes">
            <article ref={(node) => { sceneRefs.current[0] = node; }} className="ink-scene ink-scene--annotation" data-current>
              <div className="ink-scene__copy"><p>{chapters[0].bearing}</p><h3>{chapters[0].title}</h3><blockquote>{chapters[0].copy}</blockquote></div>
              <div className="annotation-shot" aria-label="A precise annotation on a running interface">
                <div className="annotation-shot__browser">
                  <div className="annotation-shot__chrome"><i /><i /><i /><code>localhost:3000/onboarding</code></div>
                  <div className="annotation-shot__page"><span /><span /><strong><b>1</b></strong><span /></div>
                </div>
                <div className="annotation-shot__note"><Crosshair aria-hidden="true" /><p><small>Target retained</small><b>Tighten this empty state.</b><code>section.empty-state</code></p></div>
                <span className="annotation-shot__ink" aria-hidden="true" />
              </div>
            </article>

            <article ref={(node) => { sceneRefs.current[1] = node; }} className="ink-scene ink-scene--queue">
              <div className="ink-scene__copy"><p>{chapters[1].bearing}</p><h3>{chapters[1].title}</h3><blockquote>{chapters[1].copy}</blockquote></div>
              <div className="queue-shot" aria-label="The annotation retained in the local Queue">
                <div className="queue-shot__heading"><Route aria-hidden="true" /><span><small>Local Queue</small><b>One clear thing to change</b></span><code>01 pending</code></div>
                <div className="queue-shot__row"><span>1</span><p><b>Tighten this empty state.</b><small>Target · screenshot · viewport · source lead</small></p><strong>Pending</strong></div>
                <div className="queue-shot__ledger"><span>Watch</span><i /><span>Claim</span><i /><span>Resolve</span></div>
                <p className="queue-shot__boundary"><LockKeyhole aria-hidden="true" /> 127.0.0.1 · retained locally</p>
              </div>
            </article>

            <article ref={(node) => { sceneRefs.current[2] = node; }} className="ink-scene ink-scene--agent">
              <div className="ink-scene__copy ink-scene__copy--light"><p>{chapters[2].bearing}</p><h3>{chapters[2].title}</h3><blockquote>{chapters[2].copy}</blockquote></div>
              <div className="agent-shot" aria-label="A coding agent reading and claiming the annotation through MCP">
                <div className="agent-shot__radar" aria-hidden="true"><i /><i /><i /><b /></div>
                <div className="agent-shot__terminal">
                  <p><span>waypoint_mcp</span><code>watch_annotations</code></p>
                  <pre><b>→</b> Annotation wp_1842{`\n`}  status  <em>Pending</em>{`\n`}  target  section.empty-state{`\n`}  brief   “Tighten this empty state.”</pre>
                  <p><span>agent</span><code>claim_annotation</code></p>
                  <div><Radio aria-hidden="true" /><b>Claimed</b><small>Implementation in progress</small></div>
                </div>
              </div>
            </article>

            <article ref={(node) => { sceneRefs.current[3] = node; }} className="ink-scene ink-scene--resolution">
              <div className="ink-scene__copy"><p>{chapters[3].bearing}</p><h3>{chapters[3].title}</h3><blockquote>{chapters[3].copy}</blockquote></div>
              <div className="resolution-shot" aria-label="A resolved annotation with implementation evidence">
                <svg viewBox="0 0 460 310" aria-hidden="true"><path d="M40 250 C76 166 146 222 182 148 S286 50 346 94 S402 190 376 230" /><circle cx="40" cy="250" r="6" /><circle cx="182" cy="148" r="6" /><circle cx="376" cy="230" r="6" /></svg>
                <div className="resolution-shot__record">
                  <div><Check aria-hidden="true" /><span><small>Resolution Record</small><b>Empty state tightened</b></span><strong>Resolved</strong></div>
                  <dl><div><dt>Change</dt><dd>Balanced measure and spacing</dd></div><div><dt>Checks</dt><dd>Typecheck · component tests</dd></div><div><dt>Returned to</dt><dd>section.empty-state</dd></div></dl>
                </div>
                <p><span>Human judgment returns</span><b>Inspect it. Keep it. Continue.</b></p>
              </div>
            </article>
          </div>

          <div className="ink-journey__progress" aria-hidden="true"><span /></div>
        </div>
      </section>

      <section id="local-first" className="ink-payoff" aria-labelledby="ink-payoff-title">
        <div className="ink-paper-grain" aria-hidden="true" />
        <div className="ink-payoff__route" aria-hidden="true">
          <svg viewBox="0 0 620 440"><path d="M42 362 C128 244 228 394 304 238 S466 50 570 112" /><circle cx="42" cy="362" r="8" /><circle cx="304" cy="238" r="8" /><circle cx="570" cy="112" r="8" /></svg>
          <Image src="/brand/thelu-profile.webp" alt="" width={260} height={260} />
        </div>
        <div className="ink-payoff__copy">
          <p className="ink-kicker">The route stays yours</p>
          <h2 id="ink-payoff-title">Local by default. <br />Useful after the work.</h2>
          <p>Waypoint keeps Annotation history inspectable on your machine. Your agent gets a narrow working channel—not a public browser control surface.</p>
          <ul>
            <li><LockKeyhole aria-hidden="true" /><span><b>Loopback-first</b><small>Supported server boundary on IPv4 loopback</small></span></li>
            <li><Radio aria-hidden="true" /><span><b>Non-destructive Watch</b><small>Delivery never silently Claims or removes feedback</small></span></li>
            <li><Check aria-hidden="true" /><span><b>Retained evidence</b><small>Resolution remains inspectable until explicit Deletion</small></span></li>
          </ul>
          <div className="ink-payoff__actions">
            <a className="ink-button ink-button--primary" href="/docs/installation">Get Waypoint <ArrowRight aria-hidden="true" /></a>
            <a className="ink-button" href="/docs">Read the field guide <BookOpen aria-hidden="true" /></a>
            <a className="ink-text-link" href="https://github.com/logbookfordevs/logbook-waypoint" target="_blank" rel="noreferrer"><GitFork aria-hidden="true" /> View source</a>
          </div>
          <p className="ink-payoff__note">Development preview. The extension and server are built from source while public distribution takes shape.</p>
        </div>
      </section>
    </div>
  );
}
