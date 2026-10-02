'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { advanceChapter, sampleNote, type Chapter, type StoryEvent } from '@/components/storybook-lab/story-model';

const Diorama = dynamic(() => import('@/components/storybook-lab/diorama'), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function StorybookLab() {
  const [chapter, setChapter] = useState<Chapter>('overview');
  const [note, setNote] = useState(sampleNote);
  const [readable, setReadable] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [ready, setReady] = useState(false);
  const [moving, setMoving] = useState(false);
  const [skip, setSkip] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [sound, setSound] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const caption = useRef<HTMLElement>(null);
  const focusedChapter = useRef<Chapter>('overview');
  const transitionLock = useRef(false);
  const isOverview = chapter === 'overview';
  const isAnnotation = chapter === 'annotation';
  const isCaptured = chapter === 'captured';
  const isQueue = chapter === 'queue';
  const hasRecord = isCaptured || isQueue;
  const usesReadableEdition = readable || reduced;
  const showsWorld = ready && !usesReadableEdition;
  const canPin = note.trim().length > 0 && !moving;
  const showsComposer = isAnnotation && !moving;
  const showsJourneyGate = isOverview;
  const showsViewingControls = showsWorld && !moving;
  const isAnnotationChapter = !isOverview && !isQueue;
  const cannotRestart = moving || isOverview;
  const heading = isOverview ? 'Small observations.\nExtraordinary journeys.' : isQueue ? 'A place for\nwhat comes next.' : 'Every change starts\nwith a point.';
  const chapterNumber = isOverview ? '00' : isQueue ? '02' : '01';

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReduced(query.matches); setMoving(false); transitionLock.current = false; };
    update();
    setReady(true);
    const directChapter = window.location.hash.slice(1);
    if (directChapter === 'annotation' || directChapter === 'queue') setChapter(directChapter);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const player = new Audio('/ink-route/waypoint-annotation-narration-grandpa-pace-0.92x-take-01.mp3');
    player.preload = 'none';
    audio.current = player;
    const pauseWhenHidden = () => { if (document.hidden) player.pause(); };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => { player.pause(); player.removeAttribute('src'); player.load(); audio.current = null; document.removeEventListener('visibilitychange', pauseWhenHidden); };
  }, []);

  useEffect(() => {
    if (!moving && focusedChapter.current !== chapter) {
      focusedChapter.current = chapter;
      caption.current?.focus({ preventScroll: true });
    }
  }, [chapter, moving]);

  const arrive = useCallback(() => { transitionLock.current = false; setMoving(false); }, []);
  const fallback = useCallback(() => { setReadable(true); transitionLock.current = false; setMoving(false); }, []);

  function travel(event: StoryEvent) {
    if (transitionLock.current) return;
    const next = advanceChapter(chapter, event);
    if (next === chapter) return;
    const needsCamera = next !== 'captured' && showsWorld;
    transitionLock.current = needsCamera;
    setMoving(needsCamera);
    setChapter(next);
    window.history.replaceState(null, '', next === 'overview' ? window.location.pathname : `#${next}`);
    setBearing(0);
    if (audio.current) {
      audio.current.pause();
      if (event === 'open' && sound) {
        audio.current.currentTime = 0;
        void audio.current.play().catch(() => setAudioUnavailable(true));
      }
    }
  }

  function skipTravel() {
    setSkip(value => value + 1);
    arrive();
  }

  function toggleSound() {
    const enabled = !sound;
    setSound(enabled);
    setAudioUnavailable(false);
    if (!audio.current) return;
    if (!enabled) audio.current.pause();
    if (enabled && !isOverview && !isQueue) void audio.current.play().catch(() => setAudioUnavailable(true));
  }

  function toggleReadable() {
    setReadable(value => !value);
    arrive();
  }

  return (
    <main className="atlas-lab" id="main-content" data-chapter={chapter} data-moving={moving}>
      <header className="atlas-masthead">
        <a className="atlas-brand" href="/" aria-label="Logbook Waypoint home"><img src="/brand/waypoint-mark.svg" width={30} height={30} alt="" /><span>LOGBOOK <b>WAYPOINT</b></span></a>
        <span className="atlas-edition">AN ATLAS OF SMALL CHANGES · VOL. 01</span>
        <nav aria-label="Product"><a href="/docs">Docs</a><a className="atlas-install" href="https://github.com/logbookfordevs/logbook-waypoint">Get Waypoint <ArrowRight size={15} /></a></nav>
      </header>

      <div className="atlas-theatre">
        <div className="atlas-intro">
          <p className="atlas-eyebrow">THE INTERACTIVE FIELD GUIDE <span> / {chapterNumber}</span></p>
          <h1>{heading}</h1>
          <p className="atlas-lede">Visual feedback, given a place in the world.<br />{' '}From your browser to your coding agent.</p>
        </div>

        <div className="atlas-stage" aria-hidden="true">
          {showsWorld && <SceneBoundary onFailure={fallback}><Diorama chapter={chapter} bearing={bearing} skip={skip} onArrive={arrive} onFailure={fallback} /></SceneBoundary>}
          {!showsWorld && <div className="atlas-static"><img src="/ink-route/chart-world-desktop-v1.webp" alt="" /><span>ANNOTATION <i>→</i> QUEUE <i>→</i> CODING AGENT</span></div>}
        </div>

        <section ref={caption} tabIndex={-1} className="atlas-caption" aria-label="Current chapter">
          <div className="atlas-chapter-label"><span className="atlas-dot" />{isOverview ? 'THE PROLOGUE' : isQueue ? '02 / THE QUEUE' : '01 / ANNOTATION'}</div>
          <div className="atlas-story" aria-live="polite" aria-atomic="true">
            {isOverview && <p>A thought becomes a point.<br />{' '}A point becomes a path.<br />{' '}<em>Let’s see where yours leads.</em></p>}
            {isAnnotation && <p>Find the thing you want to change.<br />{' '}Leave the thought <em>right there.</em></p>}
            {isCaptured && <p>Your observation has an address.<br />{' '}Now give it <em>a way forward.</em></p>}
            {isQueue && <p>Same point. Same context.<br />{' '}Ready for your coding agent<br />{' '}to <em>pick up the thread.</em></p>}
          </div>
          {showsJourneyGate && <button className="atlas-primary" onClick={() => travel('open')} disabled={moving}>Open the atlas <ArrowRight size={18} /></button>}
          {showsComposer && <form onSubmit={event => { event.preventDefault(); if (canPin) travel('pin'); }}>
            <label htmlFor="atlas-note">Try it. What would you change?</label>
            <textarea id="atlas-note" value={note} onChange={event => setNote(event.target.value)} maxLength={180} rows={3} />
            <button className="atlas-primary" type="submit" disabled={!canPin}>Pin annotation <span>↗</span></button>
          </form>}
          {hasRecord && <div className="atlas-record"><div><span>WP-001</span><b>{isQueue ? 'QUEUED' : 'PINNED'} <Check size={12} /></b></div><p>{note}</p><small>button.primary · /example · browser context</small></div>}
          {isCaptured && <button className="atlas-primary" onClick={() => travel('dispatch')} disabled={moving}>Send to Queue <ArrowRight size={18} /></button>}
          {isQueue && <p className="atlas-endnote">End of this playable chapter.<br />{' '}Annotation → Queue → coding agent.</p>}
          {moving && <button className="atlas-skip" onClick={skipTravel}>Traveling… skip to destination →</button>}
        </section>

        {showsViewingControls && <div className="atlas-bearing"><button aria-label="View from the left" onClick={() => setBearing(value => Math.max(-1, value - 0.5))} disabled={bearing <= -1}><ArrowLeft size={15} /></button><span>CHANGE YOUR PERSPECTIVE</span><button aria-label="View from the right" onClick={() => setBearing(value => Math.min(1, value + 0.5))} disabled={bearing >= 1}><ArrowRight size={15} /></button></div>}
        <div className="atlas-plate-number">FIG. {chapterNumber}<br />{' '}<span>A WORKING WORLD<br />{' '}IN MINIATURE</span></div>
      </div>

      <footer className="atlas-controls">
        <div className="atlas-chapters" role="group" aria-label="Journey progress"><span data-active={isOverview}>00 <b>Prologue</b></span><i /><span data-active={isAnnotationChapter}>01 <b>Annotation</b></span><i /><span data-active={isQueue}>02 <b>Queue</b></span></div>
        <div className="atlas-tools"><button onClick={() => travel('restart')} disabled={cannotRestart}><RotateCcw size={15} /><span>Restart</span></button><button onClick={toggleSound} aria-pressed={sound}><>{sound && <Volume2 size={16} />}{!sound && <VolumeX size={16} />}</><span>{sound ? 'Voice on' : 'Voice off'}</span></button><button onClick={toggleReadable} aria-pressed={usesReadableEdition} disabled={reduced}><BookOpen size={16} /><span>{usesReadableEdition ? 'Readable edition' : 'Read instead'}</span></button></div>
      </footer>
      {audioUnavailable && <p className="atlas-audio-status" role="status">Voice is unavailable. The complete story is written on the page.</p>}
      <p className="atlas-lab-note">WAYPOINT LAB / A playable illustration. Your example stays in this page; no annotation is sent.</p>
    </main>
  );
}
