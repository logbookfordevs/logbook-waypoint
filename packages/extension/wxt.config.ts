import { defineConfig } from 'wxt';

import { PRODUCT_IDENTITY } from '@logbookfordevs/waypoint/product-identity';

const LOCAL_MATCHES = [
  'http://localhost/*',
  'https://localhost/*',
  'http://127.0.0.1/*',
  'https://127.0.0.1/*',
  'http://0.0.0.0/*',
  'https://0.0.0.0/*',
  'http://*.local/*',
  'https://*.local/*',
  'http://*.test/*',
  'https://*.test/*',
  'http://*.localhost/*',
  'https://*.localhost/*',
  'file:///*',
];

const CONTENT_MODULES = [
  'annotation-id.js',
  'annotation-status.js',
  'annotation-targets.js',
  'annotation-collection.js',
  'annotation-page.js',
  'design-intent.js',
  'variant-intent.js',
  'annotation-validation.js',
  'data-management.js',
  'export-codec.js',
  'agent-setup-config.js',
  'content/modules/event-bus.js',
  'content/modules/styles.js',
  'content/modules/shadow-host.js',
  'content/modules/theme-manager.js',
  'background/variant-policy.js',
  'content/modules/api-bridge.js',
  'content/modules/shadow-dom-utils.js',
  'content/modules/source-identity.js',
  'content/modules/screenshot-capture.js',
  'content/modules/element-context.js',
  'content/modules/multi-target-selection.js',
  'content/modules/badge-manager.js',
  'content/modules/inspection-mode.js',
  'content/modules/keyboard-target.js',
  'content/modules/variant-picker.js',
  'content/modules/annotation-popover.js',
  'content/modules/queue-panel.js',
  'content/modules/floating-toolbar.js',
  'content/content.js',
];

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: PRODUCT_IDENTITY.productName,
    description: PRODUCT_IDENTITY.description,
    homepage_url: PRODUCT_IDENTITY.homepageUrl,
    permissions: ['activeTab', 'storage', 'scripting'],
    optional_host_permissions: ['*://*/*'],
    host_permissions: LOCAL_MATCHES,
    icons: {
      16: 'assets/icons/icon16.png',
      32: 'assets/icons/icon32.png',
      48: 'assets/icons/icon48.png',
      128: 'assets/icons/icon128.png',
    },
    action: {
      default_title: PRODUCT_IDENTITY.productName,
    },
    content_scripts: [
      {
        matches: LOCAL_MATCHES,
        js: CONTENT_MODULES,
      },
    ],
    commands: {
      'toggle-annotate': {
        suggested_key: {
          default: 'Ctrl+Shift+Comma',
          mac: 'Command+Shift+Comma',
        },
        description: 'Toggle annotation mode',
      },
    },
    background: {
      service_worker: 'background/background.js',
    },
    web_accessible_resources: [
      {
        resources: [
          'assets/fonts/InterVariable.woff2',
          'assets/thelu/thelu-settings-day-smooth.png',
          'assets/thelu/thelu-settings-night.png',
          'assets/thelu/thelu-waypoint-collapsed.png',
        ],
        matches: ['<all_urls>'],
      },
    ],
  },
});
