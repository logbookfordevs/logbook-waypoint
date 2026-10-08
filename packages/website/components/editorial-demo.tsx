'use client';

import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

type Stage = 'opening' | 'annotation' | 'pinned' | 'queue';
const sampleNote = 'Give this heading a little more room to breathe.';
const copy: Record<Stage, { first: string; second: string; description: string }> = {
  opening: { first: 'A small mark.', second: 'A clear direction.', description: 'Visual feedback belongs where you found it. Give your coding agent the point, not another paragraph of directions.' },
  annotation: { first: 'Less explaining.', second: 'More pointing.', description: 'Choose the thing you mean. Waypoint keeps your note together with the element and the page it came from.' },
  pinned: { first: 'Your thought,', second: 'with coordinates.', description: 'The words are yours. The context travels with them. One Annotation, ready to become work.' },
  queue: { first: 'A place for', second: 'what comes next.', description: 'The Queue retains the Annotation locally. A coding agent can inspect the context, claim the work, and return a Resolution.' },
};

export function EditorialDemo() {
  const [stage, setStage] = useState<Stage>('opening');
  const [note, setNote] = useState(sampleNote);
  const layoutGroupId = useId();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const queueRef = useRef<HTMLElement>(null);
  const hasInteracted = useRef(false);
  const reduceMotion = useReducedMotion();
  const still = Boolean(reduceMotion);
  const opening = stage === 'opening';
  const annotating = stage === 'annotation';
  const pinned = stage === 'pinned';
  const queued = stage === 'queue';
  const hasNote = pinned || queued;
  const selected = !opening;
  const canPin = note.trim().length > 0;
  const sceneCopy = copy[stage];
  const duration = still ? 0 : 0.85;
  const selectedRotation = selected ? -2 : -7;
  const specimenRotation = still ? 0 : selectedRotation;
  const noteRotation = queued || still ? 0 : 3;

  useEffect(() => {
    if (stage !== 'opening') hasInteracted.current = true;
    if (!hasInteracted.current) return;
    const focusTimer = window.setTimeout(() => {
      if (stage === 'annotation') noteRef.current?.focus();
      else if (stage === 'queue') queueRef.current?.focus();
      else nextRef.current?.focus();
    }, still ? 0 : 400);
    return () => window.clearTimeout(focusTimer);
  }, [stage, still]);

  function replay() {
    setStage('opening');
    setNote(sampleNote);
  }

  return (
    <MotionConfig reducedMotion={still ? 'always' : 'user'} transition={{ duration, ease: [0.22, 1, 0.36, 1] }}>
      <section id="try-waypoint" className="margin-lab editorial-demo" data-stage={stage} aria-labelledby="editorial-title">
        <LayoutGroup id={layoutGroupId}>
          <div className="margin-stage">
            <section className="margin-story" aria-label="The story">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={stage} initial={{ opacity: 1, y: still ? 0 : 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: still ? 0 : -12 }} transition={{ duration: still ? 0 : 0.35 }}>
                  <h2 id="editorial-title" tabIndex={-1}>{sceneCopy.first}{' '}<em>{sceneCopy.second}</em></h2>
                  <p className="margin-description">{sceneCopy.description}</p>
                </motion.div>
              </AnimatePresence>
              <div className="margin-action-area">
                {opening && <button ref={nextRef} className="margin-action" onClick={() => setStage('annotation')}>Make your mark <ArrowRight size={20} /></button>}
                {annotating && <p className="margin-instruction"><ArrowRight size={20} /> Write a note on the selected heading.</p>}
                {pinned && <button ref={nextRef} className="margin-action" onClick={() => setStage('queue')}>Send to the Queue <ArrowRight size={20} /></button>}
                {queued && <div className="margin-arrival"><Check size={22} /><span>Retained in the demo Queue.<a href="/docs/agent-setup">Connect your own agent <ArrowRight size={16} /></a></span></div>}
              </div>
              <div className="margin-caption"><span className="margin-caption-rule" />Pin the point. Chart the change.</div>
            </section>

            <section className="margin-theatre" aria-label="Interactive example">
              <div className="margin-orbit" aria-hidden="true"><span /><span /><span /></div>
              <motion.div className="margin-specimen" aria-hidden={queued} inert={queued} animate={{ rotate: specimenRotation, scale: queued ? 0.85 : 1, opacity: queued ? 0 : 1, y: queued ? -45 : 0 }}>
                <div className="margin-page-bar"><span>FIELDNOTES / STUDIO</span><span>EST. 2026</span></div>
                <div className="margin-page-content">
                  <button className="margin-target" aria-label="Annotate the sample heading" onClick={() => setStage('annotation')} disabled={hasNote}>
                    <span>Space to<br />think.</span>
                    {selected && <motion.svg className="margin-bracket" viewBox="0 0 360 185" preserveAspectRatio="none" aria-hidden="true"><motion.path d="M27 7 H7 V178 H27 M333 7 H353 V178 H333" fill="none" stroke="currentColor" strokeWidth="2" initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: 1 }} /></motion.svg>}
                    {selected && <span className="margin-pin" aria-hidden="true">1</span>}
                  </button>
                  <p>Good ideas need somewhere to land.<br />A notebook. A margin. A starting point.</p>
                  <svg className="margin-landscape" viewBox="0 0 400 120" aria-hidden="true">
                    <path d="M0 102 C70 105 70 40 150 65 S250 135 400 12" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M0 114 C80 117 88 64 153 80 S280 145 400 42" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="292" cy="26" r="19" fill="currentColor" />
                    <path d="M50 27 H135 M50 33 H104 M335 92 H390" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>
                <div className="margin-page-foot"><span>LESS, BUT WITH INTENTION.</span><span>01 / 08</span></div>
              </motion.div>

              {opening && <div className="margin-side-note"><span>This. Right here.</span><svg width="85" height="80" viewBox="0 0 85 80" aria-hidden="true"><path d="M77 3 Q82 53 10 68 M24 53 L9 68 L29 74" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></div>}

              <AnimatePresence>
                {annotating && <motion.form className="margin-compose" aria-label="Demo Annotation" initial={{ opacity: 0, y: still ? 0 : 35, rotate: still ? 0 : 4 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0 }} onSubmit={(event) => { event.preventDefault(); if (canPin) setStage('pinned'); }}>
                  <label htmlFor="editorial-note">What should change?</label>
                  <textarea ref={noteRef} id="editorial-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} rows={3} />
                  <div className="margin-compose-bottom"><span>Target: h1 · /studio</span><button type="submit" disabled={!canPin}>Pin Annotation <ArrowRight size={16} /></button></div>
                </motion.form>}
              </AnimatePresence>

              {queued && <motion.div className="margin-docket" initial={{ opacity: 0, y: still ? 0 : 70 }} animate={{ opacity: 1, y: 0 }}><div><span>1 item</span></div><h3>Nothing<br />lost in transit.</h3><p>Your demo Queue keeps the context with the work.</p><div className="margin-agent-next"><span />Next stop: coding agent <ArrowRight size={16} /></div></motion.div>}
              {hasNote && <motion.article ref={queueRef} tabIndex={-1} aria-label="Retained demo Annotation" layout={!still} layoutId="retained-note" className={`margin-note ${queued ? 'margin-note-queued' : ''}`} initial={{ opacity: 0, scale: still ? 1 : 0.9, rotate: still ? 0 : 6 }} animate={{ opacity: 1, scale: 1, rotate: noteRotation }}>
                <div className="margin-note-heading"><span><b>1</b> ANNOTATION</span><span>{queued ? 'PENDING' : 'PINNED'}</span></div>
                <p>{note.trim()}</p>
                <div className="margin-note-context"><span>h1</span><span>/studio</span><span>Element context retained</span></div>
              </motion.article>}
              <div className="margin-example-label">Interactive demo. Nothing is saved or sent to an agent.</div>
            </section>
          </div>
        </LayoutGroup>

        <div className="margin-bottom">
          <ol aria-label="Annotation journey">
            <li aria-current={!queued ? 'step' : undefined}><span>01</span> Annotation</li>
            <li className="margin-progress-line" aria-hidden="true"><motion.span animate={{ scaleX: queued ? 1 : 0 }} /></li>
            <li aria-current={queued ? 'step' : undefined}><span>02</span> Queue</li>
            <li className="margin-agent-label">Then, your coding agent <ArrowRight size={16} /></li>
          </ol>
          <button onClick={replay} className="margin-replay"><RotateCcw size={15} /> Replay example</button>
        </div>
        <div role="status" className="sr-only">{stage === 'queue' ? 'Annotation retained in the demo Queue. No work was sent to an agent.' : `Current scene: ${stage}`}</div>
      </section>
    </MotionConfig>
  );
}
