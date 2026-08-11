var WaypointSourceIdentityProbe = (() => {
  const TARGET_ID_PATTERN = /^[a-f0-9-]{36}$/i;

  async function run(targetId, sender) {
    const tabId = sender?.tab?.id;
    if (!Number.isInteger(tabId) || !TARGET_ID_PATTERN.test(targetId)) return null;

    const [{ result = null } = {}] = await chrome.scripting.executeScript({
      target: {
        tabId,
        frameIds: [sender.frameId ?? 0],
      },
      world: 'MAIN',
      func: readReactSourceIdentity,
      args: [targetId],
    });
    return result;
  }

  function readReactSourceIdentity(targetId) {
    const targets = document.querySelectorAll(`[data-waypoint-source-target="${targetId}"]`);
    if (targets.length !== 1) return null;
    const [target] = targets;

    let current = target;
    let elementDepth = 0;
    while (current && elementDepth < 10) {
      const fiberKey = Object.keys(current).find(key =>
        key.startsWith('__reactFiber') ||
        key.startsWith('__reactInternalInstance') ||
        key.startsWith('_reactInternalFiber')
      );
      if (fiberKey) {
        const result = readFiber(current[fiberKey]);
        if (result) return result;
      }
      current = current.parentElement;
      elementDepth += 1;
    }
    return null;

    function readFiber(startFiber) {
      let fiber = startFiber;
      let fiberDepth = 0;
      let componentName = null;

      while (fiber && fiberDepth < 20) {
        componentName ||= readComponentName(fiber);
        const source = fiber._debugSource || fiber._source ||
          fiber.elementType?._source || fiber.type?._source ||
          fiber._debugOwner?._debugSource || fiber._debugOwner?._source;
        if (source?.fileName) {
          const lineNumber = Number.isInteger(source.lineNumber) && source.lineNumber > 0
            ? source.lineNumber
            : null;
          return {
            component_name: componentName,
            file_path_hint: String(source.fileName),
            line_range_hint: lineNumber ? `${lineNumber}-${lineNumber}` : null,
          };
        }
        fiber = fiber.return || fiber._debugOwner;
        fiberDepth += 1;
      }

      return componentName ? {
        component_name: componentName,
        file_path_hint: null,
        line_range_hint: null,
      } : null;
    }

    function readComponentName(fiber) {
      const type = fiber.elementType || fiber.type;
      if (!type || typeof type === 'string') return null;
      if (typeof type === 'function') return type.displayName || type.name || null;
      if (typeof type === 'object') return type.displayName || type.render?.displayName || type.render?.name || null;
      return null;
    }
  }

  return { run };
})();
