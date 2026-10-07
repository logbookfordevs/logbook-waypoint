var WaypointJournalGeometry = (() => {
  function outline(rect, seed) {
    const { left: x, top: y, width: w, height: h } = rect;
    const lean = (seed % 7) - 3;
    return `M ${x + w * .8} ${y - 5} C ${x + w + 15} ${y - 9 + lean} ${x + w + 22} ${y + h + 9} ${x + w * .48} ${y + h + 7} C ${x - 22} ${y + h + 10} ${x - 20} ${y - 14} ${x + w * .48} ${y - 7} Q ${x + w * .7} ${y - 12} ${x + w * .87} ${y + 2}`;
  }

  function arrow(note, target, seed, viewport) {
    const right = note.left >= target.right;
    const direction = right ? -1 : 1;
    let ex = right ? target.right + 10 : target.left - 10;
    let ey = target.top + target.height * (.35 + (seed % 3) * .12);
    const edgeX = right ? note.left - 7 : note.right + 7;
    const gap = Math.abs(edgeX - ex);
    const bend = Math.min(90, Math.max(30, gap * .65));
    const variant = seed % 3;
    let sx = edgeX, sy = note.top + note.height * .42;
    let c1x = sx + direction * bend, c1y = sy + 24;
    let c2x = ex - direction * bend, c2y = ey - 35;
    if (variant === 1 && note.top > 70) {
      sx = note.left + note.width * .45;
      sy = note.top - 8;
      c1x = sx + direction * 20;
      c1y = sy - 60;
      c2y = Math.max(12, ey - 65);
    } else if (variant === 2 && note.bottom + 65 < viewport.height) {
      sx = note.left + note.width * .4;
      sy = note.bottom + 8;
      c1x = sx + direction * 30;
      c1y = sy + 50;
      c2y = Math.min(viewport.height - 12, ey + 65);
    }
    if (note.left < target.right && note.right > target.left) {
      const below = note.top >= target.bottom;
      sx = note.left + note.width * .72;
      sy = below ? note.top - 8 : note.bottom + 8;
      ex = target.left + target.width * .75;
      ey = below ? target.bottom + 8 : target.top - 8;
      c1x = Math.min(viewport.width - 12, sx + 45);
      c1y = sy + (below ? -35 : 35);
      c2x = Math.min(viewport.width - 12, ex + 45);
      c2y = ey + (below ? 35 : -35);
    }
    const angle = Math.atan2(ey - c2y, ex - c2x);
    const ux = Math.cos(angle), uy = Math.sin(angle);
    const a = [ex - 14 * ux - 6 * uy, ey - 14 * uy + 6 * ux];
    const b = [ex - 12 * ux + 7 * uy, ey - 12 * uy - 7 * ux];
    return `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey} M ${a[0]} ${a[1]} Q ${ex - 4 * ux} ${ey - 4 * uy} ${ex} ${ey} L ${b[0]} ${b[1]}`;
  }

  function targetBounds(target) {
    if (!target) return null;
    const box = target.getBoundingClientRect();
    if (!/^(H[1-6]|P|SPAN|LABEL|A|STRONG|EM|SMALL|B|I|CODE)$/.test(target.tagName) || !target.textContent?.trim()) return box;
    if (target.querySelector('svg, img, input, button, video, canvas, iframe')) return box;
    try {
      const range = target.ownerDocument.createRange();
      range.selectNodeContents(target);
      const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
      if (!rects.length) return box;
      const left = Math.min(...rects.map(rect => rect.left));
      const top = Math.min(...rects.map(rect => rect.top));
      const right = Math.max(...rects.map(rect => rect.right));
      const bottom = Math.max(...rects.map(rect => rect.bottom));
      return { x: left, y: top, left, top, right, bottom, width: right - left, height: bottom - top };
    } catch { return box; }
  }

  return { outline, arrow, targetBounds };
})();
