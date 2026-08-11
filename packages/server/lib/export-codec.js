const SENSITIVE_EXPORT_KEYS = new Set([
  'attachments',
  'screenshot',
  'source_file_path',
  'source_mapping',
  'source_identity',
]);

function isSensitiveExportKey(key) {
  return SENSITIVE_EXPORT_KEYS.has(key)
    || /(?:^|_)(?:data_url|file_path|file_path_hint|filesystem_path|source_path|absolute_path|local_path)$/.test(key);
}

function portableValue(value) {
  if (Array.isArray(value)) return value.map(portableValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isSensitiveExportKey(key))
      .map(([key, nestedValue]) => [key, portableValue(nestedValue)]),
  );
}

function routeFor(annotation) {
  const url = new URL(annotation.url);
  return {
    origin: url.origin,
    route: `${url.pathname}${url.search}${url.hash}`,
    url: url.toString(),
  };
}

function exportedAnnotation(annotation) {
  const portable = portableValue(annotation);
  let urlPath = annotation.url_path;
  try {
    urlPath = routeFor(annotation).route;
  } catch {
    // Preserve an origin-less route when an older export has no usable URL.
  }

  return {
    ...portable,
    id: annotation.id,
    status: annotation.status || 'pending',
    ...(urlPath ? { url_path: urlPath } : {}),
    has_screenshot: Boolean(annotation.screenshot?.data_url || annotation.screenshot?.attachment_id || annotation.has_screenshot),
    has_attachments: Boolean(annotation.attachments?.length || annotation.has_attachments),
  };
}

export function filterAnnotationsForExport(annotations, status = 'all') {
  if (!Array.isArray(annotations)) throw new TypeError('Annotations must be an array');
  if (typeof status !== 'string' || status.length === 0) throw new TypeError('Export status must be a string');
  return status === 'all' ? annotations : annotations.filter(annotation => annotation.status === status);
}

export function groupAnnotationsByRoute(annotations) {
  const groups = new Map();

  for (const annotation of annotations) {
    let route;
    try {
      route = routeFor(annotation);
    } catch {
      continue;
    }
    const key = `${route.origin}${route.route}`;
    if (!groups.has(key)) groups.set(key, { ...route, annotations: [] });
    groups.get(key).annotations.push(exportedAnnotation(annotation));
  }

  return [...groups.values()];
}

function markdownFor(groups) {
  const lines = ['# Logbook Waypoint export'];
  for (const group of groups) {
    lines.push('', `## \`${group.route}\``, '', `Source: ${group.origin}`);
    for (const annotation of group.annotations) {
      lines.push('', `- [${annotation.status ?? 'unknown'}] ${annotation.comment ?? ''}`, `  - ID: ${annotation.id}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function encodeAnnotationsExport(annotations, {
  format = 'json',
  status = 'all',
  exportedAt = new Date().toISOString(),
} = {}) {
  const selected = filterAnnotationsForExport(annotations, status);
  const routes = groupAnnotationsByRoute(selected);
  const portableAnnotations = selected.map(exportedAnnotation);
  const normalizedFormat = format === 'md' ? 'markdown' : format;
  if (normalizedFormat !== 'json' && normalizedFormat !== 'markdown') {
    throw new TypeError('Export format must be json or markdown');
  }

  const payload = {
    waypoint_annotations_export: true,
    version: '1.0',
    exported_at: exportedAt,
    source: routes.length > 0 ? {
      origin: routes[0].origin,
      hostname: new URL(routes[0].origin).hostname,
      port: new URL(routes[0].origin).port,
    } : undefined,
    scope: 'project',
    status_filter: status,
    annotation_count: selected.length,
    annotations: portableAnnotations,
    routes,
  };

  return {
    format: normalizedFormat,
    content_type: normalizedFormat === 'json' ? 'application/json' : 'text/markdown',
    file_extension: normalizedFormat === 'json' ? 'json' : 'md',
    count: selected.length,
    routes: routes.length,
    content: normalizedFormat === 'json'
      ? `${JSON.stringify(payload, null, 2)}\n`
      : markdownFor(routes),
  };
}
