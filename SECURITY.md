# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Logbook Waypoint seriously. If you have discovered a security vulnerability in our project, we appreciate your help in disclosing it to us in a responsible manner.

### Reporting Process

Please report security vulnerabilities by emailing the project maintainers directly. We will acknowledge your email within 48 hours, and send a more detailed response within 96 hours indicating the next steps in handling your report.

### What to Include

Please include the following information in your report:

* Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit the issue

### What to Expect

After you submit a vulnerability report, you can expect:

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
2. **Communication**: We will keep you informed about the progress of addressing the vulnerability
3. **Resolution**: We will work on a fix and coordinate with you on the disclosure timeline
4. **Recognition**: With your permission, we will acknowledge your contribution in the security advisory

### Security Update Process

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all still-supported versions
4. Release new versions as soon as possible

## Security Best Practices

When using Logbook Waypoint:

1. **Keep Updated**: Always use the latest version of both the Chrome extension and the server
2. **Local Only**: The system is designed for localhost development only - never expose the server to the internet
3. **Data Privacy**: Annotations are stored locally and never sent to external servers
4. **Extension Permissions**: The extension only requests necessary permissions for localhost domains

## Local trust boundary

The local server:

- Binds only to `127.0.0.1:3846`.
- Rejects non-loopback `Host` headers and untrusted browser origins.
- Enables MCP DNS-rebinding protection for streamable HTTP and legacy SSE transports.
- Accepts only annotation IDs matching the extension's current `vibe_<timestamp>_<random>` contract.
- Marks annotation and page-derived MCP data as untrusted content that cannot override agent, repository, or tool instructions.

Screenshots are embedded in the local annotation JSON in this foundation. There are no attachment filesystem endpoints, so attachment path-containment controls do not apply yet.

The optional page-world API (`window.__vibeAnnotations`) still communicates through page-visible custom events. Enable the extension only on development pages you trust. Authentication or capability isolation for that bridge is tracked as a separate compatibility-sensitive hardening phase.

Thank you for helping keep Logbook Waypoint and our users safe!
