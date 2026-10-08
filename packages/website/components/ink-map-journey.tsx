'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { InkMapAudio } from '@/components/ink-map-audio';
import { createInkMapJourney } from '@/components/ink-map-engine';

export interface InkMapJourneyProps {
  onContinue?: () => void;
  onExit?: () => void;
  inline?: boolean;
  /** Hold the opening until the visitor lets the ink fall. */
  entrance?: boolean;
}

export function InkMapJourney({ onContinue, onExit, inline = false, entrance = false }: InkMapJourneyProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [audio] = useState(() => new InkMapAudio());
  const [soundOn, setSoundOn] = useState(false);
  const [entranceOpen, setEntranceOpen] = useState(entrance);
  const awaitingBegin = useRef(entrance);

  const leaveMap = useCallback((leave?: () => void) => {
    audio.setActive(false);
    leave?.();
  }, [audio]);
  const continueOnward = useCallback(() => leaveMap(onContinue), [leaveMap, onContinue]);
  const exitMap = useCallback(() => leaveMap(onExit), [leaveMap, onExit]);
  const hasContinuation = Boolean(onContinue);
  const canPlaySound = InkMapAudio.isSupported();

  const begin = useCallback((withSound: boolean) => {
    awaitingBegin.current = false;
    const root = rootRef.current;
    const hadFocus = Boolean(root?.querySelector('.map-entrance')?.contains(document.activeElement));
    // The entrance unmounts; keyboard focus moves to the control that continues the journey.
    if (hadFocus) queueMicrotask(() => root?.querySelector<HTMLButtonElement>('#next')?.focus({ preventScroll: true }));
    setEntranceOpen(false);
    if (!withSound || !canPlaySound) return;
    audio.setActive(true);
    audio.setEnabled(true);
    setSoundOn(true);
  }, [audio, canPlaySound]);

  useEffect(() => {
    if (!rootRef.current) return;
    const waiting = awaitingBegin.current;
    const dispose = createInkMapJourney(rootRef.current, { onContinue: hasContinuation ? continueOnward : undefined, inline, sound: audio, entrance: waiting, onBegin: begin });
    if (waiting && dispose) audio.preload();
    if (waiting && !dispose) setEntranceOpen(false);
    if (!inline) rootRef.current.querySelector<HTMLButtonElement>('.map-home-link')?.focus({ preventScroll: true });
    return dispose;
  }, [audio, begin, continueOnward, hasContinuation, inline]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const tick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('button') && !event.target.closest('.map-entrance')) audio.cue('tick');
    };

    root.addEventListener('click', tick);

    return () => {
      root.removeEventListener('click', tick);
      audio.dispose();
    };
  }, [audio]);

  const toggleSound = () => {
    const next = !soundOn;
    audio.setActive(true);
    audio.setEnabled(next);
    setSoundOn(next);
  };

  const canExit = Boolean(onExit);
  const canContinue = hasContinuation;
  const soundLabel = soundOn ? 'Sound on' : 'Sound off';
  const exitLabel = inline ? 'Skip to details' : 'Back to homepage';
  const continueLabel = inline ? 'More details' : 'Make your own mark';

  return (
    <div ref={rootRef} className={`ink-map no-webgl${inline ? ' ink-map--inline' : ''}`}>
<canvas id="scene" aria-hidden="true" />
<svg id="leader" aria-hidden="true" focusable="false"><line id="leader-line" x1="0" y1="0" x2="0" y2="0"/></svg>

<header className="topbar">
  {canExit && <button type="button" className="wordmark map-home-link" onClick={exitMap} aria-label={exitLabel}><ArrowLeft aria-hidden="true" /><span className="wordmark-name">{inline ? 'Skip to details' : 'Waypoint'}</span></button>}
  {!canExit && <p className="wordmark"><span className="wordmark-name">Waypoint</span><span className="wordmark-sub">Route briefing</span></p>}
  {canPlaySound && <button type="button" className="map-sound" aria-pressed={soundOn} onClick={toggleSound}>
    {soundOn && <Volume2 aria-hidden="true" />}
    {!soundOn && <VolumeX aria-hidden="true" />}
    <span className="map-sound-label">{soundLabel}</span>
  </button>}
  <nav aria-label="Checkpoints">
    <ol className="rail">
      <li><button type="button" className="rail-btn" data-go="1" data-state="upcoming"><span className="rail-mark" aria-hidden="true"></span><span className="rail-num" aria-hidden="true">01</span><span className="rail-name">Annotate</span></button></li>
      <li><button type="button" className="rail-btn" data-go="2" data-state="upcoming"><span className="rail-mark" aria-hidden="true"></span><span className="rail-num" aria-hidden="true">02</span><span className="rail-name">Queue</span></button></li>
      <li><button type="button" className="rail-btn" data-go="3" data-state="upcoming"><span className="rail-mark" aria-hidden="true"></span><span className="rail-num" aria-hidden="true">03</span><span className="rail-name">Agent pick</span></button></li>
      <li><button type="button" className="rail-btn" data-go="4" data-state="upcoming"><span className="rail-mark" aria-hidden="true"></span><span className="rail-num" aria-hidden="true">04</span><span className="rail-name">Check results</span></button></li>
    </ol>
  </nav>
</header>

<div className="ink-map-notes">
  <p className="fallback-note">This browser can't draw the animated chart, so the route is laid out as field notes.</p>

  <section className="card" id="card-0" data-station="0" aria-labelledby="t0">
    <div className="card-scroll" tabIndex={0}>
      <p className="card-label">Field notes · Waypoint</p>
      {inline && <h2 id="t0">Chart the route before the build.</h2>}
      {!inline && <h1 id="t0">Chart the route before the build.</h1>}
      <p>Follow the ink from a note on your screen to finished work. Four checkpoints, one route.</p>
      <p className="card-hint" id="start-hint">Scroll, press ↓ or select Set course to follow the ink.</p>
    </div>
  </section>

  <section className="card" id="card-1" data-station="1" aria-labelledby="t1">
    <div className="card-scroll" tabIndex={0}>
      <p className="card-label">Checkpoint 01 · Annotate</p>
      <h2 id="t1">Pin the note where the problem lives.</h2>
      <p>Click an element in your running app and write what should change. Waypoint keeps the element, a screenshot and the page route with your words, so nobody has to describe the spot twice.</p>
      <ul className="chips od-cluster" aria-label="Kept with every note">
        <li>element</li>
        <li>screenshot</li>
        <li>page route</li>
        <li>your words</li>
      </ul>
    </div>
  </section>

  <section className="card" id="card-2" data-station="2" aria-labelledby="t2">
    <div className="card-scroll" tabIndex={0}>
      <p className="card-label">Checkpoint 02 · Queue</p>
      <h2 id="t2">Every note joins the manifest.</h2>
      <p>Annotations line up per project as open work. See what is waiting, what is being worked and what is done, without leaving the page you are reviewing.</p>
      <ul className="queue" aria-label="Example queue">
        <li className="od-row"><span className="status-mark" data-status="open" aria-hidden="true"></span><span className="od-field od-fill"><span className="q-status">Open</span><span className="q-title">Button label wraps on mobile</span></span></li>
        <li className="od-row"><span className="status-mark" data-status="claimed" aria-hidden="true"></span><span className="od-field od-fill"><span className="q-status">Claimed</span><span className="q-title">Empty state needs a next step</span></span></li>
        <li className="od-row"><span className="status-mark" data-status="resolved" aria-hidden="true"></span><span className="od-field od-fill"><span className="q-status">Resolved</span><span className="q-title">Header contrast on the pricing page</span></span></li>
      </ul>
    </div>
  </section>

  <section className="card" id="card-3" data-station="3" aria-labelledby="t3">
    <div className="card-scroll" tabIndex={0}>
      <p className="card-label">Checkpoint 03 · Agent pick</p>
      <h2 id="t3">An agent claims the next bearing.</h2>
      <p>Your coding agent reads the queue over MCP and claims a note, so no two agents work it twice. It gets the full context: the element, the screenshot and what you asked for.</p>
      <pre className="code" aria-label="An agent claims a note"><code><span className="dim">&gt;</span>{` claim_annotation
  note:   "Button label wraps"
  status: open → claimed`}</code></pre>
    </div>
  </section>

  <section className="card" id="card-4" data-station="4" aria-labelledby="t4">
    <div className="card-scroll" tabIndex={0}>
      <p className="card-label">Checkpoint 04 · Check results</p>
      <h2 id="t4">Check the work against the note.</h2>
      <p>When the agent resolves a note, it says what changed. Review it on the live page, keep it, or release it back to the queue. Unsure which way to go? Ask for variants.</p>
      <dl className="outcomes">
        <div className="od-field"><dt>Resolved</dt><dd>Review the change where the note was pinned.</dd></div>
        <div className="od-field"><dt>Released</dt><dd>The note goes back to the queue for another pass.</dd></div>
        <div className="od-field"><dt>Variants</dt><dd>Compare options and keep the one that fits.</dd></div>
      </dl>
    </div>
  </section>

  <section className="card" id="card-5" data-station="5" aria-labelledby="t5">
    <div className="card-scroll" tabIndex={0}>
      <p className="card-label">End of route</p>
      <h2 id="t5">The route, charted.</h2>
      <p>Annotate, queue, pick, check. Every note keeps its bearing from the first mark to the finished change.</p>
      <ol className="route-summary" aria-label="Checkpoints on this route">
        <li><span className="num">01</span><span>Annotate</span></li>
        <li><span className="num">02</span><span>Queue</span></li>
        <li><span className="num">03</span><span>Agent pick</span></li>
        <li><span className="num">04</span><span>Check results</span></li>
      </ol>
      <div className="attribution">
        <p className="by">A tool from Logbook for Devs</p>
        <p className="motto">Charting the technical seas, one commit at a time.</p>
      </div>
      {canContinue && <button type="button" className="map-replay" data-replay><RotateCcw aria-hidden="true" /> Replay the journey</button>}
    </div>
  </section>
  {canContinue && <button type="button" className="btn btn-primary map-fallback-continue" onClick={continueOnward}>{continueLabel}</button>}
</div>

{entranceOpen && <div className="map-entrance">
  <button type="button" className="map-entrance-press" data-begin><span className="map-entrance-title">Let the ink fall</span></button>
  <button type="button" className="map-entrance-silent" data-begin-silent>Begin without sound</button>
</div>}

<footer className="controls" aria-label="Journey controls">
  <button type="button" className="btn btn-secondary" id="back" aria-disabled="true">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
    <span className="btn-text">Back</span>
  </button>
  <p className="hint" id="hint">The ink is landing…</p>
  <button type="button" className="btn btn-primary" id="next">
    <span id="next-label">Skip intro</span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path id="next-path" d="M9 6l6 6-6 6"/></svg>
  </button>
</footer>

<p id="announce" className="sr-only" aria-live="polite"></p>
    </div>
  );
}
