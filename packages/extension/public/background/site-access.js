var WaypointSiteAccess = (() => {
  async function hasCurrentSiteAccess(senderUrl, { isLocalhostUrl, containsPermission }) {
    if (!senderUrl) return false;
    if (isLocalhostUrl(senderUrl)) return true;
    const url = new URL(senderUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    return containsPermission(`${url.origin}/*`);
  }

  return { hasCurrentSiteAccess };
})();
