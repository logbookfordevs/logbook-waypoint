const CURATED_STYLE_KEYS = [
  'display',
  'position',
  'fontSize',
  'color',
  'backgroundColor',
  'margin',
  'padding',
];

const TRIVIAL_STYLES = new Map([
  ['display', 'block'],
  ['position', 'static'],
  ['fontSize', '16px'],
  ['color', 'rgb(0, 0, 0)'],
  ['backgroundColor', 'rgba(0, 0, 0, 0)'],
  ['margin', '0px'],
  ['padding', '0px'],
]);

const FRAMEWORK_COMPONENT_NAMES = new Set([
  'AppRouterContext',
  'GlobalLayoutRouterContext',
  'HeadManagerContext',
  'LayoutRouterContext',
  'PathnameContext',
  'RouterContext',
  'SearchParamsContext',
]);

function definedEntries(entries) {
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function compactStyles(styles) {
  if (!styles || typeof styles !== 'object') return undefined;
  const entries = CURATED_STYLE_KEYS.flatMap(key => {
    const value = styles[key];
    if (value === undefined || value === '' || TRIVIAL_STYLES.get(key) === value) return [];
    return [[key, value]];
  });
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function compactSize(position) {
  if (!position || !Number.isFinite(position.width) || !Number.isFinite(position.height)) return undefined;
  return {
    width: Math.round(position.width),
    height: Math.round(position.height),
  };
}

function compactParent(parentChain) {
  const parent = parentChain?.[0];
  if (!parent) return undefined;
  const context = definedEntries([
    ['tag', parent.tag],
    ['id', parent.id || undefined],
    ['classes', Array.isArray(parent.classes) && parent.classes.length ? parent.classes.slice(0, 2) : undefined],
  ]);
  return Object.keys(context).length ? context : undefined;
}

function compactSourceIdentity(target) {
  const identity = target?.source_identity || target;
  const componentName = FRAMEWORK_COMPONENT_NAMES.has(identity?.component_name)
    ? undefined
    : identity?.component_name || undefined;
  const sourceFilePath = identity?.source_file_path || undefined;
  const sourceLineRange = identity?.source_line_range || undefined;
  if (!componentName && !sourceFilePath && !sourceLineRange) return undefined;
  return definedEntries([
    ['component_name', componentName],
    ['source_file_path', sourceFilePath],
    ['source_line_range', clone(sourceLineRange)],
    ['source_map_available', identity?.source_map_available === true ? true : undefined],
  ]);
}

export function annotationTargets(annotation) {
  if (Array.isArray(annotation.targets) && annotation.targets.length) return annotation.targets;
  return [{
    selector: annotation.selector,
    viewport: annotation.viewport,
    element_context: annotation.element_context,
    parent_chain: annotation.parent_chain,
    component_name: annotation.component_name,
    source_file_path: annotation.source_file_path,
    source_line_range: annotation.source_line_range,
    source_map_available: annotation.source_map_available,
    context_hints: annotation.context_hints,
    source_identity: annotation.source_identity,
    source_mapping: annotation.source_mapping,
    screenshot: annotation.screenshot,
    badge_offset: annotation.badge_offset,
  }];
}

function compactTarget(target, index) {
  const context = target?.element_context || target || {};
  return definedEntries([
    ['index', index],
    ['selector', target?.selector],
    ['tag', context.tag],
    ['text', typeof context.text === 'string' ? context.text : undefined],
    ['styles', compactStyles(context.styles)],
    ['size', compactSize(context.position) || clone(target?.size)],
    ['context', compactParent(target?.parent_chain) || clone(target?.context)],
    ['source_identity', compactSourceIdentity(target)],
  ]);
}

function compactVariantRequest(request) {
  if (!request) return undefined;
  return definedEntries([
    ['status', request.status],
    ['active_variant_key', request.active_variant_key],
    ['variants', Array.isArray(request.variants)
      ? request.variants.map(({ key, name, state }) => ({ key, name, state }))
      : undefined],
  ]);
}

function hasScreenshot(annotation, targets) {
  return Boolean(
    annotation.has_screenshot
    || annotation.screenshot?.data_url
    || annotation.screenshot?.attachment_id
    || targets.some(target => (
      target?.has_screenshot
      || target?.screenshot?.data_url
      || target?.screenshot?.attachment_id
    )),
  );
}

export function summarizeAnnotation(annotation) {
  const targets = annotationTargets(annotation);
  const hasVariantRequest = annotation.variant_request !== undefined;
  return definedEntries([
    ['id', annotation.id],
    ['url', annotation.url],
    ['url_path', annotation.url_path],
    ['status', annotation.status],
    ['comment', annotation.comment],
    ['target_count', targets.length],
    ['targets', targets.map(compactTarget)],
    ['design_intent', clone(annotation.design_intent)],
    ['variant_intent', clone(annotation.variant_intent)],
    ['variant_request', compactVariantRequest(annotation.variant_request)],
    ['pending_changes', hasVariantRequest ? undefined : clone(annotation.pending_changes)],
    ['css', hasVariantRequest ? undefined : annotation.css],
    ['claim', clone(annotation.claim)],
    ['work_notice', clone(annotation.work_notice)],
    ['resolution_record', clone(annotation.resolution_record)],
    ['has_screenshot', hasScreenshot(annotation, targets)],
    ['has_attachments', Boolean(annotation.has_attachments || annotation.attachments?.length)],
    ['created_at', annotation.created_at],
    ['updated_at', annotation.updated_at],
  ]);
}

export const FRAMEWORK_COMPONENTS_OMITTED_FROM_SUMMARIES = FRAMEWORK_COMPONENT_NAMES;
