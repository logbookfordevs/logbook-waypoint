var VibeKeyboardTarget = (() => {
  function isEditableNode(node) {
    return !!node?.matches && (
      node.matches('input, textarea, select, [contenteditable], [role="textbox"]')
      || node.isContentEditable
    );
  }

  function isEditableEvent(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
    return path.some(isEditableNode);
  }

  return { isEditableEvent };
})();
