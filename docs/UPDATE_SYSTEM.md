# Local version compatibility

Logbook Waypoint reports version compatibility through its loopback server. It does not advertise releases, fetch registry metadata, or display promotional update badges, banners, or changelogs.

## Contract

The server exposes local version information from `GET http://127.0.0.1:3846/health`:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "minExtensionVersion": "0.1.0",
  "timestamp": "2026-08-11T00:00:00.000Z"
}
```

- `version` is the running server package version.
- `minExtensionVersion` is the minimum compatible extension version.
- `timestamp` describes this health response, not a release event.

The extension reads this endpoint only from the fixed loopback server URL. It compares its manifest version with `minExtensionVersion` and presents a quiet compatibility message when the extension is too old. Connection failures remain ordinary local-server status errors.

## User experience

- Compatibility state is informational and does not block Annotation work.
- The extension action badge remains reserved for the current route's Annotation count.
- The popup and in-page toolbar do not contain release announcements or release-note controls.
- The server performs no automatic registry, release, or changelog request.
- Waypoint does not download, install, schedule, or publish updates.

Updating the extension or server remains an explicit user-controlled installation operation outside this compatibility contract. Refer to the project's release channel or package installation instructions when an update is intentionally requested.

## Development and testing

When the compatibility interface changes:

1. Keep `/health` local, stable, and free of release metadata.
2. Update the extension's health-response handling and compatibility copy together.
3. Add hermetic tests for compatible, incompatible, unavailable, and malformed responses.
4. Do not use live registries, release APIs, external network calls, or user data as fixtures.

The active regression tests also reject documentation and runtime source that reintroduce promotional release UI or automatic remote update checking.
