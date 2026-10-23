var WaypointAnnotationPage = (() => {
  function key(value) {
    try {
      const url = new URL(value);
      return `${url.origin}${url.pathname}`;
    } catch {
      return null;
    }
  }

  function matches(left, right) {
    const leftKey = key(left);
    return leftKey !== null && leftKey === key(right);
  }
  const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
  const LOCAL_SUFFIXES = ['.local', '.test', '.localhost'];
  const PRIVATE_NETWORK_HOST = /^(127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[::1\])$/;

  function parse(value) {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }

  function isLocalDevUrl(value) {
    const url = parse(value);
    if (!url) return false;
    if (url.protocol === 'file:') {
      const path = url.pathname.toLowerCase();
      return path.endsWith('.html') || path.endsWith('.htm') || !path.includes('.') || path.endsWith('/');
    }
    return LOCAL_HOSTNAMES.has(url.hostname) || LOCAL_SUFFIXES.some(suffix => url.hostname.endsWith(suffix));
  }

  function hostClass(value) {
    const url = parse(value);
    const isDev = isLocalDevUrl(value) || Boolean(url && PRIVATE_NETWORK_HOST.test(url.hostname));
    return isDev ? 'dev' : 'site';
  }

  return { key, matches, isLocalDevUrl, hostClass };
})();

globalThis.WaypointAnnotationPage = WaypointAnnotationPage;
