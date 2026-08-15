var WaypointScreenshotCapture = (() => {
  const PADDING = 20;

  function cropFor(rect) {
    const x = Math.max(0, rect.left - PADDING);
    const y = Math.max(0, rect.top - PADDING);
    return {
      x,
      y,
      width: Math.max(1, Math.min(window.innerWidth - x, rect.width + PADDING * 2)),
      height: Math.max(1, Math.min(window.innerHeight - y, rect.height + PADDING * 2)),
    };
  }

  async function loadImage(dataUrl) {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    return image;
  }

  async function capture(element) {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'captureVisibleTabScreenshot' });
      if (!response?.success || !response.dataUrl) return null;

      const image = await loadImage(response.dataUrl);
      const rect = element.getBoundingClientRect();
      const crop = cropFor(rect);
      const scaleX = image.naturalWidth / window.innerWidth;
      const scaleY = image.naturalHeight / window.innerHeight;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(crop.width * scaleX));
      canvas.height = Math.max(1, Math.round(crop.height * scaleY));
      const context = canvas.getContext('2d');

      context.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      context.strokeStyle = '#d97757';
      context.lineWidth = Math.max(2, Math.round(2 * scaleX));
      context.strokeRect(
        Math.max(0, (rect.left - crop.x) * scaleX),
        Math.max(0, (rect.top - crop.y) * scaleY),
        rect.width * scaleX,
        rect.height * scaleY,
      );

      return {
        data_url: canvas.toDataURL('image/webp', 0.8),
        crop_area: crop,
        element_bounds: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        timestamp: new Date().toISOString(),
        compression: 'webp_80',
      };
    } catch {
      return null;
    }
  }

  return { capture };
})();
