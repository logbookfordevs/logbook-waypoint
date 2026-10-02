import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({ chapter: { value: 0 }, reducedMotion: false }));
vi.mock('@rive-app/react-canvas', () => ({
  Alignment: { Center: 'center' }, Fit: { Contain: 'contain' },
  Layout: class {}, RuntimeLoader: { setWasmUrl: vi.fn(), setWasmFallbackUrl: vi.fn() },
  useRive: () => ({ rive: { viewModelInstance: { number: () => runtime.chapter }, pause: vi.fn(), play: vi.fn() }, RiveComponent: () => <div data-testid="rive-art" /> }),
}));
vi.mock('@/lib/use-media-query', () => ({ useMediaQuery: () => runtime.reducedMotion }));

import { FieldGuide } from '@/app/labs/rive/field-guide';

describe('Rive field-guide handoff', () => {
  beforeEach(() => { window.history.replaceState(null, '', '/'); runtime.reducedMotion = false; });

  it('preserves the authored note through Queue and editing, and drives the real runtime contract', () => {
    render(<FieldGuide />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin an observation' }));
    expect(runtime.chapter.value).toBe(1);
    expect(screen.getByLabelText('Your field note')).toHaveFocus();
    fireEvent.change(screen.getByLabelText('Your field note'), { target: { value: 'Make the button label specific.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send to the Queue' }));
    expect(screen.getByText('Make the button label specific.')).toBeInTheDocument();
    expect(runtime.chapter.value).toBe(2);
    expect(screen.getByRole('group', { name: 'Annotation in the sample Queue' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Edit the Annotation' }));
    expect(screen.getByLabelText('Your field note')).toHaveValue('Make the button label specific.');
  });

  it('does not allow an empty note into Queue through either action or chapter navigation', () => {
    render(<FieldGuide />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin an observation' }));
    fireEvent.change(screen.getByLabelText('Your field note'), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Send to the Queue' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '03 Queue' }));
    expect(screen.getByLabelText('Your field note')).toBeInTheDocument();
  });

  it('reconstructs direct Queue entry and keeps the note when switching to readable view', () => {
    window.history.replaceState(null, '', '/labs/rive#queue');
    render(<FieldGuide />);
    expect(screen.getByText('In the sample Queue')).toBeInTheDocument();
    expect(runtime.chapter.value).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Readable view' }));
    expect(screen.queryByTestId('rive-art')).not.toBeInTheDocument();
    expect(screen.getByText('In the sample Queue')).toBeInTheDocument();
  });

  it('keeps the same handoff operable without starting Rive under reduced motion', () => {
    runtime.reducedMotion = true;
    render(<FieldGuide />);
    expect(screen.queryByRole('button', { name: 'Readable view' })).not.toBeInTheDocument();
    expect(screen.getByText('Reduced motion · readable')).toBeInTheDocument();
    expect(screen.queryByTestId('rive-art')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pin an observation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send to the Queue' }));
    expect(screen.getByText('In the sample Queue')).toBeInTheDocument();
  });
});
