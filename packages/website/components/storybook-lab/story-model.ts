export type Chapter = 'overview' | 'annotation' | 'captured' | 'queue';
export type StoryEvent = 'open' | 'pin' | 'dispatch' | 'restart' | 'back';

export function advanceChapter(chapter: Chapter, event: StoryEvent): Chapter {
  if (event === 'restart') return 'overview';
  if (event === 'back') return chapter === 'queue' ? 'captured' : 'overview';
  if (event === 'open' && chapter === 'overview') return 'annotation';
  if (event === 'pin' && chapter === 'annotation') return 'captured';
  if (event === 'dispatch' && chapter === 'captured') return 'queue';
  return chapter;
}

export const sampleNote = 'Give the primary action more breathing room.';
