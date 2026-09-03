# Logbook Waypoint Privacy Policy

Last updated: September 2, 2026

Logbook Waypoint is a local-first browser extension and coding-agent tool for
placing structured visual annotations on interfaces under development.

## Data Waypoint handles

When you create an Annotation, Waypoint may process and store:

- the page URL and title;
- your Annotation text and selected visual changes;
- information about the selected page element, such as its text, attributes,
  selector, layout, and available source identity;
- a screenshot of the selected interface when screenshot capture is enabled;
- image attachments you explicitly add;
- preferences, Queue state, and Annotation lifecycle history.

Waypoint does not require a Logbook account and does not include advertising,
analytics, or telemetry.

## Where data is stored and sent

The browser extension stores its data in Chrome's local extension storage on
your device. It also synchronizes Annotation data with the optional Waypoint
server running on `127.0.0.1:3846` on the same device. The server is designed to
listen only on the IPv4 loopback interface.

Waypoint does not send Annotation data, browsing activity, screenshots, or
attachments to Logbook for Devs or another external server. Coding agents that
you separately connect to the local Waypoint server may receive Annotation data
under the terms and privacy practices of those agents and their providers.

Links in the extension may open external websites when you choose them. Merely
opening those websites is governed by their respective privacy policies.

## Permissions

Waypoint uses browser permissions to:

- access the active tab when you invoke the extension;
- store Annotations and preferences locally;
- install the Annotation interface on local development pages;
- capture the visible tab when screenshot capture is enabled; and
- let you explicitly enable Waypoint on additional sites.

Waypoint does not use these permissions to build a browsing history, serve ads,
or sell user data.

## Retention and deletion

Data remains on your device until you delete individual Annotations, delete a
project's data, clear all Waypoint data, remove the extension's stored data, or
delete the local server's data. Waypoint includes Data & Storage controls for
reviewing and deleting locally stored project data.

## Sharing and sale

Logbook for Devs does not sell Waypoint user data. Because Waypoint does not
receive your Annotation data, Logbook for Devs does not share that data with
third parties. Data sent to a coding agent at your direction is a user-initiated
disclosure to that agent.

## Security

Waypoint limits its server to the local loopback interface, validates browser
origins and identifiers, and treats page-derived content as untrusted. Security
details and vulnerability reporting instructions are available in
[SECURITY.md](SECURITY.md).

## Changes

Material changes to this policy will be published in this repository with an
updated date. Store disclosures will be updated when a release changes how
Waypoint handles data.

## Contact

For privacy questions, open an issue at
<https://github.com/logbookfordevs/logbook-waypoint/issues>. Do not include
sensitive Annotation data in a public issue. Security reports should use the
private process described in [SECURITY.md](SECURITY.md).
