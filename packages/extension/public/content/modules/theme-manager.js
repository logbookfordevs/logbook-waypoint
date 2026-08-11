// Applies --waypoint-* theme tokens on the shadow host
// Reads preference from chrome.storage, listens for system + storage changes

var WaypointThemeManager = (() => {
  const themes = {
    light: {
      'waypoint-surface': '#f8f9fc',
      'waypoint-surface-1': '#fcfcfd',
      'waypoint-text-primary': '#0c111b',
      'waypoint-text-secondary': '#697586',
      'waypoint-outline': '#00000014',
      'waypoint-outline-highlight': '#00000028',
      'waypoint-accent': '#d97757',
      'waypoint-on-accent': '#ffffff',
      'waypoint-surface-hover': '#0d0f1c14',
      'waypoint-secondary-btn-bg': '#0000000d',
      'waypoint-textarea-bg': '#0000000d',
      'waypoint-warning': '#f79009',
      'waypoint-on-warning': '#ffffff',
      'waypoint-warning-container': '#f7900919',
      'waypoint-on-warning-container': '#93370c',
      'waypoint-danger': '#dc2626',
      'waypoint-danger-hover': '#dc26260d',
      'waypoint-highlight': '#2563eb',
      'waypoint-badge-bg': '#4b5563',
      'waypoint-tooltip-bg': '#111827'
    },
    dark: {
      'waypoint-surface': '#0C0E12',
      'waypoint-surface-1': '#191D24',
      'waypoint-text-primary': '#fcfcfd',
      'waypoint-text-secondary': '#9AA4B2',
      'waypoint-outline': '#ffffff0d',
      'waypoint-outline-highlight': '#ffffff26',
      'waypoint-accent': '#d97757',
      'waypoint-on-accent': '#ffffff',
      'waypoint-surface-hover': '#fcfcfd14',
      'waypoint-secondary-btn-bg': '#ffffff0d',
      'waypoint-textarea-bg': '#ffffff0d',
      'waypoint-warning': '#f79009',
      'waypoint-on-warning': '#ffffff',
      'waypoint-warning-container': '#f7900914',
      'waypoint-on-warning-container': '#f79009',
      'waypoint-danger': '#dc2626',
      'waypoint-danger-hover': '#dc26261a',
      'waypoint-highlight': '#3b82f6',
      'waypoint-badge-bg': '#6b7280',
      'waypoint-tooltip-bg': '#1f2937'
    }
  };

  let preference = 'system'; // 'system' | 'light' | 'dark'

  function getEffective() {
    if (preference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return preference;
  }

  function apply() {
    const root = WaypointShadowHost.getRoot();
    if (!root) return;

    const host = root.host;
    const tokens = themes[getEffective()];
    for (const [key, value] of Object.entries(tokens)) {
      host.style.setProperty(`--${key}`, value);
    }

    WaypointEvents.emit('theme:changed', getEffective());
  }

  async function init() {
    // Load preference
    try {
      const result = await chrome.storage.local.get(['waypointThemePreference']);
      preference = result.waypointThemePreference || 'system';
    } catch (e) {
      preference = 'system';
    }

    apply();

    // Listen for storage changes (user changes theme in popup)
    chrome.storage.onChanged.addListener((changes, ns) => {
      if (ns === 'local' && changes.waypointThemePreference) {
        preference = changes.waypointThemePreference.newValue || 'system';
        apply();
      }
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (preference === 'system') apply();
    });
  }

  function getPreference() {
    return preference;
  }

  async function setPreference(pref) {
    preference = pref;
    await chrome.storage.local.set({ waypointThemePreference: pref });
    apply();
  }

  return { init, apply, getEffective, getPreference, setPreference };
})();
