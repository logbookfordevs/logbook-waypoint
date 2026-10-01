var WaypointJournalModel = (() => {
  const STORAGE_KEY = 'waypointJournals';
  const ignored = new Set(['sort', 'sortBy', 'sortOrder', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']);

  function scope(value) {
    try {
      const url = new URL(value);
      if (!['http:', 'https:', 'file:'].includes(url.protocol)) return null;
      for (const key of [...url.searchParams.keys()]) if (ignored.has(key)) url.searchParams.delete(key);
      url.searchParams.sort();
      if (!/^#!?\//.test(url.hash)) url.hash = '';
      return url.href;
    } catch { return null; }
  }

  function text(value, max, label) {
    if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} must contain 1–${max} characters.`);
    return value.trim();
  }

  function targets(value) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 8) throw new Error('Choose 1–8 Targets.');
    return value.map(target => ({
      selector: text(target.selector, 4000, 'Target'),
      element_context: {
        tag: typeof target.element_context?.tag === 'string' ? target.element_context.tag.slice(0, 100) : '',
        text: typeof target.element_context?.text === 'string' ? target.element_context.text.slice(0, 200) : '',
        classes: Array.isArray(target.element_context?.classes) ? target.element_context.classes.filter(c => typeof c === 'string').slice(0, 30) : [],
      },
    }));
  }

  function read(value) {
    if (value == null) return { version: 1, journals: [] };
    if (value.version !== 1 || !Array.isArray(value.journals)) throw new Error('Journal storage could not be read. Your saved data has not been changed.');
    return structuredClone(value);
  }

  function apply(value, command, { id, now }) {
    const state = read(value);
    if (command.type === 'clear-all') return { version: 1, journals: [] };
    if (command.type === 'create') {
      const key = scope(command.url);
      if (!key) throw new Error('This page URL is not supported.');
      const name = text(command.name, 80, 'Journal name');
      if (state.journals.some(j => j.scope === key && j.name === name)) throw new Error('A journal with that name already exists here.');
      state.journals.push({ id, name, scope: key, url: command.url, created_at: now, entries: [] });
      return state;
    }
    const journal = state.journals.find(j => j.id === command.journalId);
    if (!journal) throw new Error('This journal no longer exists.');
    if (command.type === 'delete-journal') {
      state.journals = state.journals.filter(j => j.id !== journal.id);
    } else if (command.type === 'clear') {
      journal.entries = [];
    } else if (command.type === 'save') {
      if (scope(command.url) !== journal.scope) throw new Error('Return to this journal’s page before saving.');
      const comment = text(command.comment, 20000, 'Note');
      const existing = journal.entries.find(e => e.id === command.entryId);
      if (command.entryId && !existing) throw new Error('This note no longer exists.');
      if (existing) {
        existing.comment = comment;
        existing.updated_at = now;
      } else {
        journal.entries.push({ id, url: command.url, comment, targets: targets(command.targets), seed: command.seed >>> 0, created_at: now, updated_at: now });
      }
    } else if (command.type === 'delete') {
      journal.entries = journal.entries.filter(e => e.id !== command.entryId);
    } else if (command.type === 'reattach') {
      if (scope(command.url) !== journal.scope) throw new Error('Return to this journal’s page before reattaching.');
      const entry = journal.entries.find(e => e.id === command.entryId);
      if (!entry) throw new Error('This note no longer exists.');
      const index = command.targetIndex;
      if (!Number.isInteger(index) || index < 0 || index >= entry.targets.length) throw new Error('Choose a Target to reattach.');
      entry.targets[index] = targets([command.target])[0];
      entry.updated_at = now;
    } else throw new Error('Unknown journal action.');
    return state;
  }

  return { STORAGE_KEY, scope, read, apply };
})();
