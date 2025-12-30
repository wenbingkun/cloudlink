const SVG_NS = 'http://www.w3.org/2000/svg';

export const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatTime(seconds) {
  if (seconds < 0 || !isFinite(seconds)) return '0s';
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

export function getFileType(mimeType) {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'document';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('7z') ||
    mimeType.includes('x-gtar') ||
    mimeType.includes('x-tar')
  ) {
    return 'archive';
  }
  if (mimeType.startsWith('text/') || mimeType.includes('document')) return 'document';
  return 'other';
}

export function clearElement(element) {
  element.replaceChildren();
}

export function createSvg(attrs, children = []) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  Object.entries(attrs).forEach(([key, value]) => svg.setAttribute(key, value));
  children.forEach((child) => {
    const element = document.createElementNS(SVG_NS, child.type);
    Object.entries(child.attrs).forEach(([key, value]) => element.setAttribute(key, value));
    svg.appendChild(element);
  });
  return svg;
}

export function createFileTypeIcon(mimeType) {
  const type = getFileType(mimeType);
  switch (type) {
    case 'image':
      return createSvg(
        { xmlns: SVG_NS, width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        [
          { type: 'rect', attrs: { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' } },
          { type: 'circle', attrs: { cx: '8.5', cy: '8.5', r: '1.5' } },
          { type: 'polyline', attrs: { points: '21 15 16 10 5 21' } }
        ]
      );
    case 'video':
      return createSvg(
        { xmlns: SVG_NS, width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        [
          { type: 'polygon', attrs: { points: '23 7 16 12 23 17 23 7' } },
          { type: 'rect', attrs: { x: '1', y: '5', width: '15', height: '14', rx: '2', ry: '2' } }
        ]
      );
    case 'audio':
      return createSvg(
        { xmlns: SVG_NS, width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        [
          { type: 'path', attrs: { d: 'M9 18V5l12-2v13' } },
          { type: 'circle', attrs: { cx: '6', cy: '18', r: '3' } },
          { type: 'circle', attrs: { cx: '18', cy: '16', r: '3' } }
        ]
      );
    case 'document':
      return createSvg(
        { xmlns: SVG_NS, width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        [
          { type: 'path', attrs: { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
          { type: 'polyline', attrs: { points: '14 2 14 8 20 8' } },
          { type: 'line', attrs: { x1: '16', y1: '13', x2: '8', y2: '13' } },
          { type: 'line', attrs: { x1: '16', y1: '17', x2: '8', y2: '17' } },
          { type: 'polyline', attrs: { points: '10 9 9 9 8 9' } }
        ]
      );
    case 'archive':
      return createSvg(
        { xmlns: SVG_NS, width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        [
          { type: 'line', attrs: { x1: '10', y1: '1', x2: '10', y2: '5' } },
          { type: 'line', attrs: { x1: '14', y1: '1', x2: '14', y2: '5' } },
          { type: 'path', attrs: { d: 'M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8' } },
          { type: 'path', attrs: { d: 'M4 12h16' } },
          { type: 'path', attrs: { d: 'M10 5h4' } },
          { type: 'path', attrs: { d: 'M12 5v14' } }
        ]
      );
    default:
      return createSvg(
        { xmlns: SVG_NS, width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        [
          { type: 'path', attrs: { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' } }
        ]
      );
  }
}

export function buildFileInfo({ fileName, mimeType, message }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'file-info';

  const icon = document.createElement('div');
  icon.className = 'file-icon';
  icon.style.cssText = 'font-size: 4rem; margin-bottom: 1rem; color: var(--color-primary);';
  icon.appendChild(createFileTypeIcon(mimeType));
  wrapper.appendChild(icon);

  const title = document.createElement('h3');
  title.textContent = fileName;
  wrapper.appendChild(title);

  if (mimeType) {
    const typePara = document.createElement('p');
    typePara.textContent = `文件类型：${mimeType}`;
    wrapper.appendChild(typePara);
  }

  if (message) {
    const messagePara = document.createElement('p');
    messagePara.textContent = message;
    wrapper.appendChild(messagePara);
  }

  return wrapper;
}

export function createToastIcon(type) {
  switch (type) {
    case 'success':
      return createSvg(
        { xmlns: SVG_NS, width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        [
          { type: 'path', attrs: { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' } },
          { type: 'polyline', attrs: { points: '22 4 12 14.01 9 11.01' } }
        ]
      );
    case 'error':
      return createSvg(
        { xmlns: SVG_NS, width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        [
          { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
          { type: 'line', attrs: { x1: '12', y1: '8', x2: '12', y2: '12' } },
          { type: 'line', attrs: { x1: '12', y1: '16', x2: '12.01', y2: '16' } }
        ]
      );
    default:
      return createSvg(
        { xmlns: SVG_NS, width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        [
          { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
          { type: 'line', attrs: { x1: '12', y1: '16', x2: '12', y2: '12' } },
          { type: 'line', attrs: { x1: '12', y1: '8', x2: '12.01', y2: '8' } }
        ]
      );
  }
}
