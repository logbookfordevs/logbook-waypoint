'use client';

import { Check, ChevronLeft, List, MousePointer2, RotateCcw, X } from 'lucide-react';
import { useRef, useState } from 'react';

type Stage = 'idle' | 'ready' | 'selecting' | 'editing' | 'pending' | 'claimed' | 'resolved';

const guidance: Record<Stage, [string, string]> = {
  idle: ['Learn by doing', 'Try one small change in a practice app. No extension or agent connection needed.'],
  ready: ['Turn on annotation mode', 'Choose the pointer in the Waypoint toolbar.'],
  selecting: ['Select the Save button', 'Hover or focus the button below, then select it to attach your feedback.'],
  editing: ['Give the agent a clear request', 'For this exercise, ask for the label “Save changes”. You can edit the brief before saving.'],
  pending: ['Your feedback is in the Queue', 'Open Queue in the toolbar to inspect the saved Annotation, then simulate the handoff.'],
  claimed: ['The demo agent has claimed the work', 'A Claim is temporary ownership, not completion. Apply the scripted change to continue.'],
  resolved: ['Check what changed', 'The button now says “Save changes”. The Resolved Annotation stays in the Queue as history.'],
};

// Deliberately isolated practice state: no extension bridge, storage, or MCP calls.
export function WaypointPractice() {
  const [stage, setStage] = useState<Stage>('idle');
  const [comment, setComment] = useState('Change this button label to Save changes. Keep its current size and position.');
  const [queueOpen, setQueueOpen] = useState(false);
  const [guided, setGuided] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const annotateRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<HTMLButtonElement>(null);
  const queueRef = useRef<HTMLButtonElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const isStarted = stage !== 'idle';
  const isSelecting = stage === 'selecting';
  const isEditing = stage === 'editing';
  const isPending = stage === 'pending';
  const isClaimed = stage === 'claimed';
  const isResolved = stage === 'resolved';
  const hasAnnotation = isPending || isClaimed || isResolved;
  const showsToolbar = isStarted && !collapsed;
  const showsLauncher = isStarted && collapsed;
  const showsQueue = queueOpen && hasAnnotation;
  const showsEmptyQueue = queueOpen && !hasAnnotation;
  const showsGuide = !isStarted || guided;
  const canSelect = isSelecting || isEditing;
  const status = isResolved ? 'Resolved' : isClaimed ? 'Claimed' : 'Pending';
  const step = isResolved ? 4 : hasAnnotation ? 3 : isEditing ? 2 : 1;

  function reset() {
    setStage('idle');
    setQueueOpen(false);
    setCollapsed(false);
    setGuided(true);
    setComment('Change this button label to Save changes. Keep its current size and position.');
  }

  function closePanel() {
    setQueueOpen(false);
    if (isEditing || isSelecting) setStage('ready');
    const returnTarget = collapsed ? launcherRef.current : hasAnnotation ? queueRef.current : annotateRef.current;
    returnTarget?.focus({ preventScroll: true });
  }

  return (
    <section className="waypoint-practice" id="try-waypoint" aria-labelledby="practice-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.stopPropagation(); closePanel(); }
      }}>
      <div className="practice-heading">
        <h2 id="practice-title">Try Waypoint</h2>
        <span className="practice-demo-label">Interactive demo</span>
      </div>
      <p className="practice-intro">One button. One Annotation. See how feedback becomes a change.</p>
      <div className="practice-guide" aria-live="polite">
        {showsGuide && <div><strong>{guidance[stage][0]}</strong><p>{guidance[stage][1]}</p></div>}
        {!showsGuide && <p>Explore the toolbar, select the button, and follow the Annotation into the Queue.</p>}
        {!isStarted && <button className="practice-primary" onClick={() => setStage('ready')}>Start the exercise</button>}
        {isStarted && <span className="practice-step">{step} / 4</span>}
      </div>

      <div className="practice-browser">
        <div className="practice-address"><span className="practice-window-dots" aria-hidden="true"><i /><i /><i /></span><span>Fieldwork · /settings</span><span>Demo only</span></div>
        <div className="practice-workspace">
          {showsToolbar && <div className="practice-toolbar" role="group" aria-label="Demo Waypoint toolbar">
            <button aria-label="Collapse demo toolbar" title="Collapse" onClick={() => setCollapsed(true)}><ChevronLeft /></button>
            <span className="practice-toolbar-divider" />
            <button ref={annotateRef} aria-label="Annotate" title="Annotate" aria-pressed={isSelecting} disabled={hasAnnotation}
              onClick={() => { setQueueOpen(false); setStage('selecting'); targetRef.current?.focus({ preventScroll: true }); }}><MousePointer2 /></button>
            <button ref={queueRef} aria-label="Open Queue" title="Open Queue" aria-expanded={queueOpen}
              onClick={() => { if (isEditing || isSelecting) setStage('ready'); setQueueOpen(!queueOpen); }}><List />{hasAnnotation && <span className="practice-count">1</span>}</button>
            <img src="/brand/waypoint-mark.svg" width="24" height="24" alt="Waypoint" />
          </div>}
          {showsLauncher && <button ref={launcherRef} className="practice-launcher" aria-label="Expand demo toolbar" onClick={() => setCollapsed(false)}><img src="/brand/waypoint-mark.svg" width="32" height="32" alt="" /></button>}

          <div className="practice-app">
            <h3>Workspace settings</h3>
            <p>A little room for your next idea.</p>
            <dl><div><dt>Workspace name</dt><dd>Weekend project</dd></div><div><dt>Notifications</dt><dd>Weekly digest</dd></div></dl>
            <div className="practice-target-wrap">
              <button ref={targetRef} className="practice-target" data-selecting={canSelect} aria-label={isResolved ? 'Save changes' : 'Save'}
                aria-describedby="practice-target-help" onClick={() => { if (isSelecting) setStage('editing'); }}>
                {isResolved && <Check aria-hidden="true" />}{isResolved ? 'Save changes' : 'Save'}
              </button>
              {hasAnnotation && <button className="practice-pin" aria-label="Open Annotation 1" onClick={() => setQueueOpen(true)}>1</button>}
            </div>
            <small id="practice-target-help">Practice controls only. No workspace settings are saved.</small>
          </div>

          {isEditing && <form className="practice-panel" aria-label="New Annotation" onSubmit={(event) => {
            event.preventDefault(); if (!comment.trim()) return; setStage('pending'); queueRef.current?.focus();
          }}>
            <div className="practice-panel-header"><strong>New Annotation</strong><button type="button" aria-label="Close Annotation editor" onClick={closePanel}><X /></button></div>
            <div className="practice-target-context"><MousePointer2 /><code>button</code><span>Save</span></div>
            <label htmlFor="practice-comment">What should change?</label>
            <textarea id="practice-comment" autoFocus value={comment} maxLength={1000} onChange={(event) => setComment(event.target.value)} />
            <p className="practice-panel-note">This exercise demonstrates one scripted label change. Your brief stays in this demo.</p>
            <div className="practice-panel-actions"><button type="button" onClick={closePanel}>Cancel</button><button className="practice-primary" disabled={!comment.trim()} type="submit">Save Annotation</button></div>
          </form>}

          {queueOpen && <div className="practice-panel" role="region" aria-label="Demo Queue">
            <div className="practice-panel-header"><strong>Queue</strong><button aria-label="Close Queue" onClick={closePanel}><X /></button></div>
            {showsEmptyQueue && <p>No Annotations yet. Choose Annotate, then select the Save button.</p>}
            {showsQueue && <>
              <div className="practice-record-heading"><span>Annotation 1 · /settings</span><strong data-status={status}>{status}</strong></div>
              <p className="practice-saved-comment">{comment}</p>
              <div className="practice-target-context"><MousePointer2 /><code>button</code><span>Save</span></div>
              <div className="practice-agent">
                <strong>Simulated agent</strong>
                <p>No AI is connected. These controls demonstrate the lifecycle without editing a repository.</p>
                {isPending && <button className="practice-primary" onClick={() => setStage('claimed')}>Simulate Claim</button>}
                {isClaimed && <button className="practice-primary" onClick={() => setStage('resolved')}>Apply demo change &amp; resolve</button>}
                {isResolved && <p className="practice-success"><Check /> Label updated. Check the button in the practice app.</p>}
              </div>
            </>}
          </div>}
        </div>
      </div>
      <div className="practice-footer">
        <span>Practice mode · nothing is saved or sent</span>
        {isStarted && <div><button onClick={() => setGuided(!guided)}>{guided ? 'Hide guidance' : 'Show guidance'}</button><button onClick={reset}><RotateCcw /> Restart</button></div>}
      </div>
      {isResolved && <p className="practice-complete">That is the basic loop. In your own project, the connected agent makes and verifies the source change. Continue below for setup and the full workflow.</p>}
    </section>
  );
}
