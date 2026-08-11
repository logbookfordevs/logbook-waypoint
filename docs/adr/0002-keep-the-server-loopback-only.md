# Keep the server loopback-only

The Waypoint server binds to loopback and rejects untrusted Host and Origin values rather than supporting LAN-wide or WSL bridge access by default. This deliberately trades cross-machine convenience for a smaller unauthenticated local attack surface while preserving the extension's `127.0.0.1` integration.
