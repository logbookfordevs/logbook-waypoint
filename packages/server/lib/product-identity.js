import { ANNOTATION_ID_PREFIX } from './annotation-id.js';

export const PRODUCT_IDENTITY = Object.freeze({
  productName: 'Logbook Waypoint',
  description: 'Annotate web interfaces with personal journal notes or visual feedback for coding agents.',
  repositorySlug: 'logbook-waypoint',
  npmPackage: '@logbookfordevs/waypoint',
  cliCommand: 'waypoint',
  mcpConfigKey: 'logbook-waypoint',
  dataDirectory: '.logbook-waypoint',
  annotationIdPrefix: ANNOTATION_ID_PREFIX,
  repositoryUrl: 'https://github.com/logbookfordevs/logbook-waypoint',
  supportUrl: 'https://github.com/logbookfordevs/logbook-waypoint/issues',
  homepageUrl: 'https://github.com/logbookfordevs/logbook-waypoint#readme',
  domainUrl: 'https://logbookfordevs.com/',
});

export function validateProductIdentity(identity = PRODUCT_IDENTITY) {
  for (const [field, value] of Object.entries(PRODUCT_IDENTITY)) {
    if (identity[field] !== value) {
      throw new TypeError(`Invalid Logbook Waypoint identity field: ${field}`);
    }
  }

  return identity;
}

validateProductIdentity();
