var WaypointJournal = (() => {
  let data = { version: 1, journals: [] };
  let mode = 'agent';
  let activeId = null;
  let root, toolbar, modeButton, visibilityButton, panel, note, drawing, cardsLayer, cardsDrawing;
  let cards = [];
  const notePositions = new Map();
  let dragging = null;
  const hiddenJournals = new Set();
  let selected = null, draft = null, reattach = null;
  let inlineEditor = false;
  let pins = [], frame = null, lastMatch = 0, revision = 0;
  let busy = false;
  let copying = false;
  let geometryKey = null;
  let storageError = null;
  let returnFocus = null;
  let lastURL = window.location.href;
  const selectedByScope = new Map();
  const ns = 'http://www.w3.org/2000/svg';

  function isActive() { return mode === 'journal'; }
  function journals() { return data.journals.filter(j => j.scope === WaypointJournalModel.scope(window.location.href)); }
  function current() { return journals().find(j => j.id === activeId); }
  function entries() { return current()?.entries || []; }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function button(text, action, className = '') {
    const node = element('button', `waypoint-journal-button ${className}`, text);
    node.type = 'button';
    node.addEventListener('click', event => { event.stopPropagation(); if (!busy) action(); });
    return node;
  }
  const icons = {
    edit: 'M12 20h9M16 3l5 5-12 12H4v-5Z',
    save: 'm5 12 4 4L19 6',
    delete: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    close: 'm6 6 12 12M6 18 18 6',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  };
  function iconButton(label, icon, action) {
    const control = button('', action, 'waypoint-journal-icon');
    control.setAttribute('aria-label', label); control.title = label;
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path'); path.setAttribute('d', icons[icon]);
    svg.appendChild(path); control.appendChild(svg);
    return control;
  }
  function toggleVisibility() {
    if (!closeNote()) return;
    if (hiddenJournals.has(activeId)) hiddenJournals.delete(activeId);
    else hiddenJournals.add(activeId);
    refresh();
    if (panel) openMenu();
  }
  function positionKey(entry) { return `${activeId}:${entry.id || `draft-${entry.seed}`}`; }
  function makeDraggable(card, entry) {
    card.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button, textarea, .waypoint-journal-copy')) return;
      if (!event.target.closest('.waypoint-journal-heading') && event.target !== card) return;
      const box = card.getBoundingClientRect();
      dragging = { key: positionKey(entry), card, pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: box.left, top: box.top };
      notePositions.set(dragging.key, { left: box.left, top: box.top });
      card.style.setProperty("--journal-left", `${box.left}px`); card.style.setProperty("--journal-top", `${box.top}px`);
      card.setPointerCapture(event.pointerId);
      card.classList.add('waypoint-journal-dragging', 'waypoint-journal-placed');
      event.preventDefault();
    });
    card.addEventListener('pointermove', event => {
      if (!dragging || dragging.card !== card || event.pointerId !== dragging.pointerId) return;
      const left = Math.max(8, Math.min(window.innerWidth - card.offsetWidth - 8, dragging.left + event.clientX - dragging.x));
      const top = Math.max(8, Math.min(window.innerHeight - card.offsetHeight - 8, dragging.top + event.clientY - dragging.y));
      notePositions.set(dragging.key, { left, top });
      card.style.left = `${left}px`; card.style.top = `${top}px`;
      card.style.setProperty("--journal-left", `${left}px`); card.style.setProperty("--journal-top", `${top}px`);
    });
    const finish = event => {
      if (!dragging || dragging.card !== card || event.pointerId !== dragging.pointerId) return;
      card.classList.remove('waypoint-journal-dragging');
      dragging = null;
      if (card.hasPointerCapture(event.pointerId)) card.releasePointerCapture(event.pointerId);
      layoutCards();
    };
    card.addEventListener('pointerup', finish);
    card.addEventListener('pointercancel', finish);
    card.addEventListener('lostpointercapture', finish);
  }
  function report(error, container = panel || note || root) {
    let message = container.querySelector('.waypoint-journal-error');
    if (!message) {
      message = element('p', 'waypoint-journal-error');
      message.setAttribute('role', 'alert');
      container.appendChild(message);
    }
    message.textContent = error.message || 'Could not save your journal. Try again.';
  }

  async function command(value) {
    const result = await chrome.runtime.sendMessage({ action: 'journalCommand', command: value });
    if (!result?.success) throw new Error(result?.error || 'Journal storage is unavailable. Please try again.');
    data = WaypointJournalModel.read(result.data);
    storageError = null;
    return result;
  }
  async function mutate(value, after, errorContainer) {
    if (busy) return;
    busy = true;
    try { await command(value); after?.(); refresh(); }
    catch (error) { report(error, errorContainer); }
    finally { busy = false; }
  }

  function chooseJournal() {
    const scope = WaypointJournalModel.scope(window.location.href);
    activeId = selectedByScope.get(scope) || activeId;
    if (!journals().some(j => j.id === activeId)) activeId = journals()[0]?.id || null;
    if (activeId) selectedByScope.set(scope, activeId);
  }

  function canDismiss() {
    const field = note?.querySelector('textarea');
    const original = draft?.comment || '';
    return !field || field.value === original || window.confirm('Discard unsaved journal changes?');
  }
  function closeNote(force = false) {
    if (!force && !canDismiss()) return false;
    revision++;
    const wasInline = inlineEditor;
    note?.remove(); note = null; inlineEditor = false;
    selected = null; draft = null;
    drawing?.replaceChildren(); geometryKey = null;
    returnFocus?.focus?.(); returnFocus = null;
    if (wasInline) refresh();
    return true;
  }
  function closePanel() {
    panel?.remove(); panel = null;
  }
  async function setMode(next) {
    if (busy || next === mode) return;
    if (!closeNote()) return;
    WaypointAnnotationPopover.dismiss();
    WaypointEvents.emit('inspection:stop');
    WaypointEvents.emit('multi-target:saved');
    WaypointQueuePanel.close();
    closePanel();
    reattach = null;
    mode = next;
    WaypointBadgeManager.clearAll();
    if (isActive()) chooseJournal();
    else WaypointAPI.loadAnnotations().then(items => {
      if (!isActive() && WaypointShadowHost.isVisible()) WaypointEvents.emit('annotations:render', items);
    });
    refresh();
    try { await chrome.storage.local.set({ waypointAnnotationMode: mode }); }
    catch (error) { openMenu(); report(error); }
  }

  function positionPanel() {
    if (!panel) return;
    const rect = toolbar.getBoundingClientRect();
    panel.style.width = `${Math.min(340, window.innerWidth - 24)}px`;
    panel.style.left = `${Math.max(12, Math.min(rect.right - panel.offsetWidth, window.innerWidth - panel.offsetWidth - 12))}px`;
    const below = rect.bottom + 8;
    panel.style.top = `${below + panel.offsetHeight < window.innerHeight - 12 ? below : Math.max(12, rect.top - panel.offsetHeight - 8)}px`;
  }
  function openMenu(all = false) {
    closePanel();
    panel = element('section', 'waypoint-journal-panel');
    panel.setAttribute('aria-label', all ? 'Journal storage' : 'Annotation mode and journals');
    panel.id = 'waypoint-journal-menu';
    const title = element('div', 'waypoint-journal-heading');
    title.append(element('strong', '', all ? 'Journal storage' : 'Journals'), button('Close', closePanel));
    panel.appendChild(title);
    if (!all) {
      panel.append(element('p', 'waypoint-journal-muted', 'Notes for you, saved on this device.'));
    }
    if (isActive() || all) {
      const list = all ? data.journals : journals();
      if (!all && list.length) {
        const label = element('label', '', 'Active journal');
        const select = element('select', 'waypoint-journal-select');
        for (const journal of list) {
          const option = element('option', '', journal.name);
          option.value = journal.id;
          select.appendChild(option);
        }
        select.value = activeId;
        select.addEventListener('change', () => {
          if (busy || !closeNote()) { select.value = activeId; return; }
          WaypointEvents.emit('inspection:stop'); reattach = null;
          activeId = select.value;
          selectedByScope.set(WaypointJournalModel.scope(window.location.href), activeId);
          refresh(); openMenu();
        });
        const selectWrap = element('span', 'waypoint-journal-select-wrap');
        selectWrap.appendChild(select); label.appendChild(selectWrap);
        const row = element('div', 'waypoint-journal-picker');
        const visibility = iconButton(hiddenJournals.has(activeId) ? 'Show journal' : 'Hide journal', 'eye', toggleVisibility);
        visibility.setAttribute('aria-pressed', String(!hiddenJournals.has(activeId)));
        row.append(label, visibility); panel.appendChild(row);
      }
      if (!all) {
        const form = element('form', 'waypoint-journal-create');
        const input = element('input');
        input.placeholder = 'Name a new journal'; input.maxLength = 80; input.required = true;
        input.setAttribute('aria-label', 'New journal name');
        const submit = element('button', 'waypoint-journal-button', 'Create'); submit.type = 'submit';
        form.append(input, submit);
        form.addEventListener('submit', event => {
          event.preventDefault();
          if (!closeNote()) return;
          mutate({ type: 'create', name: input.value, url: window.location.href }, () => {
            activeId = journals().at(-1)?.id;
            selectedByScope.set(WaypointJournalModel.scope(window.location.href), activeId);
            openMenu();
          });
        });
        form.id = 'waypoint-journal-create-form';
        form.hidden = list.length > 0;
        const reveal = button('New journal', () => {
          form.hidden = !form.hidden;
          reveal.setAttribute('aria-expanded', String(!form.hidden));
          positionPanel();
          if (!form.hidden) input.focus();
        }, 'waypoint-journal-text-action');
        reveal.setAttribute('aria-expanded', String(!form.hidden));
        reveal.setAttribute('aria-controls', form.id);
        panel.append(reveal, form);
        if (current()) {
          const count = entries().length;
          panel.appendChild(element('p', 'waypoint-journal-count waypoint-journal-muted', `${count} ${count === 1 ? 'note' : 'notes'}`));
        }
      }
      const notesList = element('div', 'waypoint-journal-list');
      notesList.setAttribute('aria-label', all ? 'Saved journals' : 'Journal notes');
      panel.appendChild(notesList);
      for (const journal of all ? list : list.filter(j => j.id === activeId)) {
        if (all) {
          const group = element('div', 'waypoint-journal-storage-row');
          group.append(element('strong', '', journal.name), element('p', 'waypoint-journal-muted', journal.url));
          group.append(button(`Delete journal (${journal.entries.length} notes)`, () => {
            if (window.confirm(`Permanently delete “${journal.name}” and all its notes?`)) mutate({ type: 'delete-journal', journalId: journal.id }, () => { chooseJournal(); openMenu(true); });
          }));
          notesList.appendChild(group); continue;
        }
        if (!journal.entries.length) {
          const empty = element('div', 'waypoint-journal-empty');
          empty.append(element('strong', '', 'Your page, your notes.'), element('p', 'waypoint-journal-muted', 'Select the pen, then pick something on the page.'));
          panel.appendChild(empty);
        }
        journal.entries.forEach(entry => {
          const row = element('div', 'waypoint-journal-entry');
          row.appendChild(button(entry.comment.slice(0, 120), () => { closePanel(); openNote(entry); }));
          entry.targets.forEach((target, index) => {
            if (resolve(target)) return;
            row.append(element('span', 'waypoint-journal-muted', `Target ${index + 1} is missing`), button('Reattach', () => {
              if (!closeNote()) return;
              reattach = { entryId: entry.id, targetIndex: index, journalId: journal.id };
              closePanel(); WaypointEvents.emit('inspection:start');
            }));
          });
          row.appendChild(iconButton('Delete note', 'delete', () => deleteEntry(entry)));
          notesList.appendChild(row);
        });
      }
      if (!all) {
        const footer = element('div', 'waypoint-journal-footer');
        footer.appendChild(button('Journal storage', () => { closePanel(); WaypointToolbar.openDataStorage('journal'); }, 'waypoint-journal-storage-action'));
        panel.appendChild(footer);
      }
      if (all && !list.length) panel.appendChild(element('p', 'waypoint-journal-muted', 'No saved journals.'));
    }
    root.appendChild(panel);
    if (storageError) report(storageError, panel);
    positionPanel();
  }

  function renderStorage(container) {
    container.replaceChildren();
    const count = data.journals.reduce((total, journal) => total + journal.entries.length, 0);
    container.append(element('p', 'waypoint-journal-muted', `${data.journals.length} ${data.journals.length === 1 ? 'journal' : 'journals'} · ${count} ${count === 1 ? 'note' : 'notes'} saved on this device`));
    if (!data.journals.length) container.append(element('p', 'waypoint-data-storage-empty', 'No stored journals.'));
    for (const journal of data.journals) {
      const row = element('section', 'waypoint-data-storage-project');
      row.append(element('strong', '', journal.name), element('p', 'waypoint-journal-muted', journal.url), element('p', '', `${journal.entries.length} notes`));
      row.append(button('Delete journal', () => {
        if (!window.confirm(`Permanently delete “${journal.name}” and all its notes?`)) return;
        mutate({ type: 'delete-journal', journalId: journal.id }, () => { chooseJournal(); renderStorage(container); }, container);
      }));
      container.appendChild(row);
    }
    if (data.journals.length) {
      const clearAll = button('Clear all Journal data', async () => {
        const message = `Permanently delete all ${data.journals.length} journals and ${count} notes saved on this device? Agent data will not be deleted.`;
        if (!window.confirm(message)) return;
        clearAll.disabled = true;
        await mutate({ type: 'clear-all' }, () => {
          closeNote(true);
          activeId = null;
          selectedByScope.clear();
          hiddenJournals.clear();
          notePositions.clear();
          closePanel();
          renderStorage(container);
        }, container);
        clearAll.disabled = false;
      }, 'waypoint-data-delete-all');
      container.appendChild(clearAll);
    }
  }

  function resolve(target) {
    try { return WaypointElementContext.findElementBySelector(target); }
    catch { return null; }
  }
  function refresh() {
    chooseJournal();
    for (const pin of pins) pin.button.remove();
    pins = [];
    cards = []; cardsLayer?.replaceChildren(); cardsDrawing?.replaceChildren();
    if (cardsDrawing) cardsDrawing.dataset.geometry = '';
    const shown = isActive() && WaypointShadowHost.isVisible() && !hiddenJournals.has(activeId);
    if (visibilityButton) {
      visibilityButton.hidden = !isActive();
      visibilityButton.disabled = !current();
      const label = hiddenJournals.has(activeId) ? 'Show journal' : 'Hide journal';
      visibilityButton.setAttribute('aria-label', label); visibilityButton.title = label;
      visibilityButton.setAttribute('aria-pressed', String(shown));
    }
    if (shown) {
      entries().forEach((entry, index) => {
        if (inlineEditor && draft?.entryId === entry.id) {
          cardsLayer.appendChild(note); cards.push({ entry, node: note }); return;
        }
        const card = element('section', 'waypoint-journal-note waypoint-journal-saved');
        card.setAttribute('aria-label', `Note ${index + 1}`); card.tabIndex = -1;
        const heading = element('div', 'waypoint-journal-heading');
        const actions = element('div', 'waypoint-journal-tools');
        actions.append(iconButton('Delete note', 'delete', () => deleteEntry(entry)), iconButton('Hide journal', 'close', toggleVisibility));
        heading.append(element('span', 'waypoint-journal-muted', String(index + 1)), actions);
        const copy = element('p', 'waypoint-journal-copy', entry.comment);
        copy.tabIndex = 0; copy.setAttribute('role', 'button');
        copy.setAttribute('aria-label', `Edit note: ${entry.comment}`);
        copy.title = 'Double-click to edit';
        copy.addEventListener('dblclick', () => { if (!busy) editNote(entry, entry.targets); });
        copy.addEventListener('keydown', event => {
          if ((event.key === 'Enter' || event.key === ' ') && !busy) { event.preventDefault(); editNote(entry, entry.targets); }
        });
        card.append(heading, copy);
        makeDraggable(card, entry);
        cardsLayer.appendChild(card); cards.push({ entry, node: card });
      });
      entries().forEach((entry, index) => entry.targets.forEach((target, targetIndex) => {
        const pin = button(entry.targets.length > 1 ? `${index + 1}${String.fromCharCode(97 + targetIndex)}` : String(index + 1), () => openNote(entry, targetIndex), 'waypoint-journal-pin');
        pin.setAttribute('aria-label', `Open note ${index + 1}: ${entry.comment.slice(0, 80)}`);
        root.appendChild(pin);
        pins.push({ button: pin, entry, target, targetIndex, element: resolve(target) });
      }));
    }
    if (shown && inlineEditor && !draft?.entryId && note) {
      cardsLayer.appendChild(note); cards.push({ entry: selected.entry, node: note });
    }
    modeButton?.querySelectorAll('button').forEach(control => {
      control.setAttribute('aria-pressed', String(control.dataset.mode === mode));
    });
    WaypointEvents.emit('journal:changed');
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function makeNote() {
    note = element('section', 'waypoint-journal-note');
    note.setAttribute('role', 'dialog'); note.setAttribute('aria-label', 'Journal note');
    const heading = element('div', 'waypoint-journal-heading');
    heading.append(element('span', 'waypoint-journal-muted', current()?.name || 'Journal'), iconButton('Close editor', 'close', () => closeNote()));
    note.appendChild(heading); root.appendChild(note);
  }
  function openNote(entry, targetIndex = 0) {
    if (!closeNote()) return;
    closePanel();
    hiddenJournals.delete(activeId); refresh();
    const card = cards.find(item => item.entry.id === entry.id);
    const target = resolve(entry.targets[targetIndex]);
    if (!target) { editNote(entry, entry.targets); return; }
    target.scrollIntoView?.({ block: 'center', behavior: 'instant' });
    layoutCards();
    card?.node.focus();
    if (cardsLayer.classList.contains('waypoint-journal-rail')) card?.node.scrollIntoView?.({ block: 'nearest' });
  }
  function deleteEntry(entry) {
    if (window.confirm('Permanently delete this journal note?')) mutate({ type: 'delete', journalId: activeId, entryId: entry.id }, () => { closeNote(true); if (panel) openMenu(); });
  }
  function editNote(entry, targets) {
    if (!closeNote()) return;
    const existingCard = entry && cards.find(card => card.entry.id === entry.id)?.node;
    draft = { entryId: entry?.id, comment: entry?.comment || '', targets, url: window.location.href, journalId: activeId };
    selected = { entry: entry || { targets, comment: '', seed: Math.floor(Math.random() * 1000000) }, targetIndex: 0 };
    inlineEditor = !entry || Boolean(existingCard && !existingCard.hidden);
    if (inlineEditor && existingCard) {
      note = existingCard;
      note.classList.add('waypoint-journal-editing');
      note.querySelector('.waypoint-journal-copy').remove();
    } else if (inlineEditor) {
      note = element('section', 'waypoint-journal-note waypoint-journal-saved waypoint-journal-editing');
      note.setAttribute('aria-label', 'New journal note');
      const heading = element('div', 'waypoint-journal-heading');
      heading.append(element('span', 'waypoint-journal-muted', String(entries().length + 1)), element('div', 'waypoint-journal-tools'));
      note.appendChild(heading); cardsLayer.appendChild(note);
      makeDraggable(note, selected.entry);
    } else makeNote();
    const textarea = element('textarea', 'waypoint-journal-input');
    textarea.setAttribute('aria-label', 'Your note');
    textarea.placeholder = 'Write a note…';
    textarea.value = draft.comment; textarea.maxLength = 20000; textarea.rows = inlineEditor ? 1 : 5;
    note.appendChild(textarea);
    const save = () => {
      if (!textarea.value.trim()) { textarea.setCustomValidity('Write a note first.'); textarea.reportValidity(); return; }
      mutate({ type: 'save', ...draft, comment: textarea.value, seed: selected.entry.seed }, () => {
        closeNote(true); WaypointEvents.emit('multi-target:saved'); WaypointEvents.emit('inspection:stop');
      });
    };
    if (inlineEditor) {
      note.querySelector('.waypoint-journal-tools').replaceChildren(
        iconButton('Save note', 'save', save),
        ...(entry ? [iconButton('Delete note', 'delete', () => deleteEntry(entry))] : []),
        iconButton('Close editor', 'close', () => closeNote()),
      );
    } else note.appendChild(button('Save note', save, 'waypoint-journal-save'));
    const sizeInput = () => {
      textarea.setCustomValidity('');
      if (inlineEditor) { textarea.style.height = 'auto'; textarea.style.height = `${textarea.scrollHeight}px`; }
    };
    textarea.addEventListener('input', sizeInput);
    textarea.addEventListener('keydown', event => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); save(); }
    });
    hiddenJournals.delete(activeId);
    if (!inlineEditor || !entry) { refresh(); positionNote(); }
    sizeInput(); layoutCards(); textarea.focus();
  }

  function targetFrom(context) {
    return { selector: context.selector, element_context: { tag: context.tag, text: context.text, classes: context.classes } };
  }
  async function capture({ element: target, shiftKey = false }) {
    if (!isActive() || WaypointMultiTargetSelection.shouldHandle(shiftKey)) return;
    const action = reattach;
    WaypointEvents.emit('inspection:stop');
    if (!current()) { openMenu(); return; }
    const session = revision, url = window.location.href, journalId = activeId;
    try {
      const context = await WaypointElementContext.generate(target);
      if (!isActive() || revision !== session || window.location.href !== url || activeId !== journalId) return;
      if (action) {
        await mutate({ type: 'reattach', ...action, target: targetFrom(context), url }, () => { reattach = null; WaypointEvents.emit('inspection:stop'); openMenu(); });
      } else { WaypointEvents.emit('inspection:stop'); editNote(null, [targetFrom(context)]); }
    } catch (error) { openMenu(); report(error); }
  }

  function visibleTarget(target, rect) {
    if (!rect || rect.width <= 0 || rect.height <= 0 || rect.bottom < 0 || rect.top >= window.innerHeight || rect.right < 0 || rect.left >= window.innerWidth) return false;
    for (let parent = target?.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const style = window.getComputedStyle(parent);
      if (!/(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`)) continue;
      const clip = parent.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY) && (rect.bottom <= clip.top || rect.top >= clip.bottom)) return false;
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX) && (rect.right <= clip.left || rect.left >= clip.right)) return false;
    }
    return true;
  }

  function positionNote() {
    if (!note || inlineEditor) return;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const matchedPin = selected && pins.find(p => p.entry.id === selected.entry.id && p.targetIndex === selected.targetIndex);
    const target = matchedPin ? matchedPin.element : selected && resolve(selected.entry.targets[selected.targetIndex]);
    const rect = WaypointJournalGeometry.targetBounds(target);
    const w = Math.min(310, viewport.width - 24);
    note.style.width = `${w}px`;
    const rightFits = rect && rect.right + 50 + w < viewport.width - 12;
    const leftFits = rect && rect.left - 50 - w >= 12;
    const left = rightFits ? rect.right + 50 : leftFits ? rect.left - w - 50 : viewport.width - w - 12;
    const top = rect ? (rightFits || leftFits ? rect.top + 30 : rect.bottom + 35) : 100;
    note.style.left = `${Math.max(12, left)}px`;
    note.style.top = `${Math.max(12, Math.min(top, viewport.height - note.offsetHeight - 12))}px`;
    const box = note.getBoundingClientRect();
    const visible = visibleTarget(target, rect);
    const nextGeometry = JSON.stringify([visible, rect?.x, rect?.y, rect?.width, rect?.height, box.x, box.y, box.width, box.height, viewport, selected?.entry.seed]);
    if (geometryKey === nextGeometry) return;
    geometryKey = nextGeometry;
    drawing.replaceChildren();
    if (!visible) return;
    drawing.setAttribute('viewBox', `0 0 ${viewport.width} ${viewport.height}`);
    addPath(WaypointJournalGeometry.outline(rect, selected.entry.seed));
    if (box.left >= rect.right || box.right <= rect.left || box.top >= rect.bottom || box.bottom <= rect.top) addPath(WaypointJournalGeometry.arrow(box, rect, selected.entry.seed, viewport));
  }
  function addPath(d) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d); drawing.appendChild(path);
  }
  function tick(time) {
    frame = null;
    if (!isActive() || !WaypointShadowHost.isVisible()) return;
    const rematch = time - lastMatch > 700;
    if (rematch) lastMatch = time;
    for (const pin of pins) {
      if (rematch || !pin.element?.isConnected) pin.element = resolve(pin.target);
      const rect = WaypointJournalGeometry.targetBounds(pin.element);
      const visible = visibleTarget(pin.element, rect);
      pin.button.hidden = !visible;
      if (visible) {
        pin.button.style.left = `${Math.max(4, Math.min(rect.right - 8, window.innerWidth - 32))}px`;
        pin.button.style.top = `${Math.max(4, rect.top - 32)}px`;
      }
    }
    positionNote();
    layoutCards();
    frame = requestAnimationFrame(tick);
  }

  function layoutCards() {
    if (!cardsLayer) return;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const visibleCards = [];
    const frozen = inlineEditor && Boolean(draft?.entryId);
    const editingInRail = frozen && cardsLayer.classList.contains('waypoint-journal-rail');
    if (!frozen) cardsLayer.classList.remove('waypoint-journal-rail');
    for (const card of cards) {
      const targets = card.entry.targets.map(resolve).filter(Boolean).map(target => ({ target, rect: WaypointJournalGeometry.targetBounds(target) })).filter(({ target, rect }) => visibleTarget(target, rect));
      card.node.hidden = !targets.length;
      if (card.node.hidden) continue;
      card.targets = targets;
      if (!frozen) card.node.style.width = `${Math.min(viewport.width - 24, Math.max(200, Math.min(280, 180 + card.entry.comment.length * .4)))}px`;
      const manual = notePositions.get(positionKey(card.entry));
      card.node.classList.toggle('waypoint-journal-placed', Boolean(manual));
      if (manual) {
        card.node.style.left = `${Math.max(8, Math.min(manual.left, viewport.width - card.node.offsetWidth - 8))}px`;
        card.node.style.top = `${Math.max(8, Math.min(manual.top, viewport.height - card.node.offsetHeight - 8))}px`;
      }
      if (manual) { card.node.style.setProperty("--journal-left", card.node.style.left); card.node.style.setProperty("--journal-top", card.node.style.top); }
      visibleCards.push(card);
    }
    const placed = visibleCards.filter(card => notePositions.has(positionKey(card.entry))).map(card => card.node.getBoundingClientRect());
    let rail = frozen ? editingInRail : viewport.width < 600;
    const overlaps = (a, b) => a.left < b.right + 16 && a.right + 16 > b.left && a.top < b.bottom + 16 && a.bottom + 16 > b.top;
    const reserved = [toolbar?.getBoundingClientRect(), !inlineEditor && note?.getBoundingClientRect()].filter(Boolean);
    for (const card of frozen ? [] : visibleCards) {
      if (notePositions.has(positionKey(card.entry)) || dragging?.card === card.node) continue;
      const target = card.targets[0].rect, w = card.node.offsetWidth, h = card.node.offsetHeight;
      const candidates = [
        [target.right + 40, target.top], [target.left - w - 40, target.top],
        [target.left, target.bottom + 40], [target.left, target.top - h - 40],
        [viewport.width - w - 16, target.bottom + 24], [16, target.bottom + 24],
      ];
      let chosen;
      for (const [left, top] of candidates) {
        const box = { left, top, right: left + w, bottom: top + h };
        if (left < 12 || top < 12 || box.right > viewport.width - 12 || box.bottom > viewport.height - 12) continue;
        if ([...placed, ...reserved, ...visibleCards.flatMap(c => c.targets.map(t => t.rect))].some(other => overlaps(box, other))) continue;
        chosen = box; break;
      }
      if (!chosen) { rail = true; break; }
      card.node.style.left = `${chosen.left}px`; card.node.style.top = `${chosen.top}px`;
      placed.push(chosen);
    }
    cardsLayer.classList.toggle('waypoint-journal-rail', rail);
    if (rail) {
      const toolbarBox = toolbar?.getBoundingClientRect();
      const top = toolbarBox && toolbarBox.top < viewport.height / 2 ? toolbarBox.bottom + 16 : 16;
      const bottom = toolbarBox && toolbarBox.top >= viewport.height / 2 ? viewport.height - toolbarBox.top + 16 : 16;
      cardsLayer.style.top = `${top}px`; cardsLayer.style.bottom = `${bottom}px`;
    }
    const paths = [];
    const clip = rail ? cardsLayer.getBoundingClientRect() : null;
    for (const card of visibleCards) {
      if (dragging?.card === card.node) continue;
      const box = card.node.getBoundingClientRect();
      if (clip && !notePositions.has(positionKey(card.entry)) && (box.top < clip.top || box.bottom > clip.bottom)) continue;
      for (const { rect } of card.targets) {
        paths.push(WaypointJournalGeometry.outline(rect, card.entry.seed));
        if (box.left >= rect.right || box.right <= rect.left || box.top >= rect.bottom || box.bottom <= rect.top) paths.push(WaypointJournalGeometry.arrow(box, rect, card.entry.seed, viewport));
      }
    }
    const key = JSON.stringify([viewport, paths]);
    if (cardsDrawing.dataset.geometry === key) return;
    cardsDrawing.dataset.geometry = key;
    cardsDrawing.setAttribute('viewBox', `0 0 ${viewport.width} ${viewport.height}`);
    cardsDrawing.replaceChildren();
    for (const d of paths) {
      const path = document.createElementNS(ns, 'path'); path.setAttribute('d', d); cardsDrawing.appendChild(path);
    }
  }

  async function clear() {
    if (!current()) return;
    const skip = await WaypointAPI.getSkipDeleteConfirm();
    if (skip || window.confirm(`Permanently delete all notes in “${current().name}”?`)) await mutate({ type: 'clear', journalId: activeId }, () => closeNote(true));
  }
  function prepareCopySound() {
    let audio, played = false;
    try {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (Audio) {
        audio = new Audio();
        audio.resume().catch(() => {});
      }
    } catch {}
    const close = () => { audio?.close().catch(() => {}); };
    return {
      play() {
        if (!audio || audio.state !== 'running') return;
        try {
          const buffer = audio.createBuffer(1, Math.round(audio.sampleRate * .09), audio.sampleRate);
          const samples = buffer.getChannelData(0);
          for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
          const source = audio.createBufferSource();
          source.buffer = buffer;
          const filter = audio.createBiquadFilter();
          filter.type = 'highpass'; filter.frequency.value = 1000;
          const gain = audio.createGain();
          const now = audio.currentTime;
          gain.gain.setValueAtTime(.035, now);
          gain.gain.exponentialRampToValueAtTime(.001, now + .025);
          gain.gain.setValueAtTime(.05, now + .045);
          gain.gain.exponentialRampToValueAtTime(.001, now + .09);
          source.connect(filter).connect(gain).connect(audio.destination);
          source.start(); played = true;
        } catch {}
      },
      dispose() { if (played) setTimeout(close, 150); else close(); },
    };
  }
  async function copy() {
    if (copying) return false;
    copying = true;
    let image;
    let sound;
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('Image copying is unavailable on this page. Try a secure HTTPS page or localhost.');
      }
      sound = prepareCopySound();
      image = (async () => {
        root.host.setAttribute('data-waypoint-journal-capture', '');
        try {
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const result = await chrome.runtime.sendMessage({ action: 'captureVisibleTabScreenshot' });
          if (!result?.success || !result.dataUrl?.startsWith('data:image/png;base64,')) {
            if (/activeTab|<all_urls>/.test(result?.error || '')) {
              throw new Error('Click the Waypoint icon in your browser toolbar to enable screenshots for this tab, then try again.');
            }
            throw new Error(result?.error || 'Could not capture this view. Try again.');
          }
          const bytes = Uint8Array.from(atob(result.dataUrl.split(',')[1]), char => char.charCodeAt(0));
          return new Blob([bytes], { type: 'image/png' });
        } finally {
          root.host.removeAttribute('data-waypoint-journal-capture');
        }
      })();
      image.catch(() => {});
      // Start the clipboard write in the button's user gesture while capture completes.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': image })]);
      await image;
      sound.play();
      return true;
    } catch (error) {
      await image?.catch(() => {});
      const message = error.name === 'NotAllowedError'
        ? new Error('Could not copy the image. Allow clipboard access for this page, then try again.')
        : error;
      openMenu(); report(message);
      return false;
    } finally {
      sound?.dispose();
      copying = false;
    }
  }
  function attachToolbar(value) {
    toolbar = value;
    modeButton = element('div', 'waypoint-journal-mode-switch');
    modeButton.setAttribute('role', 'group');
    modeButton.setAttribute('aria-label', 'Annotation mode');
    for (const [value, label] of [['agent', 'Agent'], ['journal', 'Journal']]) {
      const control = button(label, () => setMode(value), 'waypoint-journal-mode');
      control.dataset.mode = value;
      modeButton.appendChild(control);
    }
    visibilityButton = iconButton('Hide journal', 'eye', toggleVisibility);
    toolbar.querySelector('.waypoint-tb-annotate').before(modeButton, visibilityButton);
    refresh();
  }

  async function init() {
    root = WaypointShadowHost.getRoot();
    cardsLayer = element('div', 'waypoint-journal-cards'); root.appendChild(cardsLayer);
    cardsDrawing = document.createElementNS(ns, 'svg'); cardsDrawing.classList.add('waypoint-journal-drawing'); cardsDrawing.setAttribute('aria-hidden', 'true'); root.appendChild(cardsDrawing);
    drawing = document.createElementNS(ns, 'svg');
    drawing.classList.add('waypoint-journal-drawing'); drawing.setAttribute('aria-hidden', 'true'); root.appendChild(drawing);
    try {
      const stored = await chrome.storage.local.get([WaypointJournalModel.STORAGE_KEY, 'waypointAnnotationMode']);
      data = WaypointJournalModel.read(stored[WaypointJournalModel.STORAGE_KEY]);
      mode = stored.waypointAnnotationMode === 'journal' ? 'journal' : 'agent';
    } catch (error) { storageError = error; }
    chooseJournal();
    WaypointEvents.on('inspection:elementClicked', capture);
    WaypointEvents.on('multi-target:compose', ({ selections }) => {
      if (!isActive()) return;
      WaypointInspectionMode.tempDisable();
      if (!current()) { openMenu(); return; }
      const targets = selections.map(s => targetFrom(s.context));
      WaypointEvents.emit('inspection:stop');
      editNote(null, targets);
    });
    WaypointEvents.on('inspection:started', () => {
      if (!isActive()) return;
      closePanel();
      if (!closeNote()) { WaypointEvents.emit('inspection:stop'); return; }
      if (!current()) {
        WaypointEvents.emit('inspection:stop');
        if (busy) return;
        const url = window.location.href;
        const names = ['Brain crumbs', 'Tiny revelations', 'Notes from the margins', 'Aha, there it is!', 'Curious little things'];
        mutate({ type: 'create', name: names[Math.floor(Math.random() * names.length)], url }, () => {
          if (!isActive() || window.location.href !== url) return;
          chooseJournal();
          WaypointEvents.emit('inspection:start');
        });
      }
    });
    WaypointEvents.on('inspection:stopped', () => { reattach = null; });
    WaypointEvents.on('overlay:closed', () => { closeNote(true); closePanel(); refresh(); });
    WaypointEvents.on('overlay:opened', refresh);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes[WaypointJournalModel.STORAGE_KEY]) return;
      try {
        data = WaypointJournalModel.read(changes[WaypointJournalModel.STORAGE_KEY].newValue);
        if (selected?.entry.id && !draft) {
          const fresh = entries().find(e => e.id === selected.entry.id);
          if (!fresh) closeNote(true);
          else { selected.entry = fresh; const copy = note?.querySelector('.waypoint-journal-copy'); if (copy) copy.textContent = fresh.comment; }
        }
        refresh();
      } catch (error) { if (panel || note) report(error); }
    });
    document.addEventListener('pointerdown', event => {
      if (event.composedPath().includes(root.host) || WaypointInspectionMode.isActive()) return;
      closePanel(); closeNote();
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isActive()) { closePanel(); closeNote(); }
    });
    window.addEventListener('resize', positionPanel);
    setInterval(() => {
      if (lastURL === window.location.href) return;
      lastURL = window.location.href; revision++;
      closeNote(true); closePanel(); reattach = null;
      chooseJournal(); refresh();
    }, 300);
    refresh();
  }
  return { init, isActive, attachToolbar, count: () => entries().length, renderStorage, openMenu, closePanel, clear, copy };
})();
