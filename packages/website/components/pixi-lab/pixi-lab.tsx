'use client';

import { useEffect, useRef, useState } from 'react';
import type { Atlas } from '@/components/pixi-lab/atlas';

type Scene = 'opening' | 'departing' | 'annotation' | 'crossing' | 'queue';

export function PixiLab() {
  const host = useRef<HTMLDivElement>(null);
  const atlas = useRef<Atlas | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const destination = useRef(0);
  const generation = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const [scene, setScene] = useState<Scene>('opening');
  const [simple, setSimple] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [note, setNote] = useState('Give this button a little more breathing room.');
  const [audioUnavailable, setAudioUnavailable] = useState(false);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSimple(preference.matches);
    onChange();
    preference.addEventListener('change', onChange);
    const syncHash = () => {
      const hash = window.location.hash;
      if (hash !== '#annotation' && hash !== '#queue') return;
      generation.current++;
      destination.current = hash === '#queue' ? 2 : 1;
      void atlas.current?.travel(destination.current, true);
      setScene(hash === '#queue' ? 'queue' : 'annotation');
      setPinned(hash === '#queue');
      audio.current?.pause();
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => {
      preference.removeEventListener('change', onChange);
      window.removeEventListener('hashchange', syncHash);
    };
  }, []);

  useEffect(() => {
    if (simple !== false || !host.current) return;
    let canceled = false;
    let instance: Atlas | undefined;
    const element = host.current;
    const timeout = setTimeout(() => { if (!canceled) setReady(true); }, 3500);
    void import('@/components/pixi-lab/atlas').then(({ createAtlas }) => createAtlas(element)).then((created) => {
      instance = created;
      if (canceled) { created.destroy(); return; }
      atlas.current = created;
      void created.travel(destination.current, true);
      setReady(true);
    }).catch((error: unknown) => {
      if (!canceled) {
        element.dataset.error = error instanceof Error ? error.message : 'Renderer unavailable';
        setReady(true);
      }
    });
    return () => {
      canceled = true;
      clearTimeout(timeout);
      instance?.destroy();
      atlas.current = null;
    };
  }, [simple]);

  useEffect(() => {
    const track = new Audio('/ink-route/waypoint-annotation-narration-grandpa-pace-0.92x-take-01.mp3');
    track.preload = 'none';
    audio.current = track;
    const visibility = () => {
      if (document.hidden) track.pause();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => { track.pause(); track.src = ''; audio.current = null; document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    const stable = scene === 'annotation' || scene === 'queue';
    if (stable) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [scene]);

  async function go(target: 1 | 2) {
    const token = ++generation.current;
    destination.current = target;
    setScene(target === 1 ? 'departing' : 'crossing');
    if (target === 2) audio.current?.pause();
    if (sound && target === 1 && audio.current) {
      audio.current.currentTime = 0;
      void audio.current.play().catch(() => setAudioUnavailable(true));
    }
    await atlas.current?.travel(target, simple === true);
    if (generation.current !== token) return;
    setScene(target === 1 ? 'annotation' : 'queue');
    history.replaceState(null, '', target === 1 ? '#annotation' : '#queue');
  }

  function skip() {
    generation.current++;
    void atlas.current?.travel(destination.current, true);
    setScene(destination.current === 1 ? 'annotation' : 'queue');
    history.replaceState(null, '', destination.current === 1 ? '#annotation' : '#queue');
    audio.current?.pause();
  }

  function replay() {
    generation.current++;
    destination.current = 0;
    void atlas.current?.travel(0, true);
    setScene('opening');
    setPinned(false);
    audio.current?.pause();
    history.replaceState(null, '', window.location.pathname);
  }

  function toggleSimple() {
    if (!simple) skipToStable();
    setSimple(!simple);
  }

  function skipToStable() {
    generation.current++;
    if (destination.current === 1) setScene('annotation');
    if (destination.current === 2) setScene('queue');
    audio.current?.pause();
  }

  function toggleSound() {
    const enabled = !sound;
    setSound(enabled);
    if (!audio.current) return;
    if (enabled && scene !== 'opening') void audio.current.play().catch(() => setAudioUnavailable(true));
    else audio.current.pause();
  }

  const isOpening = scene === 'opening';
  const isAnnotation = scene === 'annotation';
  const isQueue = scene === 'queue';
  const isTraveling = scene === 'departing' || scene === 'crossing';
  const canStart = ready || simple === true;
  const canQueue = pinned && note.trim().length > 0;
  const showPin = isAnnotation && !pinned;
  const showPinned = isAnnotation && pinned;
  const soundLabel = sound ? 'Voice on' : 'Voice off';
  const chapter = isQueue ? '02 / Queue' : '01 / Annotation';

  return (
    <main id="main-content" className="pixi-lab" data-scene={scene} data-simple={simple}>
      <div className="pixi-lab__fallback" aria-hidden="true" />
      <div className="pixi-lab__canvas" ref={host} aria-hidden="true" />
      <div className="pixi-lab__veil" aria-hidden="true" />
      <header className="pixi-lab__header">
        <a href="/" className="pixi-lab__brand"><span className="pixi-lab__brand-mark">↗</span><span>Logbook <strong>Waypoint</strong></span></a>
        <span className="pixi-lab__edition">FIELD ATLAS / EXPERIMENT 01</span>
        <a className="pixi-lab__setup" href="/docs">Get Waypoint <span aria-hidden="true">↗</span></a>
      </header>

      <div className="pixi-lab__frame">
        {isOpening && <section className="pixi-lab__opening">
          <p className="pixi-lab__eyebrow">A SHORT JOURNEY FROM LOOKING TO MAKING</p>
          <h1>Every change<br />starts <em>here.</em></h1>
          <p className="pixi-lab__lede">A point on a page. A thought worth keeping.<br />A clear route to your coding agent.</p>
          <button className="pixi-lab__primary" onClick={() => void go(1)} disabled={!canStart}>Trace the first point <span aria-hidden="true">↗</span></button>
          <p className="pixi-lab__caption">An interactive field note · about 30 seconds</p>
          <span className="pixi-lab__margin-note" aria-hidden="true">The map begins<br />with your attention.</span>
        </section>}

        {isTraveling && <section className="pixi-lab__travel" aria-live="polite">
          <span className="pixi-lab__eyebrow">{scene === 'departing' ? 'FOLLOWING THE FIRST THREAD' : 'CARRYING YOUR CONTEXT FORWARD'}</span>
          <p>{scene === 'departing' ? 'An observation finds its place.' : 'Nothing gets lost along the way.'}</p>
          <button onClick={skip}>Skip to destination <span aria-hidden="true">→</span></button>
        </section>}

        {isAnnotation && <section className="pixi-lab__chapter">
          <div className="pixi-lab__chapter-copy">
            <p className="pixi-lab__eyebrow">01 / THE POINT OF DEPARTURE</p>
            <h1 ref={heading} tabIndex={-1}>Make it<br /><em>precise.</em></h1>
            <p>A vague thought becomes an Annotation.<br />The element, the page, and your intent<br className="pixi-lab__desktop-break" /> travel together.</p>
            <span className="pixi-lab__handnote">Try it on this little piece of the web →</span>
          </div>
          <div className="pixi-lab__field-note">
            <div className="pixi-lab__sample"><div className="pixi-lab__sample-bar"><span>● ● ●</span><span>your-site.local / welcome</span></div><div className="pixi-lab__sample-body"><span className="pixi-lab__sample-wordmark">Hearth & wild</span><h2>Room for<br />something good.</h2><button className="pixi-lab__target" onClick={() => setPinned(true)} aria-label="Pin an annotation to the Explore the collection button">Explore the collection <span>↗</span></button><span className="pixi-lab__pin" aria-hidden="true">01</span></div></div>
            {showPin && <button className="pixi-lab__pin-action" onClick={() => setPinned(true)}>＋ Pin an Annotation to this button</button>}
            {showPinned && <div className="pixi-lab__editor"><label htmlFor="field-note">ANNOTATION 01 <span>button · /welcome</span></label><textarea id="field-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={180} rows={2} /><p>Context attached. Your intent stays with the element.</p></div>}
            <button className="pixi-lab__primary" disabled={!canQueue} onClick={() => void go(2)}>Carry it to the Queue <span aria-hidden="true">→</span></button>
          </div>
        </section>}

        {isQueue && <section className="pixi-lab__chapter pixi-lab__queue">
          <div className="pixi-lab__chapter-copy"><p className="pixi-lab__eyebrow">02 / A PLACE FOR WHAT COMES NEXT</p><h1 ref={heading} tabIndex={-1}>Kept.<br /><em>Not lost.</em></h1><p>Your Annotation arrives with its context intact. In Waypoint, the local Queue gives your coding agent a clear place to begin.</p><button className="pixi-lab__text-button" onClick={replay}>↶ Trace another point</button></div>
          <div className="pixi-lab__ledger"><div className="pixi-lab__ledger-title"><h2>The Queue</h2><span>1 ANNOTATION</span></div><div className="pixi-lab__ledger-row"><span className="pixi-lab__number">01</span><div><p>{note}</p><small>button · /welcome</small></div><span className="pixi-lab__status">○ Open</span></div><div className="pixi-lab__handoff"><span aria-hidden="true">↗</span><div><strong>Next bearing: your coding agent</strong><p>Read the Queue. Claim the work.<br />Return a Resolution you can inspect.</p></div></div><a href="/docs" className="pixi-lab__primary">Set up your own route <span aria-hidden="true">↗</span></a><p className="pixi-lab__caption">End of this field study. Demo only; no data is sent.</p></div>
        </section>}
      </div>
      <footer className="pixi-lab__footer"><div className="pixi-lab__route-key"><span className="pixi-lab__dot" />{isOpening ? 'ANNOTATION → QUEUE → CODING AGENT' : chapter}</div><div className="pixi-lab__controls"><button aria-pressed={sound} onClick={toggleSound}>{soundLabel}</button><button aria-pressed={simple === true} onClick={toggleSimple}>{simple ? 'Motion off' : 'Motion on'}</button><button onClick={replay}>Restart</button></div></footer>
      {audioUnavailable && <p className="pixi-lab__audio-status" role="status">Voice unavailable. The written story is complete.</p>}
      <noscript><p>Waypoint carries an Annotation into a local Queue for a coding agent to claim and resolve. <a href="/docs">Read the setup guide.</a></p></noscript>
    </main>
  );
}
