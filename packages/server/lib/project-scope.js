const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function parseLoopbackUrl(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${label} must be a URL`);
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${label} must be a valid loopback URL`);
  }

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:')
    || !LOOPBACK_HOSTS.has(url.hostname.toLowerCase())
    || url.username
    || url.password
  ) {
    throw new TypeError(`${label} must be a loopback URL`);
  }

  return url;
}

export function isLoopbackProjectUrl(value) {
  try {
    parseLoopbackUrl(value, 'Project URL');
    return true;
  } catch {
    return false;
  }
}

export function createProjectScope(value) {
  if (typeof value !== 'string') throw new TypeError('Project URL must be a URL');

  const hasWildcard = value.endsWith('*');
  if (value.includes('*') && !hasWildcard) {
    throw new TypeError('Project URL wildcard must appear at the end');
  }

  const url = parseLoopbackUrl(hasWildcard ? value.slice(0, -1) : value, 'Project URL');
  if (hasWildcard && (url.search || url.hash)) {
    throw new TypeError('Project URL wildcard cannot include a query or hash');
  }

  return {
    origin: url.origin,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    viewState: Boolean(url.search || url.hash),
    wildcard: hasWildcard,
    projectRoot: !hasWildcard && url.pathname === '/' && !url.search && !url.hash,
  };
}

export function matchesProjectScope(annotationUrl, scope) {
  const normalizedScope = typeof scope === 'string' ? createProjectScope(scope) : scope;
  if (!normalizedScope || typeof normalizedScope !== 'object') return false;

  let url;
  try {
    url = parseLoopbackUrl(annotationUrl, 'Annotation URL');
  } catch {
    return false;
  }

  if (url.origin !== normalizedScope.origin) return false;
  if (normalizedScope.projectRoot) return true;
  if (normalizedScope.wildcard) {
    const scopeRoot = normalizedScope.pathname.endsWith('/')
      ? normalizedScope.pathname.slice(0, -1)
      : normalizedScope.pathname;
    return url.pathname === scopeRoot || url.pathname.startsWith(normalizedScope.pathname);
  }

  if (url.pathname !== normalizedScope.pathname) return false;
  if (!normalizedScope.viewState) return true;
  return url.search === normalizedScope.search && url.hash === normalizedScope.hash;
}
