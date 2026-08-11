// Logbook Waypoint portable export codec

globalThis.WaypointExportCodec = (() => {
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

  function getAnnotationRoute(annotation, fallbackUrl) {
    try {
      return routeFor(annotation).route;
    } catch {
      if (annotation.url_path) return annotation.url_path;
      try {
        const url = new URL(fallbackUrl);
        return `${url.pathname}${url.search}${url.hash}`;
      } catch {
        return '';
      }
    }
  }

  function exportedAnnotation(annotation, fallbackUrl) {
    annotation = WaypointAnnotationStatus.normalize(annotation);
    const portable = portableValue(annotation);
    const urlPath = getAnnotationRoute(annotation, fallbackUrl);

    return {
      ...portable,
      id: annotation.id,
      status: annotation.status,
      ...(urlPath ? { url_path: urlPath } : {}),
      has_screenshot: Boolean(annotation.screenshot?.data_url || annotation.screenshot?.attachment_id || annotation.has_screenshot),
      has_attachments: Boolean(annotation.attachments?.length || annotation.has_attachments),
    };
  }

  function filterAnnotationsByStatus(annotations, status = 'all') {
    if (!Array.isArray(annotations)) throw new TypeError('Annotations must be an array');
    if (typeof status !== 'string' || status.length === 0) throw new TypeError('Export status must be a string');
    const normalized = WaypointAnnotationStatus.normalizeAll(annotations);
    return status === 'all' ? normalized : normalized.filter(annotation => annotation.status === status);
  }

  function groupAnnotationsByRoute(annotations, fallbackUrl) {
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
      groups.get(key).annotations.push(exportedAnnotation(annotation, fallbackUrl));
    }

    return [...groups.values()];
  }

  function sourceForExport(source) {
    if (!source) return undefined;
    try {
      const url = new URL(typeof source === 'string' ? source : (source.href || source.origin));
      return { origin: url.origin, hostname: url.hostname, port: url.port };
    } catch {
      return undefined;
    }
  }

  function createExportEnvelope(annotations, {
    scope = 'project',
    status = 'all',
    exportedAt = new Date().toISOString(),
    source,
  } = {}) {
    const selected = filterAnnotationsByStatus(annotations, status);
    const fallbackSource = sourceForExport(source);
    const routes = groupAnnotationsByRoute(selected, fallbackSource?.origin);
    const portableAnnotations = selected.map(annotation => exportedAnnotation(annotation, fallbackSource?.origin));
    const routeSource = routes[0] && sourceForExport(routes[0].origin);

    return {
      waypoint_annotations_export: true,
      version: '1.0',
      exported_at: exportedAt,
      source: routeSource || fallbackSource,
      scope,
      status_filter: status,
      annotation_count: selected.length,
      annotations: portableAnnotations,
      routes,
    };
  }

  function normalizeImportEnvelope(data) {
    if (!data || data.waypoint_annotations_export !== true) return null;
    if (Array.isArray(data.annotations)) return { ...data, annotations: WaypointAnnotationStatus.normalizeAll(data.annotations) };
    if (!Array.isArray(data.routes)) return null;

    const annotations = data.routes.flatMap(group => (group.annotations || []).map(annotation => ({
      ...annotation,
      url: annotation.url || group.url || (group.origin && group.route ? `${group.origin}${group.route}` : undefined),
      url_path: annotation.url_path || group.route,
    })));
    if (!annotations.length) return null;

    const source = data.source || sourceForExport(data.routes[0]?.origin);
    return { ...data, source, annotations: WaypointAnnotationStatus.normalizeAll(annotations) };
  }

  function formatAnnotationsAsMarkdown(annotations, { scope = 'project', status = 'all', formatGroups } = {}) {
    const statusLabel = status === 'all' ? 'all statuses' : status;
    const portableAnnotations = annotations.map(annotation => exportedAnnotation(annotation));
    return `# Logbook Waypoint export\n\nScope: ${scope}\nStatus: ${statusLabel}\n\n${formatGroups(portableAnnotations)}`;
  }

  return {
    createExportEnvelope,
    exportedAnnotation,
    filterAnnotationsByStatus,
    formatAnnotationsAsMarkdown,
    getAnnotationRoute,
    groupAnnotationsByRoute,
    normalizeImportEnvelope,
    portableValue,
  };
})();
