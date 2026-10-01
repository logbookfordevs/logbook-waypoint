'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface JournalMarginNoteProps {
  children: ReactNode;
  note: string;
  number: number;
}

export function JournalMarginNote({ children, note, number }: JournalMarginNoteProps) {
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLElement>(null);
  const [drawing, setDrawing] = useState({ circle: '', arrow: '', tip: '' });

  useLayoutEffect(() => {
    const container = root.current;
    const target = content.current?.querySelector('p');
    const card = paper.current;
    if (!container || !target || !card) return;
    const measure = () => {
      const bounds = container.getBoundingClientRect();
      const t = target.getBoundingClientRect(), p = card.getBoundingClientRect();
      const x = t.left - bounds.left - 8, y = t.top - bounds.top - 5;
      const w = t.width + 16, h = t.height + 10;
      const sideBySide = p.left >= t.right;
      const sx = p.left - bounds.left + (sideBySide ? 8 : p.width * .8);
      const sy = p.top - bounds.top + (sideBySide ? p.height * .65 : 3);
      const ex = sideBySide ? x + w + 2 : x + w * .65;
      const ey = sideBySide ? y + h * .55 : y + h + 5;
      const bend = number === 1 ? -38 : 42;
      setDrawing({
        circle: `M ${x+w*.87} ${y+3} C ${x+w*.35} ${y-8}, ${x-10} ${y}, ${x} ${y+h*.5} C ${x-2} ${y+h+10}, ${x+w+10} ${y+h+8}, ${x+w} ${y+h*.4} C ${x+w+3} ${y-5}, ${x+w*.4} ${y-3}, ${x+w*.2} ${y+3}`,
        arrow: `M ${sx} ${sy} C ${sx-34} ${sy+bend}, ${ex+35} ${ey+bend}, ${ex} ${ey}`,
        tip: sideBySide
          ? `M ${ex+12} ${ey-8} L ${ex} ${ey} L ${ex+13} ${ey+5}`
          : `M ${ex-7} ${ey+12} L ${ex} ${ey} L ${ex+8} ${ey+11}`,
      });
    };
    const observer = new ResizeObserver(measure);
    [container, target, card].forEach(element => observer.observe(element));
    measure();
    return () => observer.disconnect();
  }, [number]);

  return (
    <div className="journal-annotated-passage" ref={root}>
      <div ref={content}>{children}</div>
      <svg className="journal-annotated-passage__drawing" aria-hidden="true"><path d={drawing.circle} /><path d={drawing.arrow} /><path d={drawing.tip} /></svg>
      <aside className="journal-annotated-passage__paper" ref={paper} aria-label={`Journal margin note ${number}`}>
        <span className="journal-annotated-passage__tape" aria-hidden="true" />
        <span className="journal-annotated-passage__number" aria-hidden="true">{number}</span>
        <p>{note}</p>
      </aside>
    </div>
  );
}
