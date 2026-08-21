// Theme system for Logbook Waypoint Extension

class ThemeManager {
  constructor() {
    this.themes = {
      light: {
        surface: '#e9e1d3',
        'surface-1': '#f3ede3',
        'text-primary': '#211d19',
        'text-secondary': '#6f6258',
        outline: '#bbaa99',
        'outline-highlight': '#6f6258',
        accent: '#102c2c',
        'on-accent': '#f4efde',
        highlight: '#3f8580',
        'surface-hover': '#102c2c12',
        'secondary-button-bg': '#102c2c0d',
        'textarea-bg': '#102c2c0d',
        warning: '#b8573c',
        'on-warning': '#f4efde',
        'warning-container': '#b8573c18',
        'on-warning-container': '#211d19'
      },
      dark: {
        surface: '#152827',
        'surface-1': '#24312e',
        'text-primary': '#f2eadc',
        'text-secondary': '#baa894',
        outline: '#665548',
        'outline-highlight': '#baa894',
        accent: '#0a2325',
        'on-accent': '#f4efde',
        highlight: '#69aaa4',
        'surface-hover': '#f4efde12',
        'secondary-button-bg': '#f4efde0d',
        'textarea-bg': '#f4efde0d',
        warning: '#d56a4d',
        'on-warning': '#071b1d',
        'warning-container': '#d56a4d1f',
        'on-warning-container': '#f2eadc'
      }
    };
    
    this.currentTheme = 'system';
    this.init();
  }

  async init() {
    await this.loadThemePreference();
    this.applyTheme();
    this.setupMediaQueryListener();
  }

  async loadThemePreference() {
    try {
      const result = await chrome.storage.local.get(['waypointThemePreference']);
      this.currentTheme = result.waypointThemePreference || 'system';
    } catch (error) {
      console.error('Error loading theme preference:', error);
      this.currentTheme = 'system';
    }
  }

  async saveThemePreference(theme) {
    try {
      await chrome.storage.local.set({ waypointThemePreference: theme });
      this.currentTheme = theme;
      this.applyTheme();
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  getEffectiveTheme() {
    if (this.currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  applyTheme() {
    const effectiveTheme = this.getEffectiveTheme();
    const tokens = this.themes[effectiveTheme];
    
    // Apply CSS custom properties
    const root = document.documentElement;
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Set data attribute for theme-specific styles
    document.body.setAttribute('data-theme', effectiveTheme);
    document.documentElement.setAttribute('data-lfd-recipe', 'driftwood');
    document.documentElement.setAttribute('data-lfd-theme', effectiveTheme === 'dark' ? 'night' : 'day');
  }

  setupMediaQueryListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applyTheme();
      }
    });
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return ['system', 'light', 'dark'];
  }
}

// Export for use in popup.js
window.ThemeManager = ThemeManager;
