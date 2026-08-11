export const ANNOTATION_ID_PATTERN = /^vibe_[0-9]{10,16}_[a-z0-9]{6,32}$/;

export const MCP_ALLOWED_ORIGINS = [
  'http://127.0.0.1:3846',
  'http://localhost:3846',
  'http://[::1]:3846'
];

export function isValidAnnotationId(value) {
  return typeof value === 'string' && ANNOTATION_ID_PATTERN.test(value);
}

export function isAllowedHostHeader(value) {
  return typeof value === 'string'
    && /^(localhost|127\.0\.0\.1|\[::1\])(?::[0-9]{1,5})?$/.test(value);
}

export function isAllowedBrowserOrigin(value) {
  if (!value) return true;

  if (/^chrome-extension:\/\/[a-p]{32}$/.test(value)) {
    return true;
  }

  try {
    const origin = new URL(value);
    if (origin.protocol !== 'http:' && origin.protocol !== 'https:') {
      return false;
    }

    const hostname = origin.hostname.toLowerCase();
    return hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '0.0.0.0'
      || hostname === '[::1]'
      || hostname.endsWith('.localhost')
      || hostname.endsWith('.local')
      || hostname.endsWith('.test');
  } catch {
    return false;
  }
}

export function localRequestBoundary(req, res, next) {
  if (!isAllowedHostHeader(req.get('host'))) {
    return res.status(403).json({ error: 'Invalid Host header' });
  }

  if (!isAllowedBrowserOrigin(req.get('origin'))) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  next();
}

export function mcpTransportSecurity(req) {
  const origin = req.get('origin');
  return {
    allowedHosts: [req.get('host')],
    allowedOrigins: origin ? [origin] : MCP_ALLOWED_ORIGINS,
    enableDnsRebindingProtection: true
  };
}
