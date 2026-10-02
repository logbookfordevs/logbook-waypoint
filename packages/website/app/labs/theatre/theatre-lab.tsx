'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { ISheet } from '@theatre/core';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Crosshair, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { ANNOTATION_TIME, END_TIME, SHEET_NAME, chapterAt, composition, destinationAfter, projectState } from '@/app/labs/theatre/score';

const voice = '/ink-route/waypoint-annotation-narration-grandpa-pace-0.92x-take-01.mp3';

export function TheatreLab() {
  const instance = useId();
  const root = useRef<HTMLElement>(null);
  const sheet = useRef<ISheet | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const timeLabel = useRef<HTMLOutputElement>(null);
  const scrubber = useRef<HTMLInputElement>(null);
  const playing = useRef(false);
  const sound = useRef(false);
  const epoch = useRef(0);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [chapter, setChapter] = useState<ReturnType<typeof chapterAt>>('opening');
  const [atEnd, setAtEnd] = useState(false);
  const [atAnnotation, setAtAnnotation] = useState(false);
  const [caption, setCaption] = useState(0);
  const [muted, setMuted] = useState(true);
  const [readable, setReadable] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [pace, setPace] = useState(1);

  function pause() {
    epoch.current += 1;
    playing.current = false;
    sheet.current?.sequence.pause();
    audio.current?.pause();
    setRunning(false);
  }

  function seek(position: number) {
    pause();
    if (sheet.current) sheet.current.sequence.position = position;
  }

  async function play() {
    const current = sheet.current;
    if (!current) return;
    if (playing.current) { pause(); return; }
    if (current.sequence.position >= END_TIME - 0.01) current.sequence.position = 0;
    const end = destinationAfter(current.sequence.position);
    if (reduced) { seek(end); return; }
    const token = ++epoch.current;
    playing.current = true;
    setRunning(true);
    const finished = await current.sequence.play({ range: [current.sequence.position, end], rate: pace });
    if (token !== epoch.current) return;
    playing.current = false;
    setRunning(false);
    audio.current?.pause();
    if (finished) current.sequence.position = end;
  }

  function toggleSound() {
    sound.current = !sound.current;
    setMuted(!sound.current);
    if (!sound.current) audio.current?.pause();
  }

  useEffect(() => {
    let disposed = false;
    let releaseValues = () => {};
    let releaseTime = () => {};
    let voicePending = false;
    const mediaElement = audio.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      setReduced(preference.matches);
      if (preference.matches) { pause(); setReadable(true); }
    };
    updatePreference();
    preference.addEventListener('change', updatePreference);
    const onVisibility = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onVisibility);

    import('@theatre/core').then(async ({ getProject, onChange }) => {
      const project = getProject('Waypoint Theatre Lab', { state: projectState });
      await project.ready;
      if (disposed) return;
      const cut = project.sheet(SHEET_NAME, instance);
      sheet.current = cut;
      const object = cut.object('Composition', composition);
      releaseValues = object.onValuesChange((values) => {
        const style = root.current?.style;
        if (!style) return;
        for (const [key, value] of Object.entries(values)) style.setProperty(`--${key}`, String(value));
      });
      releaseTime = onChange(cut.sequence.pointer.position, (position) => {
        setChapter(chapterAt(position));
        setAtEnd(position >= END_TIME - 0.01);
        setAtAnnotation(position >= ANNOTATION_TIME - 0.01);
        setCaption(position < 5.5 ? 0 : position < 12 ? 1 : 2);
        if (timeLabel.current) timeLabel.current.value = `${position.toFixed(1).padStart(4, '0')} / 16.0 s`;
        if (scrubber.current) scrubber.current.value = String(position);
        root.current?.style.setProperty('--progress', `${position / END_TIME * 100}%`);
        const media = audio.current;
        if (!media) return;
        const voiceTime = position - 1.5;
        const inVoice = voiceTime >= 0 && voiceTime < 7.94;
        if (!playing.current || !sound.current || !inVoice) { media.pause(); return; }
        if (Math.abs(media.currentTime - voiceTime) > 0.2) media.currentTime = voiceTime;
        if (media.paused && !voicePending) {
          voicePending = true;
          void media.play().then(() => {
            if (disposed || !playing.current || !sound.current) media.pause();
          }).catch(() => {
            sound.current = false;
            if (!disposed) { setMuted(true); setAudioFailed(true); }
          }).finally(() => { voicePending = false; });
        }
      });
      const requested = new URLSearchParams(window.location.search).get('shot');
      if (requested === 'annotation') cut.sequence.position = ANNOTATION_TIME;
      if (requested === 'queue') cut.sequence.position = END_TIME;
      setReady(true);
    }).catch(() => { if (!disposed) { setFailed(true); setReadable(true); } });

    return () => {
      disposed = true;
      epoch.current += 1;
      playing.current = false;
      mediaElement?.pause();
      sheet.current?.sequence.pause();
      releaseValues();
      releaseTime();
      sheet.current?.detachObject('Composition');
      sheet.current = null;
      preference.removeEventListener('change', updatePreference);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [instance]);

  const isOpening = chapter === 'opening';
  const isAnnotation = chapter === 'annotation';
  const isQueue = chapter === 'queue';
  const showsFilm = !readable;
  const showsTranscript = readable;
  const controlDisabled = !ready || readable;
  let playLabel = 'Continue to Annotation';
  if (atAnnotation) playLabel = 'Carry it to Queue';
  if (isOpening) playLabel = 'Begin the story';
  if (atEnd) playLabel = 'Replay cut';
  if (running) playLabel = 'Pause';
  const actionLabel = reduced ? 'Next chapter' : playLabel;
  const showPauseIcon = running;
  const showPlayIcon = !running;
  const canShowFailure = failed || audioFailed;
  const failureMessage = failed ? 'The animated cut could not load. The complete readable story is below.' : 'Narration is unavailable. The silent cut continues.';
  const captions = ['Every journey begins by marking a place.', 'Ours begins where something could be better.', 'From a precise observation to retained, agent-ready work.'];

  return (
    <main id="main-content" className="theatre-lab" ref={root} data-chapter={chapter}>
      <header className="tl-masthead">
        <a href="/" className="tl-brand"><Crosshair aria-hidden="true" /><span><small>Logbook for Devs</small><b>Waypoint</b></span></a>
        <span className="tl-edition">The marked page <span>— an interactive short</span></span>
        <a className="tl-install" href="/docs/installation">Get Waypoint <ArrowRight size={16} aria-hidden="true" /></a>
      </header>
      <noscript><article className="tl-readable"><h1>Pin the point. Chart the change.</h1><p>Place an Annotation on your page. Waypoint retains the target and comment in your local Queue, where a coding agent can inspect, claim and resolve the work. The installation guide above is available without the animated cut.</p></article></noscript>

      {showsFilm && <div className="tl-film">
        <div className="tl-stage">
          <div className="tl-chart" aria-hidden="true" />
          <div className="tl-folio" aria-hidden="true">FIELD NOTES / A CHANGE IN THREE ACTS</div>
          <section className="tl-hero" aria-hidden={!isOpening} inert={!isOpening}>
            <h1>Every change<br />starts <em>somewhere.</em></h1>
            <p>Pin the point. Chart the change.<br />Visual feedback, carried from your page to your coding agent.</p>
            <button className="tl-text-action" disabled={!ready} onClick={() => void play()}>Mark a beginning <ArrowRight size={18} aria-hidden="true" /></button>
          </section>

          <section className="tl-story" aria-live="polite">
            {isAnnotation && <><h2>A place.<br /><em>A possibility.</em></h2><p>Not “somewhere on the page.”<br />This element. This intention.<br />Held together in an Annotation.</p></>}
            {isQueue && <><h2>The point<br /><em>travels with it.</em></h2><p>Your observation enters the local Queue, with its context intact. A coding agent can pick up the work.</p></>}
          </section>

          <div className="tl-specimen" role="group" aria-label="Illustrative page with a marked button">
            <div className="tl-browser"><span className="tl-browser-dots" aria-hidden="true"><i /><i /><i /></span><span>localhost:3000 / field-notes</span><ArrowUpRight size={12} aria-hidden="true" /></div>
            <div className="tl-specimen-inner">
              <div className="tl-specimen-nav"><b>FIELD NOTES</b><span>Journeys & observations</span></div>
              <div className="tl-specimen-rule" />
              <h3>Room for<br />a new horizon.</h3>
              <p className="tl-specimen-copy">A small collection of places worth returning to. Gather your notes. Find your next beginning.</p>
              <div className="tl-target">Explore the collection <ArrowRight size={18} aria-hidden="true" />
                <svg className="tl-mark" viewBox="0 0 300 90" fill="none" aria-hidden="true"><path pathLength="1" d="M278 18C216 2 64 0 23 22C-4 38 8 72 47 79C101 90 269 90 287 61C309 30 269 6 232 9" /></svg>
                <span className="tl-pin">1</span>
              </div>
              <div className="tl-specimen-landscape" aria-hidden="true" />
              <span className="tl-specimen-caption">Atlantic coast · 38° 43′ N · Illustrative field note</span>
            </div>
          </div>

          <div className="tl-note" aria-hidden={!isAnnotation}><span className="tl-note-index">01 / ANNOTATION</span><p>“Give the main action<br />more breathing room.”</p><span className="tl-note-target">button · Explore the collection</span><div className="tl-note-foot"><Check size={14} /> Target + intention, together</div></div>
          <svg className="tl-transfer" viewBox="0 0 1000 600" fill="none" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M610 350C740 460 940 490 930 300C920 160 740 175 710 270" /></svg>
          <section className="tl-queue" aria-hidden={!isQueue} inert={!isQueue}>
            <div className="tl-queue-heading"><span>Waypoint / local Queue</span><span>01 retained</span></div>
            <div className="tl-queue-record"><span className="tl-queue-number">01</span><div><span className="tl-status">OPEN</span><h3>Give the main action<br />more breathing room.</h3><p>field-notes · button</p></div></div>
            <dl><div><dt>Target</dt><dd>Explore the collection</dd></div><div><dt>Context</dt><dd>Page + element + comment</dd></div><div><dt>Next</dt><dd>Coding agent <ArrowRight size={14} /></dd></div></dl>
            <p className="tl-queue-end">A clear beginning for the work ahead.</p>
          </section>
          <span className="tl-lab-stamp">THEATRE.JS / LAB CUT 01</span>
        </div>

        <div className="tl-caption" aria-live="polite">
          <p>{captions[caption]}</p>
        </div>
      </div>}

      <div className="tl-controls">
        {showsFilm && <div className="tl-transport">
          <button className="tl-play" onClick={() => void play()} disabled={controlDisabled}>{showPauseIcon && <Pause size={17} aria-hidden="true" />}{showPlayIcon && <Play size={17} aria-hidden="true" />}{actionLabel}</button>
          <button aria-label="Restart cut" title="Restart cut" disabled={controlDisabled} onClick={() => seek(0)}><RotateCcw size={18} /></button>
          <button aria-label="Skip to destination" title="Skip to destination" disabled={controlDisabled} onClick={() => seek(destinationAfter(sheet.current?.sequence.position ?? 0))}><SkipForward size={18} /></button>
        </div>}
        <div className="tl-preferences">
          <button aria-pressed={!muted} onClick={toggleSound}>{muted && <VolumeX size={17} aria-hidden="true" />}{!muted && <Volume2 size={17} aria-hidden="true" />}{muted ? 'Sound off' : 'Sound on'}</button>
          <button aria-pressed={readable} onClick={() => { pause(); setReadable(!readable); }}>{readable ? 'View the film' : 'Read the story'}</button>
        </div>
      </div>
      {showsFilm && <button className="tl-mobile-control" aria-label={`Film control: ${actionLabel}`} disabled={!ready} onClick={() => void play()}>{showPauseIcon && <Pause size={17} aria-hidden="true" />}{showPlayIcon && <Play size={17} aria-hidden="true" />}{actionLabel}</button>}
      {canShowFailure && <p className="tl-error" role="status">{failureMessage}</p>}

      {showsFilm && <details className="tl-edit"><summary>Explore the edit <ArrowDown size={14} aria-hidden="true" /></summary>
        <div className="tl-edit-top"><span>Authored composition · Theatre.js</span><output ref={timeLabel}>00.0 / 16.0 s</output><label>Pace <select value={pace} onChange={(event) => { pause(); const rate = Number(event.target.value); setPace(rate); if (audio.current) audio.current.playbackRate = rate; }}><option value="0.75">Unhurried · 0.75×</option><option value="1">Original · 1×</option><option value="1.25">Brisk · 1.25×</option></select></label></div>
        <input ref={scrubber} aria-label="Seek through the authored cut" type="range" min="0" max={END_TIME} step="0.05" defaultValue="0" disabled={!ready || reduced} onChange={(event) => seek(Number(event.target.value))} />
        <nav aria-label="Cut chapters"><button onClick={() => seek(0)} disabled={!ready}>00.0 · Opening</button><button onClick={() => seek(ANNOTATION_TIME)} disabled={!ready}>10.0 · Annotation</button><button onClick={() => seek(END_TIME)} disabled={!ready}>16.0 · Queue</button></nav>
      </details>}

      {showsTranscript && <article className="tl-readable"><h1>Pin the point.<br /><em>Chart the change.</em></h1><p>Waypoint connects feedback on your running interface to the coding agent working on it.</p><ol><li><h2>Annotation</h2><p>Mark the element and say what could be better. “Give the main action more breathing room.” Your comment stays attached to its target.</p></li><li><h2>Queue</h2><p>Waypoint retains that Annotation in your local Queue, with the page, element and comment together.</p></li><li><h2>Coding agent</h2><p>An MCP-compatible agent can inspect, claim and resolve the work. The feedback has somewhere to go.</p></li></ol><a className="tl-install" href="/docs/installation">Open the installation guide <ArrowRight size={16} /></a></article>}
      <footer className="tl-footer"><span>Alternate-universe experiment · illustrative product record</span><a href="https://logbookfordevs.com/">A tool from the Logbook for Devs</a><span>Charting the technical seas, one commit at a time.</span></footer>
      <audio ref={audio} src={voice} muted={muted} preload="none" onError={() => { setAudioFailed(true); sound.current = false; setMuted(true); }} />
    </main>
  );
}
