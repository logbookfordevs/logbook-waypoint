// Applies --waypoint-* theme tokens on the shadow host
// Reads preference from chrome.storage, listens for system + storage changes

var WaypointThemeManager = (() => {
  const themes = {
    light: {
      'waypoint-surface': '#e9e1d3',
      'waypoint-surface-1': '#f3ede3',
      'waypoint-text-primary': '#211d19',
      'waypoint-text-secondary': '#6f6258',
      'waypoint-outline': '#bbaa99',
      'waypoint-outline-highlight': '#6f6258',
      'waypoint-accent': '#102c2c',
      'waypoint-on-accent': '#f4efde',
      'waypoint-surface-hover': '#102c2c12',
      'waypoint-secondary-btn-bg': '#102c2c0d',
      'waypoint-textarea-bg': '#102c2c0d',
      'waypoint-warning': '#b8573c',
      'waypoint-on-warning': '#f4efde',
      'waypoint-warning-container': '#b8573c18',
      'waypoint-on-warning-container': '#211d19',
      'waypoint-danger': '#a63d32',
      'waypoint-danger-hover': '#a63d3214',
      'waypoint-highlight': '#3f8580',
      'waypoint-badge-bg': '#173f5f',
      'waypoint-tooltip-bg': '#102c2c'
    },
    dark: {
      'waypoint-surface': '#152827',
      'waypoint-surface-1': '#24312e',
      'waypoint-text-primary': '#f2eadc',
      'waypoint-text-secondary': '#baa894',
      'waypoint-outline': '#665548',
      'waypoint-outline-highlight': '#baa894',
      'waypoint-accent': '#0a2325',
      'waypoint-on-accent': '#f4efde',
      'waypoint-surface-hover': '#f4efde12',
      'waypoint-secondary-btn-bg': '#f4efde0d',
      'waypoint-textarea-bg': '#f4efde0d',
      'waypoint-warning': '#d56a4d',
      'waypoint-on-warning': '#071b1d',
      'waypoint-warning-container': '#d56a4d1f',
      'waypoint-on-warning-container': '#f2eadc',
      'waypoint-danger': '#f08a73',
      'waypoint-danger-hover': '#f08a731a',
      'waypoint-highlight': '#69aaa4',
      'waypoint-badge-bg': '#1b4668',
      'waypoint-tooltip-bg': '#071b1d'
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
    host.setAttribute('data-lfd-recipe', 'driftwood');
    host.setAttribute('data-lfd-theme', getEffective() === 'dark' ? 'night' : 'day');
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
