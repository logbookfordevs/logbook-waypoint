var WaypointSourceIdentity = (() => {
  const TARGET_ATTRIBUTE = 'data-waypoint-source-target';
  const COMPONENT_ATTRIBUTES = ['data-component-name', 'data-source-component'];
  const FILE_ATTRIBUTES = ['data-source-file', 'data-component-file', 'data-file', 'data-nextjs-path'];
  const LINE_ATTRIBUTES = ['data-source-line', 'data-line'];
  const MAX_COMPONENT_LENGTH = 120;
  const MAX_FILE_PATH_LENGTH = 500;
  const MAX_LINE_RANGE_LENGTH = 40;

  async function resolve(target) {
    if (!target?.setAttribute || !target?.getAttribute) return null;

    const reactResult = await probeReact(target);
    if (reactResult) return reactResult;

    return readBuildHints(target);
  }

  async function probeReact(target) {
    const targetId = createTargetId();
    const previousTargetId = target.getAttribute(TARGET_ATTRIBUTE);
    target.setAttribute(TARGET_ATTRIBUTE, targetId);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'probeSourceIdentity',
        targetId,
      });
      if (!response?.success) return null;
      return sanitizeResult(response.result);
    } catch {
      return null;
    } finally {
      if (previousTargetId === null) target.removeAttribute(TARGET_ATTRIBUTE);
      else target.setAttribute(TARGET_ATTRIBUTE, previousTargetId);
    }
  }

  function createTargetId() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function readBuildHints(target) {
    let current = target;
    let depth = 0;

    while (current && depth < 5) {
      const componentName = readFirstAttribute(current, COMPONENT_ATTRIBUTES);
      const filePathHint = readFirstAttribute(current, FILE_ATTRIBUTES);
      const sourceLine = readFirstAttribute(current, LINE_ATTRIBUTES);
      const result = sanitizeResult({
        component_name: componentName,
        file_path_hint: filePathHint,
        line_range_hint: sourceLine ? `${sourceLine}-${sourceLine}` : null,
      });
      if (result) return result;
      current = current.parentElement;
      depth += 1;
    }

    return null;
  }

  function readFirstAttribute(target, names) {
    for (const name of names) {
      const value = target.getAttribute(name);
      if (value) return value;
    }
    return null;
  }

  function sanitizeResult(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const allowedKeys = new Set(['component_name', 'file_path_hint', 'line_range_hint']);
    if (Object.keys(value).some(key => !allowedKeys.has(key))) return null;

    const componentName = sanitizeHint(value.component_name, MAX_COMPONENT_LENGTH);
    const filePathHint = sanitizeHint(value.file_path_hint, MAX_FILE_PATH_LENGTH);
    const lineRangeHint = sanitizeLineRange(value.line_range_hint);
    if (!componentName && !filePathHint) return null;

    return {
      component_name: componentName,
      file_path_hint: filePathHint,
      line_range_hint: lineRangeHint,
    };
  }

  function sanitizeHint(value, maxLength) {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return null;
    const hint = value.trim();
    if (!hint || hint.length > maxLength || /[\u0000-\u001F\u007F]/.test(hint)) return null;
    return hint;
  }

  function sanitizeLineRange(value) {
    const hint = sanitizeHint(value, MAX_LINE_RANGE_LENGTH);
    if (!hint || !/^\d+(?:-\d+)?$/.test(hint)) return null;
    return hint;
  }

  return { resolve };
})();
