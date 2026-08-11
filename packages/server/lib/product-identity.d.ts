export interface ProductIdentity {
  readonly productName: 'Logbook Waypoint';
  readonly description: 'Place visual annotations on local interfaces and route them to coding agents through MCP.';
  readonly repositorySlug: 'logbook-waypoint';
  readonly npmPackage: '@logbookfordevs/waypoint';
  readonly cliCommand: 'waypoint';
  readonly mcpConfigKey: 'logbook-waypoint';
  readonly dataDirectory: '.logbook-waypoint';
  readonly annotationIdPrefix: 'waypoint_';
  readonly repositoryUrl: 'https://github.com/logbookfordevs/logbook-waypoint';
  readonly supportUrl: 'https://github.com/logbookfordevs/logbook-waypoint/issues';
  readonly homepageUrl: 'https://github.com/logbookfordevs/logbook-waypoint#readme';
  readonly domainUrl: 'https://logbookfordevs.com/';
}

export const PRODUCT_IDENTITY: Readonly<ProductIdentity>;
export function validateProductIdentity(identity?: ProductIdentity): ProductIdentity;
