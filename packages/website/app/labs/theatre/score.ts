export const ANNOTATION_TIME = 10;
export const END_TIME = 16;
export const SHEET_NAME = 'The marked page';

export const composition = {
  hero: 1,
  pageX: 8,
  pageY: 3,
  pageScale: 0.88,
  pageAngle: -7,
  chart: 0.7,
  mark: 0,
  note: 0,
  queue: 0,
  transfer: 0,
  handoff: 0,
  record: 0,
};

type TrackName = keyof typeof composition;
type Frame = readonly [time: number, value: number];

// The score is intentionally source-authored: every channel can be edited independently.
export const frames: Record<TrackName, readonly Frame[]> = {
  hero: [[0, 1], [0.7, 1], [2, 0], [16, 0]],
  pageX: [[0, 8], [1.3, 8], [4, 0], [10, 0], [13.8, -15], [16, -15]],
  pageY: [[0, 3], [1.3, 3], [4, 0], [10, 0], [13.8, -5], [16, -5]],
  pageScale: [[0, 0.88], [1.3, 0.88], [4, 1], [10, 1], [13.8, 0.8], [16, 0.8]],
  pageAngle: [[0, -7], [1.3, -7], [4, 0], [10, 0], [13.8, -6], [16, -6]],
  chart: [[0, 0.7], [1.5, 0.7], [4.5, 1], [10, 1], [14, 0.3], [16, 0.3]],
  mark: [[0, 0], [4.2, 0], [5.5, 1], [16, 1]],
  note: [[0, 0], [5.6, 0], [7.4, 1], [13.3, 1], [14.3, 0], [16, 0]],
  queue: [[0, 0], [11.5, 0], [13.3, 1], [16, 1]],
  transfer: [[0, 0], [10.3, 0], [13, 1], [16, 1]],
  handoff: [[0, 0], [10.3, 0], [13.3, 1], [16, 1]],
  record: [[0, 0], [13.3, 0], [14.3, 1], [16, 1]],
};

const trackEntries = Object.entries(frames).map(([name, points]) => [name, {
  type: 'BasicKeyframedTrack',
  keyframes: points.map(([position, value], index) => ({
    id: `${name}-${index}`,
    position,
    value,
    connectedRight: true,
    handles: [0.5, 1, 0.5, 0],
    type: 'bezier',
  })),
}]);

export const projectState = {
  definitionVersion: '0.4.0',
  revisionHistory: ['waypoint-theatre-lab-cut-01'],
  sheetsById: {
    [SHEET_NAME]: {
      staticOverrides: { byObject: {} },
      sequence: {
        type: 'PositionalSequence',
        length: END_TIME,
        subUnitsPerUnit: 30,
        tracksByObject: {
          Composition: {
            trackData: Object.fromEntries(trackEntries),
            trackIdByPropPath: Object.fromEntries(Object.keys(frames).map((name) => [JSON.stringify([name]), name])),
          },
        },
      },
    },
  },
};

export function chapterAt(time: number): 'opening' | 'annotation' | 'queue' {
  if (time >= 12) return 'queue';
  if (time >= 2) return 'annotation';
  return 'opening';
}

export function destinationAfter(time: number): number {
  return time < ANNOTATION_TIME - 0.01 ? ANNOTATION_TIME : END_TIME;
}
