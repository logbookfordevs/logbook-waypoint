'use client';

import { useState } from 'react';
import { Check, Crosshair, LoaderCircle, Radio, Route } from 'lucide-react';

type QueueFilter = 'all' | 'pending' | 'claimed' | 'resolved';
type ResolutionState = 'idle' | 'resolving' | 'resolved';

const annotationRecords = [
  {
    id: '#1842',
    title: 'Tighten the empty state',
    detail: 'Keep the guidance close to the primary action.',
    target: 'section.empty-state',
    status: 'pending' as const,
  },
  {
    id: '#1841',
    title: 'Give the route more air',
    detail: 'Preserve the sequence at tablet widths.',
    target: 'nav.workflow-route',
    status: 'pending' as const,
  },
];

const lifecycleLabels: Record<QueueFilter, string> = {
  all: 'All',
  pending: 'Pending',
  claimed: 'Claimed',
  resolved: 'Resolved',
};

export function WorkflowDemo() {
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [resolutionState, setResolutionState] = useState<ResolutionState>('idle');
  const [announcement, setAnnouncement] = useState('');

  const records = annotationRecords.filter((record) => {
    if (queueFilter === 'all') {
      return true;
    }

    if (queueFilter === 'resolved') {
      return resolutionState === 'resolved' && record.id === '#1842';
    }

    return record.status === queueFilter;
  });

  const resolveAnnotation = () => {
    setResolutionState('resolving');
    setAnnouncement('Agent is resolving Annotation #1842.');

    window.setTimeout(() => {
      setResolutionState('resolved');
      setAnnouncement('Annotation #1842 resolved with a retained Resolution Record.');
    }, 900);
  };

  const resolutionLabel = resolutionState === 'resolved' ? 'Resolved' : 'Claimed';
  const isIdle = resolutionState === 'idle';
  const isResolving = resolutionState === 'resolving';
  const isResolved = resolutionState === 'resolved';
  const resolutionStatusClassName = `status-mark status-mark--${isResolved ? 'resolved' : 'claimed'}`;
  const resolutionActionLabels: Record<ResolutionState, string> = {
    idle: 'Resolve Annotation',
    resolving: 'Resolving…',
    resolved: 'Resolution retained',
  };
  const resolutionActionAriaLabels: Record<ResolutionState, string> = {
    idle: 'Resolve Annotation #1842',
    resolving: 'Resolving Annotation #1842',
    resolved: 'Annotation #1842 resolved',
  };

  let queueRecords: React.ReactNode;
  if (records.length > 0) {
    queueRecords = records.map((record) => {
      const isResolvedRecord = isResolved && record.id === '#1842';
      return (
        <article key={record.id} className="queue-record">
          <div>
            <span className={`status-mark status-mark--${isResolvedRecord ? 'resolved' : record.status}`}>
              {isResolvedRecord ? 'Resolved' : 'Pending'}
            </span>
            <span>{record.id}</span>
          </div>
          <h3>{record.title}</h3>
          <p>{record.detail}</p>
          <code>{record.target}</code>
        </article>
      );
    });
  } else {
    queueRecords = (
      <div className="queue-empty">
        <Radio aria-hidden="true" />
        <strong>No {lifecycleLabels[queueFilter]} Annotations yet.</strong>
        <span>The Queue retains history when work reaches this state.</span>
      </div>
    );
  }

  let resolutionProgress: React.ReactNode;
  if (isIdle) {
    resolutionProgress = <p><span>›</span> Ready to apply the requested change.</p>;
  } else if (isResolving) {
    resolutionProgress = <p className="agent-progress"><LoaderCircle aria-hidden="true" /> Running checks…</p>;
  } else {
    resolutionProgress = <p className="agent-resolution"><Check aria-hidden="true" /> Resolution Record retained.</p>;
  }

  return (
    <section id="workflow" className="workflow-field" aria-labelledby="workflow-title">
      <div className="workflow-field__route" aria-hidden="true">
        <svg viewBox="0 0 1200 160" preserveAspectRatio="none">
          <path d="M40 112 C220 18 348 24 520 82 S840 154 1160 38" />
          <circle cx="218" cy="46" r="6" />
          <circle cx="602" cy="103" r="6" />
          <circle cx="1012" cy="69" r="6" />
        </svg>
      </div>

      <div className="workflow-field__heading">
        <h2 id="workflow-title">One signal. A complete working route.</h2>
        <p className="workflow-field__description">
          Place precise feedback on the rendered page. Waypoint retains the context, then lets an
          MCP-compatible coding agent Watch, Claim, and Resolve it.
        </p>
        <p className="workflow-field__evidence">
          <span>Illustrative workflow</span>
          <span>Route 01</span>
        </p>
      </div>

      <ol className="workflow-stage-list">
        <li className="workflow-stage">
          <StageHeading number="01" title="Annotate" detail="Pin the point" icon={<Crosshair />} />
          <div className="browser-surface">
            <div className="browser-surface__chrome">
              <span />
              <span />
              <span />
              <code>localhost:3000/dashboard</code>
            </div>
            <div className="browser-surface__page">
              <p className="browser-surface__title">Project overview</p>
              <div className="metric-strip">
                <span>Builds <strong>42</strong></span>
                <span>Routes <strong>16</strong></span>
                <span className="annotated-target">
                  Drift <strong>3.8%</strong>
                  <i aria-hidden="true">1</i>
                </span>
              </div>
              <div className="annotation-note">
                <span>Annotation #1842</span>
                <strong>Tighten the empty state</strong>
                <code>section.empty-state</code>
              </div>
            </div>
          </div>
        </li>

        <li className="workflow-stage">
          <StageHeading number="02" title="Queue" detail="Chart the change" icon={<Route />} />
          <div className="queue-surface" role="region" aria-label="Annotation Queue">
            <label htmlFor="queue-filter">Filter Queue by lifecycle</label>
            <select
              id="queue-filter"
              value={queueFilter}
              onChange={(event) => setQueueFilter(event.target.value as QueueFilter)}
            >
              {Object.entries(lifecycleLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <div className="queue-surface__records" aria-live="polite">
              {queueRecords}
            </div>
          </div>
        </li>

        <li className="workflow-stage">
          <StageHeading number="03" title="Resolve" detail="Agent takes action" icon={<Check />} />
          <div className="agent-surface">
            <div className="agent-surface__status">
              <span>Agent</span>
              <strong className={resolutionStatusClassName}>
                {resolutionLabel}
              </strong>
              <code>#1842</code>
            </div>
            <div className="agent-surface__log" aria-live="polite">
              <p><span>›</span> Reading Target context…</p>
              <p><span>›</span> Inspecting the empty state component…</p>
              <p><span>›</span> Preserving height and keyboard flow…</p>
              {resolutionProgress}
            </div>
            <div className="agent-surface__diff" aria-label="Illustrative proposed change">
              <code>- padding-block: 32px;</code>
              <code>+ padding-block: 24px;</code>
            </div>
            <button
              type="button"
              className="agent-surface__action"
              onClick={resolveAnnotation}
              disabled={!isIdle}
              aria-label={resolutionActionAriaLabels[resolutionState]}
            >
              {resolutionActionLabels[resolutionState]}
            </button>
          </div>
        </li>
      </ol>

      <p className="sr-only" role="status">{announcement}</p>
    </section>
  );
}

interface StageHeadingProps {
  number: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
}

function StageHeading({ number, title, detail, icon }: StageHeadingProps) {
  return (
    <div className="workflow-stage__heading">
      <span className="workflow-stage__icon" aria-hidden="true">{icon}</span>
      <p><span>{number}</span> {title}</p>
      <small>{detail}</small>
    </div>
  );
}
