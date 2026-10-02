'use client';

import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-canvas';
import { ArrowDown, ArrowRight, Check, CornerDownLeft, MapPin, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useMediaQuery } from '@/lib/use-media-query';

RuntimeLoader.setWasmUrl('/labs/rive/rive.wasm');
RuntimeLoader.setWasmFallbackUrl('/labs/rive/rive_fallback.wasm');

type Chapter = 0 | 1 | 2;
const titles = ['Every change starts with a closer look.', 'Pin the point. Keep the thought.', 'A note becomes a next step.'];
const descriptions = [
  'You see something your coding agent cannot. Waypoint gives that observation a place to begin.',
  'An Annotation keeps your feedback attached to the element that inspired it. Be specific. The context travels with you.',
  'The Queue retains your Annotation and its target, ready for a coding agent to inspect, claim, and resolve.',
];
const chapters = ['Observe', 'Annotation', 'Queue'];
const defaultNote = 'Give this button a clearer label: “Start your journey”.';

function LivingFolio({ chapter, onFailure }: { chapter: Chapter; onFailure: () => void }) {
  const { rive, RiveComponent } = useRive({
    src: '/labs/rive/field-guide.riv',
    stateMachine: 'FieldGuide',
    autoBind: true,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoadError: onFailure,
    shouldDisableRiveListeners: true,
  });

  useEffect(() => {
    if (rive) return;
    const timeout = window.setTimeout(onFailure, 8000);
    return () => window.clearTimeout(timeout);
  }, [rive, onFailure]);

  useEffect(() => {
    const property = rive?.viewModelInstance?.number('chapter');
    if (property) property.value = chapter;
  }, [rive, chapter]);

  useEffect(() => {
    if (!rive) return;
    const handleVisibility = () => {
      if (document.hidden) rive.pause();
      else rive.play('FieldGuide');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [rive]);

  return <RiveComponent className="folio-canvas" aria-hidden="true" />;
}

export function FieldGuide() {
  const [chapter, setChapter] = useState<Chapter>(0);
  const [note, setNote] = useState(defaultNote);
  const [sound, setSound] = useState(false);
  const [readable, setReadable] = useState(false);
  const [failed, setFailed] = useState(false);
  const handleFailure = useCallback(() => setFailed(true), []);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const audio = useRef<AudioContext | null>(null);
  const noteInput = useRef<HTMLTextAreaElement>(null);
  const receipt = useRef<HTMLDivElement>(null);
  const startAction = useRef<HTMLButtonElement>(null);
  const movesFocus = useRef(false);
  const isObserve = chapter === 0;
  const isAnnotation = chapter === 1;
  const isQueued = chapter === 2;
  const isReadableForced = reducedMotion || failed;
  const readableStatus = reducedMotion ? 'Reduced motion · readable' : 'Readable fallback';
  const staticCut = isReadableForced || readable;
  const canPinOnCanvas = isObserve && !staticCut;
  const canQueue = note.trim().length > 0;

  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash;
      if (hash === '#queue') setChapter(2);
      if (hash === '#annotation') setChapter(1);
      if (hash === '#observe') setChapter(0);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    const audioContext = audio;
    return () => {
      window.removeEventListener('hashchange', readHash);
      void audioContext.current?.close();
    };
  }, []);

  useEffect(() => {
    const suspend = () => {
      if (document.hidden) void audio.current?.suspend();
    };
    document.addEventListener('visibilitychange', suspend);
    return () => document.removeEventListener('visibilitychange', suspend);
  }, []);

  useEffect(() => {
    if (!movesFocus.current) return;
    movesFocus.current = false;
    if (chapter === 0) startAction.current?.focus();
    if (chapter === 1) noteInput.current?.focus();
    if (chapter === 2) receipt.current?.focus();
  }, [chapter]);

  function cue(next: Chapter) {
    if (!sound) return;
    const context = audio.current ?? new AudioContext();
    audio.current = context;
    void context.resume().then(() => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(next === 2 ? 440 : 330, context.currentTime);
      envelope.gain.setValueAtTime(0, context.currentTime);
      envelope.gain.linearRampToValueAtTime(0.045, context.currentTime + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
      oscillator.connect(envelope).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.22);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    }).catch(() => setSound(false));
  }

  function go(next: Chapter) {
    if (next === 2 && !canQueue) return;
    movesFocus.current = next !== chapter;
    setChapter(next);
    window.history.replaceState(null, '', ['#observe', '#annotation', '#queue'][next]);
    cue(next);
  }

  function toggleSound() {
    if (sound) void audio.current?.suspend();
    setSound(!sound);
  }

  return (
    <main id="main-content" className="rive-lab" data-chapter={chapter}>
      <header className="guide-masthead">
        <a href="/" className="guide-brand"><img src="/brand/waypoint-mark.svg" width="35" height="35" alt="" /><span>Logbook <strong>Waypoint</strong></span></a>
        <span className="guide-edition">The living field guide</span>
        <a className="guide-install" href="/docs/installation">Get Waypoint <ArrowRight size={16} /></a>
      </header>

      <div className="guide-workspace">
        <section className="guide-story" aria-labelledby="guide-title">
          <h1 id="guide-title">{titles[chapter]}</h1>
          <p className="guide-description">{descriptions[chapter]}</p>

          <div className="guide-action-area">
            {isObserve && <><button ref={startAction} className="guide-primary" onClick={() => go(1)}><MapPin size={18} /> Pin an observation</button><p className="guide-aside">Try it on the sample interface in this field guide.</p></>}
            {isAnnotation && <><label className="guide-note-label" htmlFor="field-note">Your field note</label><textarea ref={noteInput} id="field-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={400} rows={3} /><button className="guide-primary" disabled={!canQueue} onClick={() => go(2)}>Send to the Queue <ArrowRight size={18} /></button></>}
            {isQueued && <><div ref={receipt} className="guide-receipt" tabIndex={-1} role="group" aria-label="Annotation in the sample Queue"><span><Check size={16} /> In the sample Queue</span><blockquote>{note}</blockquote><code>Target · button / hero</code></div><p className="guide-aside">Your coding agent receives the context, not just the comment.</p><button className="guide-text-button" onClick={() => go(1)}>Edit the Annotation <CornerDownLeft size={16} /></button></>}
          </div>
          <div className="guide-status" role="status" aria-live="polite">{isQueued && 'Annotation retained. Ready for a coding agent.'}{isAnnotation && 'Target pinned. Add your note, then send it to the Queue.'}</div>
        </section>

        <section className="guide-world" aria-label="Interactive field guide illustration">
          <div className="guide-registration"><span>FIELD STUDY / LOCAL INTERFACE</span><span>FIG. {chapter + 1}</span></div>
          <div className="guide-folio">
            {!staticCut && <LivingFolio chapter={chapter} onFailure={handleFailure} />}
            {staticCut && <div className="guide-static"><img src="/ink-route/chart-world-desktop-v1.webp" alt="Illustrated paper chart with an Annotation destination." /><div><MapPin size={30} /><strong>{chapters[chapter]}</strong><p>{descriptions[chapter]}</p></div></div>}
            {canPinOnCanvas && <button className="guide-pin-target" onClick={() => go(1)} aria-label="Pin the sample interface button"><MapPin size={18} /><span>Pin here</span></button>}
          </div>
          <div className="guide-caption"><span className="guide-specimen">{['An interface, waiting for your eye.', 'One precise point. The whole context.', 'Same observation. Ready to travel.'][chapter]}</span><span className="guide-figure">{['Observe → Annotate', 'Annotation → Queue', 'Queue → Coding agent'][chapter]}</span></div>
        </section>
      </div>

      <footer className="guide-controls">
        <nav aria-label="Field guide chapters" className="guide-chapters">{chapters.map((name, index) => <button key={name} onClick={() => go(index as Chapter)} aria-current={chapter === index ? 'step' : undefined}><span>0{index + 1}</span> {name}</button>)}</nav>
        <div className="guide-options"><button onClick={() => go(0)} aria-label="Replay the field guide"><RotateCcw size={16} /></button><button onClick={toggleSound} aria-pressed={sound}>{sound && <Volume2 size={16} />}{!sound && <VolumeX size={16} />}<span>Sound {sound ? 'on' : 'off'}</span></button>{isReadableForced && <span className="guide-readable-status" role="status">{readableStatus}</span>}{!isReadableForced && <button aria-pressed={readable} onClick={() => setReadable(!readable)}>Readable view</button>}</div>
      </footer>
      <div className="guide-colophon"><p>Illustrative lab · no real work is submitted.</p><a href="#field-guide-notes">How the handoff works <ArrowDown size={14} /></a><p>A tool from <a href="https://logbookfordevs.com/">Logbook for Devs</a></p></div>
      <section id="field-guide-notes" className="guide-reading">
        <h2>From what you see<br />to what gets changed.</h2>
        <ol><li><strong>Annotation</strong><p>Place feedback on a page or element. Keep the target and your intent together.</p></li><li><strong>Queue</strong><p>Waypoint retains the context locally so it stays available beyond the moment you noticed it.</p></li><li><strong>Coding agent</strong><p>An MCP-compatible agent can inspect, claim, and resolve the work. You review the result.</p></li></ol>
        <a href="/docs">Read the Waypoint guide <ArrowRight size={17} /></a><p className="guide-aside">Charting the technical seas, one commit at a time.</p>
        {failed && <p role="status">The animated folio could not load. The readable field guide and all actions remain available.</p>}
      </section>
    </main>
  );
}
