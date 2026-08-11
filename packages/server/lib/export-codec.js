function exportedAnnotation(annotation) {
  const { screenshot, ...portable } = annotation;
  return {
    ...portable,
    has_screenshot: Boolean(screenshot?.data_url || screenshot?.attachment_id || annotation.has_screenshot),
  };
}

function routeFor(annotation) {
  const url = new URL(annotation.url);
  return {
    origin: url.origin,
    route: `${url.pathname}${url.search}${url.hash}`,
    url: url.toString(),
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
  const normalizedFormat = format === 'md' ? 'markdown' : format;
  if (normalizedFormat !== 'json' && normalizedFormat !== 'markdown') {
    throw new TypeError('Export format must be json or markdown');
  }

  const payload = {
    format: normalizedFormat,
    exported_at: exportedAt,
    status,
    annotation_count: selected.length,
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
