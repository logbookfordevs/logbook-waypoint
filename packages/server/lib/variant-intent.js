const DEFAULT_VARIANT_COUNT = 3;
const COUNT_WORDS = new Map([
  ['one', 1],
  ['two', 2],
  ['three', 3],
  ['four', 4],
  ['five', 5],
  ['six', 6],
  ['seven', 7],
  ['eight', 8],
  ['nine', 9],
  ['ten', 10],
  ['eleven', 11],
  ['twelve', 12],
  ['thirteen', 13],
  ['fourteen', 14],
  ['fifteen', 15],
  ['sixteen', 16],
  ['seventeen', 17],
  ['eighteen', 18],
  ['nineteen', 19],
  ['twenty', 20],
  ['thirty', 30],
  ['forty', 40],
  ['fifty', 50],
  ['sixty', 60],
  ['seventy', 70],
  ['eighty', 80],
  ['ninety', 90],
  ['hundred', 100],
  ['dozen', 12],
]);
const COUNT_WORD = [...COUNT_WORDS.keys()].join('|');
const COUNT_TOKEN = `(\\d+|(?:${COUNT_WORD})(?:[ -](?:${COUNT_WORD}))*)`;
const VARIANT_NOUN = '(?:variants?|candidates?|directions?|alternatives?)';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function assertVariantIntent(value) {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !== 'default_count,requested') {
    throw new TypeError('Variant Intent must contain only requested and default_count');
  }
  if (value.requested !== true) {
    throw new TypeError('Variant Intent requested must be true');
  }
  if (value.default_count !== DEFAULT_VARIANT_COUNT) {
    throw new TypeError(`Variant Intent default_count must be ${DEFAULT_VARIANT_COUNT}`);
  }
  return value;
}

export function assertAnnotationVariantIntent(annotation) {
  if (annotation.variant_intent !== undefined) assertVariantIntent(annotation.variant_intent);
  return annotation;
}

export function applyVariantIntentUpdate(annotation, updates) {
  const updated = { ...annotation, ...updates };
  if (Object.hasOwn(updates, 'variant_intent') && updates.variant_intent === null) {
    delete updated.variant_intent;
  }
  return assertAnnotationVariantIntent(updated);
}

export function preserveVariantIntent(existing, incoming) {
  if (existing?.variant_intent !== undefined && !Object.hasOwn(incoming, 'variant_intent')) {
    return assertAnnotationVariantIntent({ ...incoming, variant_intent: existing.variant_intent });
  }
  return assertAnnotationVariantIntent(incoming);
}

function parseCount(value) {
  if (/^\d+$/.test(value)) return Number(value);
  const values = value.toLocaleLowerCase().split(/[ -]/).map(word => COUNT_WORDS.get(word));
  if (values.includes(100)) {
    const hundredIndex = values.indexOf(100);
    const hundreds = hundredIndex === 0 ? 100 : values.slice(0, hundredIndex).reduce((sum, part) => sum + part, 0) * 100;
    return hundreds + values.slice(hundredIndex + 1).reduce((sum, part) => sum + part, 0);
  }
  return values.reduce((sum, part) => sum + part, 0);
}

export function requestedVariantCount(annotation) {
  const intent = assertVariantIntent(annotation?.variant_intent);
  const comment = typeof annotation?.comment === 'string' ? annotation.comment : '';
  const patterns = [
    new RegExp(`\\b${COUNT_TOKEN}(?:\\s+[a-z-]+){0,2}\\s+${VARIANT_NOUN}\\b`, 'gi'),
    new RegExp(`\\b${VARIANT_NOUN}\\s*(?:[:=-]|of)?\\s*${COUNT_TOKEN}\\b`, 'gi'),
  ];
  const counts = new Set();
  for (const pattern of patterns) {
    for (const match of comment.matchAll(pattern)) {
      const token = match.slice(1).find(value => value !== undefined);
      counts.add(parseCount(token));
    }
  }
  if (counts.size === 0) return intent.default_count;
  if (counts.size > 1 || [...counts].some(count => count < 2 || count > 6)) {
    throw new TypeError('Variant count requires clarification; request one count between 2 and 6');
  }
  return [...counts][0];
}
