// All Logbook Waypoint V2 CSS as a JS constant
// Loaded synchronously into the shadow root — no async fetch needed

var WAYPOINT_STYLES = `
/* ===== Reset inside shadow ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ===== Theme tokens (light default) ===== */
:host {
  --waypoint-surface: #f8f9fc;
  --waypoint-surface-1: #fcfcfd;
  --waypoint-text-primary: #0c111b;
  --waypoint-text-secondary: #697586;
  --waypoint-outline: #00000014;
  --waypoint-outline-highlight: #00000028;
  --waypoint-accent: #d97757;
  --waypoint-on-accent: #ffffff;
  --waypoint-surface-hover: #0d0f1c14;
  --waypoint-secondary-btn-bg: #0000000d;
  --waypoint-textarea-bg: #0000000d;
  --waypoint-warning: #f79009;
  --waypoint-on-warning: #ffffff;
  --waypoint-warning-container: #f7900919;
  --waypoint-on-warning-container: #93370c;
  --waypoint-danger: #dc2626;
  --waypoint-danger-hover: #dc26260d;
  --waypoint-highlight: #2563eb;
  --waypoint-badge-bg: #4b5563;
  --waypoint-tooltip-bg: #111827;
  --waypoint-primary-btn: #4f5d75;

  --waypoint-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --waypoint-font-mono: 'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace;

  --waypoint-radius-xs: 4px;
  --waypoint-radius-sm: 8px;
  --waypoint-radius-md: 12px;
  --waypoint-radius-lg: 16px;
  --waypoint-radius-full: 9999px;

  font-family: var(--waypoint-font);
  font-size: 14px;
  line-height: 1.5;
  color: var(--waypoint-text-primary);
}

/* ===== Animations ===== */
@keyframes waypoint-fade-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes waypoint-slide-up {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes waypoint-slide-down {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes waypoint-toast-in {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes waypoint-toast-out {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(20px); }
}

@keyframes waypoint-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* ===== Inspection highlight overlay ===== */
.waypoint-highlight {
  position: fixed;
  pointer-events: none;
  border: 2px solid var(--waypoint-highlight);
  border-radius: 2px;
  background: rgba(37, 99, 235, 0.06);
  transition: all 0.1s ease;
  z-index: 1;
}

/* ===== Inspection toast ===== */
.waypoint-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--waypoint-accent);
  color: var(--waypoint-on-accent);
  padding: 12px 18px;
  border-radius: var(--waypoint-radius-sm);
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
  animation: waypoint-toast-in 0.25s ease forwards;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
}

.waypoint-toast--out {
  animation: waypoint-toast-out 0.25s ease forwards;
}

.waypoint-toast p { margin: 0; }

.waypoint-toast .sub {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 2px;
}

/* ===== Badges (numbered pins) ===== */
.waypoint-badge {
  position: fixed;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--waypoint-badge-bg);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  font-family: var(--waypoint-font);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: pointer;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  transform: translateX(-50%);
  user-select: none;
}

.waypoint-badge:hover {
  transform: translateX(-50%) scale(1.15);
  box-shadow: 0 3px 12px rgba(0,0,0,0.25);
}

.waypoint-badge.targeted {
  animation: waypoint-pulse 0.6s ease 3;
  box-shadow: 0 0 0 3px var(--waypoint-highlight), 0 2px 8px rgba(0,0,0,0.18);
}

/* Badge tooltip */
.waypoint-badge-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--waypoint-tooltip-bg);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 400;
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease, visibility 0.15s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 20;
}

.waypoint-badge-tooltip::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid var(--waypoint-tooltip-bg);
}

.waypoint-badge:hover .waypoint-badge-tooltip {
  opacity: 1;
  visibility: visible;
}

/* ===== Annotation popover ===== */
.waypoint-popover-anchor {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 10;
  cursor: default !important;
}

.waypoint-popover {
  pointer-events: auto;
  width: 340px;
  background: var(--waypoint-surface-1);
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-md);
  box-shadow: 0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08);
  animation: waypoint-slide-up 0.2s ease forwards;
  overflow: visible;
  cursor: default !important;
}

.waypoint-popover.dragging {
  user-select: none;
}

/* Drag handle (iPhone drawer style) */
.waypoint-drag-handle {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
  cursor: grab;
}
.waypoint-drag-handle::after {
  content: '';
  width: 40%;
  height: 4px;
  border-radius: 2px;
  background: var(--waypoint-outline-highlight);
  transition: background 0.15s ease;
}
.waypoint-drag-handle:hover::after { background: var(--waypoint-text-secondary); }
.waypoint-drag-handle:active { cursor: grabbing; }

/* Popover title */
.waypoint-popover-title {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 14px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--waypoint-text-secondary);
}
.waypoint-popover-title code {
  font-family: var(--waypoint-font-mono);
  font-size: 11px;
  color: var(--waypoint-text-primary);
}

/* Tab bar (pills) — single-line, scrollable */
.waypoint-tab-bar {
  display: flex;
  gap: 4px;
  padding: 4px 14px 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.waypoint-tab-bar::-webkit-scrollbar { display: none; }
.waypoint-tab {
  padding: 3px 10px;
  background: none;
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-full);
  color: var(--waypoint-text-secondary);
  font-family: var(--waypoint-font);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: color .15s, background .15s, border-color .15s;
}
.waypoint-tab:hover { color: var(--waypoint-text-primary); border-color: var(--waypoint-outline-highlight); }
.waypoint-tab.active { color: var(--waypoint-on-accent); background: var(--waypoint-accent); border-color: var(--waypoint-accent); }

/* Tab panels */
.waypoint-tab-panel { padding-top: 4px; }

/* Raw CSS textarea */
.waypoint-raw-css {
  width: 100%;
  min-height: 120px;
  max-height: 200px;
  resize: vertical;
  font-family: var(--waypoint-font-mono);
  font-size: 11px;
  line-height: 1.5;
  color: var(--waypoint-text-primary);
  background: var(--waypoint-textarea-bg);
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-xs);
  padding: 8px;
  outline: none;
  white-space: pre;
  overflow-x: auto;
  tab-size: 2;
  box-sizing: border-box;
}
.waypoint-raw-css:focus { border-color: var(--waypoint-accent); }

/* Raw CSS panel sections */
.waypoint-raw-css-section { margin-bottom: 8px; }
.waypoint-raw-css-section:last-child { margin-bottom: 0; }
.waypoint-raw-css-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 2px 0;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: var(--waypoint-font);
}
.waypoint-raw-css-toggle:hover .waypoint-raw-css-label { color: var(--waypoint-text-primary); }
.waypoint-raw-css-chevron {
  display: flex;
  align-items: center;
  color: var(--waypoint-text-secondary);
  transition: transform 0.15s ease;
  transform: rotate(0deg);
  flex-shrink: 0;
}
.waypoint-raw-css-chevron.open { transform: rotate(90deg); }
.waypoint-raw-css-collapsible { margin-top: 4px; }
.waypoint-raw-css-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--waypoint-text-secondary);
  display: inline;
}
.waypoint-raw-css-hint { font-weight: 400; opacity: 0.6; }
.waypoint-css-rules {
  width: 100%;
  min-height: 100px;
  max-height: 200px;
  resize: vertical;
  font-family: var(--waypoint-font-mono);
  font-size: 11px;
  line-height: 1.5;
  color: var(--waypoint-text-primary);
  background: var(--waypoint-textarea-bg);
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-xs);
  padding: 8px;
  outline: none;
  white-space: pre;
  overflow-x: auto;
  tab-size: 2;
  box-sizing: border-box;
}
.waypoint-css-rules:focus { border-color: var(--waypoint-accent); }

/* Design toolbar */
.waypoint-design-toolbar {
  padding: 6px 14px;
  border-bottom: 1px solid var(--waypoint-outline);
}

.waypoint-design-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.waypoint-design-row + .waypoint-design-row {
  margin-top: 5px;
}

.waypoint-design-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--waypoint-text-secondary);
  flex-shrink: 0;
}

.waypoint-design-icon svg {
  width: 12px;
  height: 12px;
}

.waypoint-stepper {
  display: flex;
  align-items: center;
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-xs);
  background: var(--waypoint-textarea-bg);
}

.waypoint-stepper-input {
  width: 36px;
  height: 22px;
  text-align: center;
  border: none;
  background: none;
  font-family: var(--waypoint-font-mono);
  font-size: 11px;
  color: var(--waypoint-text-primary);
  outline: none;
  -moz-appearance: textfield;
  padding: 0;
}

.waypoint-stepper-input::-webkit-inner-spin-button,
.waypoint-stepper-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.waypoint-stepper-unit {
  font-family: var(--waypoint-font-mono);
  font-size: 10px;
  color: var(--waypoint-text-secondary);
  padding: 0 5px 0 0;
  user-select: none;
}

/* Content (text edit) textarea */
.waypoint-content-row { align-items: flex-start; }
.waypoint-content-icon { padding-top: 4px; }
.waypoint-content-input {
  flex: 1;
  width: 0;
  min-height: 22px;
  max-height: calc(11px * 1.5 * 8 + 10px); /* ~8 lines */
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-xs);
  background: var(--waypoint-textarea-bg);
  font-family: var(--waypoint-font-mono);
  font-size: 11px;
  line-height: 1.5;
  color: var(--waypoint-text-primary);
  padding: 3px 6px;
  outline: none;
  box-sizing: border-box;
  min-width: 0;
  resize: none;
  overflow-y: auto;
}
.waypoint-content-input:focus { border-color: var(--waypoint-accent); }

.waypoint-align-group {
  display: flex;
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-xs);
  overflow: hidden;
}

.waypoint-align-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-right: 1px solid var(--waypoint-outline);
  color: var(--waypoint-text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  padding: 0;
}

.waypoint-align-btn:last-child {
  border-right: none;
}

.waypoint-align-btn:hover {
  background: var(--waypoint-surface-hover);
}

.waypoint-align-btn.active {
  background: var(--waypoint-surface-hover);
  color: var(--waypoint-text-primary);
}

.waypoint-align-btn svg {
  width: 12px;
  height: 12px;
}

.waypoint-design-reset {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: auto;
  padding: 0;
  border: none;
  border-radius: var(--waypoint-radius-xs);
  background: none;
  color: var(--waypoint-text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, visibility 0s;
  visibility: hidden;
}

.waypoint-design-reset:hover {
  color: var(--waypoint-text-primary);
  background: var(--waypoint-surface-hover);
}

/* Toggle group (display block/flex, flex direction) */
.waypoint-toggle-group { display:flex; border:1px solid var(--waypoint-outline); border-radius:var(--waypoint-radius-xs); overflow:hidden; }
.waypoint-toggle-btn { height:22px; padding:0 6px; background:none; border:none; border-right:1px solid var(--waypoint-outline); color:var(--waypoint-text-secondary); cursor:pointer; font-family:var(--waypoint-font); font-size:11px; font-weight:500; transition:background .15s,color .15s; display:flex; align-items:center; justify-content:center; }
.waypoint-toggle-btn:last-child { border-right:none; }
.waypoint-toggle-btn:hover { background:var(--waypoint-surface-hover); }
.waypoint-toggle-btn.active { background:var(--waypoint-surface-hover); color:var(--waypoint-text-primary); }
.waypoint-toggle-btn svg { width:12px; height:12px; }

/* Padding split toggle */
.waypoint-split-btn { width:22px; height:22px; display:flex; align-items:center; justify-content:center; background:none; border:1px solid var(--waypoint-outline); border-radius:var(--waypoint-radius-xs); color:var(--waypoint-text-secondary); cursor:pointer; margin-left:auto; flex-shrink:0; padding:0; }
.waypoint-split-btn:hover { background:var(--waypoint-surface-hover); color:var(--waypoint-text-primary); }
.waypoint-split-btn.active { background:var(--waypoint-surface-hover); color:var(--waypoint-text-primary); }

/* Smaller stepper for split-4 padding */
.waypoint-stepper-sm { flex:1; min-width:0; }
.waypoint-stepper-sm .waypoint-stepper-input, .waypoint-stepper-sm .waypoint-stepper-text { width:100%; }

/* Sizing rows — label+field pairs with extra spacing */
.waypoint-sizing-row { display:flex; align-items:center; gap:10px; }
.waypoint-sizing-row + .waypoint-sizing-row { margin-top:5px; }
.waypoint-sizing-pair { display:flex; align-items:center; gap:4px; flex:1; min-width:0; }

/* Padding V/H text inputs */
.waypoint-stepper-text { width:56px; height:22px; text-align:center; border:none; background:none; font-family:var(--waypoint-font-mono); font-size:11px; color:var(--waypoint-text-primary); outline:none; padding:0; }

/* Section headers (Padding / Margin / Flow) */
.waypoint-section-header { display:flex; align-items:center; justify-content:space-between; margin-top:6px; margin-bottom:3px; }
.waypoint-section-header:first-child { margin-top:0; }
.waypoint-section-label { font-family:var(--waypoint-font); font-size:10px; font-weight:500; color:var(--waypoint-text-secondary); letter-spacing:0.01em; }

/* Grow stepper to fill available width */
.waypoint-stepper-grow { flex:1; min-width:0; }
.waypoint-stepper-grow .waypoint-stepper-text { width:100%; }

/* Flex/Grid option sections */
.waypoint-flex-options { margin-top:6px; }
.waypoint-grid-options { margin-top:6px; }

/* Prop spacer — visual gap between inline icon+field groups */
.waypoint-prop-spacer { width:8px; flex-shrink:0; }

/* Spacing rows — split button fixed, inputs flex */
.waypoint-spacing-row { display:flex; align-items:center; gap:5px; }
.waypoint-spacing-row + .waypoint-spacing-row { margin-top:5px; }
.waypoint-spacing-inputs { flex:1; min-width:0; display:flex; align-items:center; gap:5px; }

/* Flow toggle group — equal width buttons */
.waypoint-flow-group { width:100%; }
.waypoint-flow-group .waypoint-toggle-btn { flex:1; padding:0 6px; height:24px; }
.waypoint-flow-group .waypoint-toggle-btn svg { width:14px; height:14px; }

/* Layout split — matrix left, controls right */
.waypoint-layout-split { display:flex; gap:12px; align-items:flex-start; margin-top:6px; }
.waypoint-layout-left { flex:1; min-width:0; }
.waypoint-layout-right { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
.waypoint-gap-row { margin-top:4px; align-items:center; }
.waypoint-gap-label { font-family:var(--waypoint-font); font-size:11px; color:var(--waypoint-text-secondary); white-space:nowrap; flex-shrink:0; margin-right:4px; }
.waypoint-gap-input-row .waypoint-stepper-input { flex:1; width:auto; }
.waypoint-gap-input-row.disabled { opacity:0.35; pointer-events:none; }

/* Checkbox labels (Reverse order / Wrap items) */
.waypoint-check-label { display:flex; align-items:center; gap:6px; cursor:pointer; font-family:var(--waypoint-font); font-size:11px; color:var(--waypoint-text-secondary); white-space:nowrap; user-select:none; padding:4px 0; }
.waypoint-check-label input[type="checkbox"] { appearance:none; -webkit-appearance:none; width:14px; height:14px; margin:0; border:1.5px solid var(--waypoint-text-secondary); border-radius:3px; background:none; cursor:pointer; flex-shrink:0; position:relative; transition:background .12s, border-color .12s; }
.waypoint-check-label input[type="checkbox"]:checked { background:var(--waypoint-accent); border-color:var(--waypoint-accent); }
.waypoint-check-label input[type="checkbox"]:checked::after { content:''; position:absolute; left:3.5px; top:1px; width:4px; height:7px; border:solid #fff; border-width:0 1.5px 1.5px 0; transform:rotate(45deg); }

/* 3×3 alignment matrix */
.waypoint-align-matrix { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; border:1px solid var(--waypoint-outline); border-radius:var(--waypoint-radius-sm); overflow:hidden; background:var(--waypoint-textarea-bg); padding:3px; width:100%; }
.waypoint-matrix-cell { height:18px; display:flex; align-items:center; justify-content:center; background:none; border:none; border-radius:3px; cursor:pointer; padding:0; transition:background .12s; }
.waypoint-matrix-cell:hover { background:var(--waypoint-surface-hover); }
.waypoint-matrix-cell.active { background:var(--waypoint-surface-hover); }
.waypoint-matrix-dot { width:4px; height:4px; border-radius:50%; background:var(--waypoint-text-secondary); opacity:0.5; transition:all .12s; }
.waypoint-matrix-cell.active .waypoint-matrix-dot { background:var(--waypoint-accent); opacity:1; transform:scale(1.4); }

/* T/R/B/L labels */
.waypoint-design-icon-label { display:flex; align-items:center; justify-content:center; color:var(--waypoint-text-secondary); font-family:var(--waypoint-font-mono); font-size:9px; font-weight:600; width:12px; flex-shrink:0; }
.waypoint-design-icon-label-wide { width:auto; }
.waypoint-scrubbable-label { cursor: ew-resize; touch-action: none; border-radius: 3px; }
.waypoint-scrubbable-label:hover,
.waypoint-scrubbable-label.scrubbing { color: var(--waypoint-accent); background: var(--waypoint-surface-hover); }

.waypoint-annotation-options { display:grid; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid var(--waypoint-outline); }
.waypoint-annotation-attachments { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:8px; min-height:32px; }
.waypoint-attachment-button { position:relative; display:inline-flex; align-items:center; gap:6px; min-height:32px; padding:6px 10px; border:1px solid var(--waypoint-outline); border-radius:var(--waypoint-radius-sm); background:var(--waypoint-surface-1); color:var(--waypoint-text-primary); font-size:11px; line-height:1; font-weight:600; white-space:nowrap; cursor:pointer; transition:border-color .15s ease, background .15s ease, color .15s ease; }
.waypoint-attachment-button:hover { border-color:var(--waypoint-outline-highlight); background:var(--waypoint-surface-hover); color:var(--waypoint-accent); }
.waypoint-attachment-button:focus-within { outline:2px solid var(--waypoint-accent); outline-offset:2px; }
.waypoint-attachment-button-icon { display:grid; place-items:center; flex:0 0 auto; }
.waypoint-image-attachment-input { position:absolute; width:1px; height:1px; opacity:0; overflow:hidden; pointer-events:none; }
.waypoint-attachment-status { min-width:0; color:var(--waypoint-text-secondary); font-size:10px; line-height:1.3; }
.waypoint-attachment-status[role="alert"] { color:var(--waypoint-danger); }
.waypoint-variant-intent-label { display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:48px; padding:8px 10px; border:1px solid transparent; border-radius:var(--waypoint-radius-sm); background:var(--waypoint-textarea-bg); cursor:pointer; transition:border-color .15s ease, background .15s ease; }
.waypoint-variant-intent-label:hover { border-color:var(--waypoint-outline); background:var(--waypoint-surface-hover); }
.waypoint-design-intent-row { display:grid; gap:4px; }
.waypoint-design-intent-dependency { justify-self:start; color:var(--waypoint-accent); font-size:11px; line-height:1.35; text-underline-offset:2px; }
.waypoint-design-intent-dependency:focus-visible { outline:2px solid var(--waypoint-accent); outline-offset:2px; border-radius:2px; }
.waypoint-variant-intent-copy { display:grid; gap:1px; min-width:0; }
.waypoint-variant-intent-title { color:var(--waypoint-text-primary); font-size:11px; line-height:1.35; font-weight:600; }
.waypoint-variant-intent-description { color:var(--waypoint-text-secondary); font-size:10px; line-height:1.35; }
.waypoint-variant-intent { appearance:none; -webkit-appearance:none; width:18px; height:18px; flex:0 0 auto; border:1.5px solid var(--waypoint-outline-highlight); border-radius:5px; background:var(--waypoint-surface-1); cursor:pointer; position:relative; transition:background .15s ease, border-color .15s ease; }
.waypoint-variant-intent:checked { border-color:var(--waypoint-accent); background:var(--waypoint-accent); }
.waypoint-variant-intent:checked::after { content:''; position:absolute; left:5px; top:2px; width:4px; height:8px; border:solid var(--waypoint-on-accent); border-width:0 1.5px 1.5px 0; transform:rotate(45deg); }
.waypoint-variant-intent:focus-visible { outline:2px solid var(--waypoint-highlight); outline-offset:2px; }
.waypoint-design-actions { display:grid; gap:8px; }
.waypoint-design-action-catalog { display:grid; gap:7px; padding:0 2px 2px; }
.waypoint-design-action-catalog[hidden] { display:none; }
.waypoint-design-action-heading { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
.waypoint-design-action-state { color:var(--waypoint-text-primary); font-size:10px; line-height:1.35; font-weight:600; }
.waypoint-design-action-dependency { color:var(--waypoint-text-secondary); font-size:9px; line-height:1.35; }
.waypoint-design-action-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:5px; }
.waypoint-design-action { min-width:0; min-height:30px; padding:5px 8px; border:1px solid var(--waypoint-outline); border-radius:var(--waypoint-radius-xs); background:var(--waypoint-surface-1); color:var(--waypoint-text-primary); font:600 10px/1.2 var(--waypoint-font); text-align:left; cursor:pointer; transition:border-color .15s ease,background .15s ease,color .15s ease; }
.waypoint-design-action:hover { border-color:var(--waypoint-outline-highlight); background:var(--waypoint-surface-hover); }
.waypoint-design-action[aria-pressed="true"] { border-color:var(--waypoint-accent); background:color-mix(in srgb,var(--waypoint-accent) 14%,var(--waypoint-surface-1)); color:var(--waypoint-accent); }
.waypoint-design-action:focus-visible { outline:2px solid var(--waypoint-highlight); outline-offset:2px; }
.waypoint-design-action-description { min-height:14px; color:var(--waypoint-text-secondary); font-size:9px; line-height:1.4; }

/* Color picker */
.waypoint-color-row { display:flex; align-items:center; gap:6px; }
.waypoint-color-swatch { width:20px; height:20px; border-radius:4px; border:1px solid var(--waypoint-outline); cursor:pointer; padding:0; flex-shrink:0; position:relative; }
.waypoint-color-swatch:hover { border-color:var(--waypoint-outline-highlight); }
.waypoint-color-input { width:70px; height:22px; border:1px solid var(--waypoint-outline); border-radius:var(--waypoint-radius-xs); background:var(--waypoint-textarea-bg); font-family:var(--waypoint-font-mono); font-size:10px; color:var(--waypoint-text-primary); padding:0 6px; outline:none; }
.waypoint-color-input:focus { border-color:var(--waypoint-accent); }
.waypoint-color-input-inline { width:58px; }

/* Color palette dropdown */
.waypoint-color-palette { position:absolute; bottom:calc(100% + 4px); left:0; background:var(--waypoint-surface); border:1px solid var(--waypoint-outline); border-radius:var(--waypoint-radius-sm); padding:6px; display:grid; grid-template-columns:repeat(auto-fill,22px); gap:4px; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,.12); min-width:120px; max-width:240px; }
.waypoint-color-palette-swatch { width:22px; height:22px; border-radius:4px; border:1px solid var(--waypoint-outline); cursor:pointer; padding:0; transition:transform .1s; }
.waypoint-color-palette-swatch:hover { transform:scale(1.15); border-color:var(--waypoint-outline-highlight); }
.waypoint-color-palette-swatch.active { outline:2px solid var(--waypoint-accent); outline-offset:1px; }
.waypoint-resolution-record { margin-bottom:12px; padding:12px; border:1px solid var(--waypoint-outline); border-radius:8px; background:var(--waypoint-surface-hover); }
.waypoint-resolution-label { font-size:11px; font-weight:600; color:var(--waypoint-text-secondary); text-transform:uppercase; letter-spacing:.04em; }
.waypoint-resolution-summary { margin:4px 0 10px; color:var(--waypoint-text-primary); }
.waypoint-resolution-verification { margin:4px 0 0; padding-left:18px; color:var(--waypoint-text-primary); }
.waypoint-color-palette-empty { font-size:11px; color:var(--waypoint-text-secondary); padding:4px; grid-column:1/-1; }

/* Warning bar */
.waypoint-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 14px;
  padding: 8px 10px;
  background: var(--waypoint-warning-container);
  border-radius: 6px;
  font-size: 12px;
  color: var(--waypoint-on-warning-container);
}

.waypoint-warning svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.waypoint-work-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 12px 16px 0;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--waypoint-warning) 32%, transparent);
  border-radius: 10px;
  background: var(--waypoint-warning-container);
  color: var(--waypoint-on-warning-container);
}

.waypoint-work-notice-copy {
  display: grid;
  flex: 1;
  gap: 3px;
  min-width: 0;
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.waypoint-work-notice-dismiss {
  border: 0;
  padding: 2px 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.waypoint-work-notice-dismiss:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Textarea */
.waypoint-popover-body {
  padding: 10px 14px;
}

.waypoint-input-wrap {
  position: relative;
}

.waypoint-textarea {
  width: 100%;
  min-height: 72px;
  padding: 10px;
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-sm);
  background: var(--waypoint-textarea-bg);
  color: var(--waypoint-text-primary);
  font-family: var(--waypoint-font);
  font-size: 13px;
  line-height: 1.45;
  resize: vertical;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.waypoint-textarea:focus {
  outline: none;
  border-color: var(--waypoint-highlight);
  background: var(--waypoint-surface-hover);
}

.waypoint-textarea::placeholder {
  color: var(--waypoint-text-secondary);
}

.waypoint-kbd-hint {
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-size: 10px;
  color: var(--waypoint-text-secondary);
  opacity: 0.7;
  pointer-events: none;
}

/* Actions footer */
.waypoint-popover-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 12px;
  gap: 8px;
}
.waypoint-footer-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.waypoint-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.waypoint-viewport-info {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--waypoint-text-secondary);
  font-family: var(--waypoint-font-mono);
  white-space: nowrap;
}
.waypoint-viewport-info svg { flex-shrink: 0; }

/* ===== Buttons ===== */
.waypoint-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: var(--waypoint-radius-full);
  font-family: var(--waypoint-font);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s ease, opacity 0.15s ease, color 0.15s ease;
  user-select: none;
}

.waypoint-btn svg {
  width: 16px;
  height: 16px;
}

.waypoint-btn-primary {
  background: linear-gradient(135deg, #dc2626, #d97757);
  color: #fff;
}

.waypoint-btn-primary:hover { opacity: 0.88; }

.waypoint-btn-primary:disabled {
  background: var(--waypoint-text-secondary);
  color: var(--waypoint-surface);
  cursor: not-allowed;
  opacity: 0.4;
}

.waypoint-btn-secondary {
  background: transparent;
  color: var(--waypoint-text-secondary);
}

.waypoint-btn-secondary:hover {
  color: var(--waypoint-text-primary);
}

.waypoint-btn-icon {
  background: transparent;
  color: var(--waypoint-text-secondary);
  padding: 6px;
  border: none;
  border-radius: var(--waypoint-radius-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}

.waypoint-btn-icon:hover {
  color: var(--waypoint-danger);
  background: var(--waypoint-danger-hover);
}

/* ===== Floating toolbar ===== */
.waypoint-toolbar {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 3px;
  background: #fbf4e3;
  border: 1px solid #cfb881;
  border-radius: 14px;
  padding: 5px;
  pointer-events: auto;
  box-shadow: 0 10px 28px rgba(35, 46, 40, 0.14), 0 2px 5px rgba(35, 46, 40, 0.08);
  z-index: 50;
  user-select: none;
  touch-action: none;
  cursor: default;
  transition: box-shadow 0.2s ease;
}

.waypoint-toolbar:hover {
  box-shadow: 0 14px 34px rgba(35, 46, 40, 0.18), 0 3px 7px rgba(35, 46, 40, 0.1);
}

.waypoint-toolbar.dragging {
  cursor: grabbing;
  box-shadow: 0 8px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1);
}

.waypoint-toolbar.dragging .waypoint-toolbar-drag-handle {
  cursor: grabbing;
}

.waypoint-toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #4f5f58;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  position: relative;
}

.waypoint-toolbar-btn:hover {
  background: #efe2c5;
  color: #17231f;
}

.waypoint-toolbar-btn:focus-visible,
.waypoint-theme-btn:focus-visible,
.waypoint-settings-link:focus-visible,
.waypoint-site-permission-btn:focus-visible {
  outline: 2px solid var(--waypoint-accent);
  outline-offset: 2px;
}

.waypoint-toolbar-btn.active {
  background: #bd4d29;
  color: #fffaf0;
}

.waypoint-toolbar-btn.active:hover {
  opacity: 0.9;
}

.waypoint-toolbar-btn svg {
  width: 18px;
  height: 18px;
}

.waypoint-toolbar-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.waypoint-toolbar-btn:disabled:hover {
  background: transparent;
  color: var(--waypoint-text-secondary);
}

/* Toolbar divider */
.waypoint-toolbar-divider {
  width: 1px;
  height: 20px;
  background: #cfb881;
  margin: 0 2px;
}

.waypoint-branded-settings-icon {
  display: block;
  width: 24px;
  height: 24px;
  object-fit: contain;
  pointer-events: none;
}

/* Drag handle (vertical bar) */
.waypoint-toolbar-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  cursor: grab;
}

.waypoint-toolbar-drag-handle::after {
  content: '';
  width: 4px;
  height: 20px;
  border-radius: 2px;
  background: repeating-linear-gradient(180deg, #a9894f 0 2px, transparent 2px 5px);
  transition: background 0.15s ease;
}

.waypoint-toolbar-drag-handle:hover::after {
  background: var(--waypoint-text-secondary);
}

.waypoint-toolbar-drag-handle:active {
  cursor: grabbing;
}

/* MCP status dot */
.waypoint-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.waypoint-status-dot.online  { background: #10b981; }
.waypoint-status-dot.offline { background: #ef4444; }

.waypoint-toolbar-inner {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* Collapsed toolbar */
.waypoint-toolbar.collapsed {
  padding: 4px;
  border-radius: 12px;
}

.waypoint-toolbar.collapsed .waypoint-tb-collapse {
  width: 34px;
  height: 34px;
  overflow: hidden;
  border-radius: 50%;
}

.waypoint-collapsed-icon {
  display: block;
  width: 28px;
  height: 28px;
  object-fit: contain;
  pointer-events: none;
}

.waypoint-toolbar.collapsed .waypoint-toolbar-inner {
  display: none;
}

/* Toolbar badge count */
.waypoint-toolbar-count {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--waypoint-accent);
  color: var(--waypoint-on-accent);
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

/* Toolbar stylesheet annotation badge */
.waypoint-toolbar-style-count {
  position: absolute;
  top: -2px;
  left: -2px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: #ec4899;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

/* Toolbar tooltip */
.waypoint-toolbar-tip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--waypoint-tooltip-bg);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease, visibility 0.15s ease;
}

.waypoint-toolbar-btn:hover .waypoint-toolbar-tip {
  opacity: 1;
  visibility: visible;
}

/* ===== Settings dropdown ===== */
.waypoint-queue-panel {
  position: fixed;
  width: min(390px, calc(100vw - 24px));
  max-height: min(520px, calc(100vh - 24px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--waypoint-surface-1);
  border-radius: var(--waypoint-radius-md);
  box-shadow: 0 18px 50px rgba(35, 46, 40, 0.2), 0 3px 10px rgba(35, 46, 40, 0.1);
  pointer-events: auto;
  z-index: 100;
  animation: waypoint-slide-up 0.18s ease forwards;
}

.waypoint-queue-panel.above { animation-name: waypoint-slide-down; }

.waypoint-queue-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 15px 16px 13px;
  border-bottom: 1px solid var(--waypoint-outline);
}

.waypoint-queue-header h2 {
  margin: 0;
  color: var(--waypoint-text-primary);
  font-size: 15px;
  font-weight: 700;
}

.waypoint-queue-header h2 span { color: var(--waypoint-text-secondary); font-weight: 500; }
.waypoint-queue-header p { margin: 3px 0 0; color: var(--waypoint-text-secondary); font: 11px/1.4 var(--waypoint-font-mono); }
.waypoint-queue-views { display: grid; grid-template-columns: 1fr 1fr; padding: 4px 8px 0; border-bottom: 1px solid var(--waypoint-outline); }
.waypoint-queue-views button { min-height: 32px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--waypoint-text-secondary); font-size: 11px; font-weight: 600; cursor: pointer; }
.waypoint-queue-views button[aria-pressed="true"] { border-bottom-color: var(--waypoint-accent); color: var(--waypoint-text-primary); }
.waypoint-queue-views button:focus-visible { outline: 2px solid var(--waypoint-accent); outline-offset: -2px; }
.waypoint-queue-views span { font-weight: 500; }
.waypoint-queue-signal-key { display: flex; flex-wrap: wrap; align-items: center; gap: 5px 8px; padding: 5px 16px; border-bottom: 1px solid var(--waypoint-outline); background: var(--waypoint-surface-2); color: var(--waypoint-text-secondary); font-size: 9px; line-height: 1.2; }
.waypoint-queue-signal-key-title { margin-right: 2px; font-weight: 600; letter-spacing: 0.02em; }
.waypoint-queue-signal-key-item { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
.waypoint-queue-signal-key-item + .waypoint-queue-signal-key-item::before { content: '·'; margin-right: 5px; opacity: 0.55; }
.waypoint-queue-signal-key-item svg { width: 11px; height: 11px; stroke-width: 1.7; }
.waypoint-queue-header-actions { display: flex; align-items: center; gap: 4px; }
.waypoint-queue-other-routes, .waypoint-queue-current-route { min-height: 32px; padding: 0 8px; border: 0; border-radius: 8px; background: transparent; color: var(--waypoint-accent); font-size: 11px; font-weight: 600; cursor: pointer; }
.waypoint-queue-other-routes:hover, .waypoint-queue-current-route:hover { background: var(--waypoint-surface-2); }
.waypoint-queue-close { width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; color: var(--waypoint-text-secondary); font-size: 20px; cursor: pointer; }
.waypoint-queue-close:hover { background: var(--waypoint-surface-2); color: var(--waypoint-text-primary); }
.waypoint-queue-close:focus-visible, .waypoint-queue-open:focus-visible, .waypoint-queue-select:focus-visible { outline: 2px solid var(--waypoint-accent); outline-offset: 2px; }
.waypoint-queue-list { overflow: auto; }
.waypoint-queue-row { position: relative; display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; gap: 10px; align-items: start; padding: 13px 16px; border-bottom: 1px solid var(--waypoint-outline); }
.waypoint-queue-row-history { grid-template-columns: minmax(0, 1fr) auto; }
.waypoint-queue-row:last-child { border-bottom: 0; }
.waypoint-queue-row:hover { background: var(--waypoint-surface-2); }
.waypoint-queue-select { margin: 3px 0 0; accent-color: var(--waypoint-accent); }
.waypoint-queue-copy { min-width: 0; display: grid; gap: 4px; }
.waypoint-queue-comment { overflow: hidden; color: var(--waypoint-text-primary); font-size: 13px; font-weight: 600; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.waypoint-queue-meta { overflow: hidden; color: var(--waypoint-text-secondary); font-size: 11px; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
.waypoint-queue-signals { display: flex; align-items: center; gap: 7px; min-height: 14px; color: var(--waypoint-text-secondary); }
.waypoint-queue-signal { display: inline-flex; align-items: center; justify-content: center; flex: none; }
.waypoint-queue-open { border: 0; background: transparent; color: var(--waypoint-accent); font-size: 12px; font-weight: 600; cursor: pointer; padding: 2px 0; }
.waypoint-queue-row-actions { display: flex; align-items: center; gap: 5px; }
.waypoint-queue-delete { width: 28px; height: 28px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 7px; background: transparent; color: var(--waypoint-text-secondary); cursor: pointer; }
.waypoint-queue-delete:hover, .waypoint-queue-delete:focus-visible { background: var(--waypoint-danger-hover); color: var(--waypoint-danger); }
.waypoint-queue-row-menu { grid-column: 2 / -1; display: flex; align-items: center; justify-content: flex-end; gap: 7px; padding-top: 8px; color: var(--waypoint-text-secondary); font-size: 11px; }
.waypoint-queue-row-menu button { min-height: 30px; padding: 0 8px; border: 0; border-radius: 7px; background: transparent; color: var(--waypoint-text-primary); font-size: 11px; font-weight: 600; cursor: pointer; }
.waypoint-queue-row-menu button:hover { background: var(--waypoint-surface-3); }
.waypoint-queue-row-menu .waypoint-queue-confirm-delete { color: var(--waypoint-danger); }
.waypoint-queue-empty { margin: 0; padding: 28px 20px; color: var(--waypoint-text-secondary); font-size: 13px; text-align: center; }
.waypoint-queue-route { width: 100%; min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 16px; border: 0; border-bottom: 1px solid var(--waypoint-outline); background: transparent; color: var(--waypoint-text-primary); font: 12px/1.4 var(--waypoint-font-mono); text-align: left; cursor: pointer; }
.waypoint-queue-route:last-child { border-bottom: 0; }
.waypoint-queue-route:hover { background: var(--waypoint-surface-2); }
.waypoint-queue-route span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.waypoint-queue-route span:last-child { color: var(--waypoint-text-secondary); font-family: var(--waypoint-font-sans); }
.waypoint-queue-actions { display: flex; align-items: center; gap: 6px; padding: 10px 12px; border-top: 1px solid var(--waypoint-outline); background: var(--waypoint-surface-2); }
.waypoint-queue-copy-feedback { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.waypoint-queue-actions button { min-height: 34px; padding: 0 10px; border: 0; border-radius: 8px; background: transparent; color: var(--waypoint-text-primary); font-size: 12px; font-weight: 600; cursor: pointer; }
.waypoint-queue-actions button:hover:not(:disabled) { background: var(--waypoint-surface-3); }
.waypoint-queue-actions button:focus-visible { outline: 2px solid var(--waypoint-accent); outline-offset: 2px; }
.waypoint-queue-actions button:disabled { opacity: 0.45; cursor: not-allowed; }
.waypoint-queue-discard-selected { color: var(--waypoint-danger) !important; }
.waypoint-queue-copy-selected { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; background: var(--waypoint-accent) !important; color: var(--waypoint-on-accent) !important; }
.waypoint-queue-history-actions { justify-content: space-between; color: var(--waypoint-text-secondary); font-size: 11px; }
.waypoint-queue-clear-history { color: var(--waypoint-danger) !important; }
.waypoint-queue-cleanup { display: grid; gap: 10px; }
.waypoint-queue-cleanup-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.waypoint-queue-cleanup-fields label { display: grid; gap: 4px; color: var(--waypoint-text-secondary); font-size: 10px; font-weight: 600; }
.waypoint-queue-cleanup-fields select { min-width: 0; height: 34px; padding: 0 28px 0 9px; border: 1px solid var(--waypoint-outline); border-radius: 8px; background: var(--waypoint-surface-1); color: var(--waypoint-text-primary); font: 11px var(--waypoint-font-sans); }
.waypoint-queue-cleanup-fields select:focus-visible { outline: 2px solid var(--waypoint-accent); outline-offset: 2px; }
.waypoint-queue-cleanup-confirmation { display: flex; align-items: center; gap: 6px; }
.waypoint-queue-cleanup-preview { margin-right: auto; color: var(--waypoint-text-secondary); font-size: 11px; }
.waypoint-queue-confirm-cleanup { background: var(--waypoint-danger) !important; color: #fff !important; }
.waypoint-queue-confirm-copy { color: var(--waypoint-text-primary); font-size: 12px; font-weight: 600; }
.waypoint-queue-cancel-discard { margin-left: auto; }
.waypoint-queue-confirm-discard { background: var(--waypoint-danger) !important; color: #fff !important; }
.waypoint-queue-action-error { color: var(--waypoint-danger); font-size: 12px; font-weight: 600; }

.waypoint-settings-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 280px;
  background: var(--waypoint-surface-1);
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-md);
  box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
  animation: waypoint-slide-up 0.15s ease forwards;
  overflow: hidden;
  pointer-events: auto;
  z-index: 100;
}

.waypoint-settings-dropdown.above {
  top: auto;
  bottom: calc(100% + 10px);
  animation-name: waypoint-slide-down;
}

.waypoint-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--waypoint-outline);
}

.waypoint-settings-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--waypoint-text-primary);
  font-family: var(--waypoint-font-mono);
}

.waypoint-settings-version {
  font-size: 11px;
  color: var(--waypoint-text-secondary);
  margin-left: 8px;
  font-weight: 400;
  text-decoration: none;
  cursor: pointer;
}
.waypoint-settings-version:hover {
  text-decoration: underline;
}

.waypoint-settings-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.waypoint-theme-btn {
  background: none;
  border: none;
  padding: 4px;
  border-radius: var(--waypoint-radius-xs);
  cursor: pointer;
  color: var(--waypoint-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease;
}

.waypoint-theme-btn:hover {
  color: var(--waypoint-text-primary);
  background: var(--waypoint-surface-hover);
}

.waypoint-theme-btn svg {
  width: 16px;
  height: 16px;
}

.waypoint-settings-body {
  padding: 6px 0;
  max-height: min(calc(100vh - 120px), 600px);
  overflow-y: auto;
}

.waypoint-settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--waypoint-text-primary);
}

.waypoint-settings-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.waypoint-settings-item-left svg {
  width: 16px;
  height: 16px;
  color: var(--waypoint-text-secondary);
  flex-shrink: 0;
}

.waypoint-setting-description,
.waypoint-site-permission-status {
  color: var(--waypoint-text-secondary);
  font-size: 11px;
  line-height: 1.35;
}

.waypoint-setting-help {
  color: var(--waypoint-accent);
  font-size: 11px;
  line-height: 1.35;
  text-underline-offset: 2px;
}

.waypoint-site-permission-status {
  min-height: 15px;
  margin: -2px 14px 6px 38px;
}

.waypoint-settings-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--waypoint-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: var(--waypoint-font);
}

.waypoint-settings-link:hover {
  color: var(--waypoint-text-primary);
  background: var(--waypoint-surface-hover);
}

.waypoint-settings-link svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.waypoint-settings-separator {
  height: 1px;
  background: var(--waypoint-outline);
  margin: 4px 0;
}

/* Color dot picker */
.waypoint-color-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: border-color 0.15s ease;
}
.waypoint-color-dot:hover {
  border-color: rgba(255,255,255,0.4);
}
.waypoint-color-dot.active {
  border-color: #fff;
}

/* Get started guide */
.waypoint-guide {
  padding: 8px 14px 12px;
}
.waypoint-guide-section {
  margin-bottom: 12px;
}
.waypoint-guide-section:last-child {
  margin-bottom: 0;
}
.waypoint-guide-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--waypoint-text-primary);
  margin-bottom: 6px;
}
.waypoint-guide-text {
  font-size: 12px;
  color: var(--waypoint-text-secondary);
  line-height: 1.4;
  margin: 0 0 6px;
}
.waypoint-guide-text strong {
  color: var(--waypoint-text-primary);
  font-weight: 600;
}
.waypoint-guide-cmd {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--waypoint-surface-2);
  border: 1px solid var(--waypoint-outline);
  border-radius: 6px;
  padding: 6px 8px;
  margin-bottom: 6px;
}
.waypoint-guide-cmd code {
  font-family: var(--waypoint-font-mono);
  font-size: 11px;
  color: var(--waypoint-text-primary);
  flex: 1;
  overflow-x: auto;
  white-space: nowrap;
}
.waypoint-guide-copy {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--waypoint-text-secondary);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}
.waypoint-guide-copy:hover {
  color: var(--waypoint-text-primary);
}
.waypoint-guide-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.waypoint-guide-tab {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--waypoint-outline);
  background: none;
  color: var(--waypoint-text-secondary);
  cursor: pointer;
  font-family: inherit;
}
.waypoint-guide-tab:hover {
  color: var(--waypoint-text-primary);
  border-color: var(--waypoint-outline-highlight);
}
.waypoint-guide-tab.active {
  background: var(--waypoint-accent);
  color: #fff;
  border-color: var(--waypoint-accent);
}
.waypoint-guide-panel {
  display: none;
}
.waypoint-guide-panel.active {
  display: block;
}

/* Toggle switch */
.waypoint-toggle {
  position: relative;
  width: 36px;
  height: 20px;
  background: var(--waypoint-outline-highlight);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
  border: none;
  padding: 0;
  flex-shrink: 0;
}

.waypoint-toggle.on {
  background: var(--waypoint-accent);
}

.waypoint-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.waypoint-toggle.on::after {
  transform: translateX(16px);
}

/* ===== Shortcut button ===== */
.waypoint-shortcut-btn {
  background: var(--waypoint-surface-hover);
  border: 1px solid var(--waypoint-outline);
  border-radius: 4px;
  padding: 2px 8px;
  font-family: var(--waypoint-font);
  font-size: 12px;
  font-weight: 500;
  color: var(--waypoint-text-secondary);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  min-width: 48px;
  text-align: center;
}
.waypoint-shortcut-btn:hover { border-color: var(--waypoint-text-secondary); color: var(--waypoint-text-primary); }
.waypoint-shortcut-btn.recording { border-color: var(--waypoint-accent); color: var(--waypoint-accent); }

/* ===== Target highlight (around element being annotated) ===== */
.waypoint-target-highlight {
  position: fixed;
  pointer-events: none;
  border: 2px solid var(--waypoint-highlight);
  border-radius: 3px;
  background: rgba(37, 99, 235, 0.05);
  z-index: 2;
  transition: all 0.15s ease;
}

/* ===== Confirm dialog ===== */
.waypoint-confirm-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.3);
  pointer-events: auto;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: waypoint-fade-in 0.15s ease;
}

.waypoint-confirm {
  background: var(--waypoint-surface-1);
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-md);
  padding: 20px;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.waypoint-confirm-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--waypoint-text-primary);
  margin-bottom: 8px;
}

.waypoint-confirm-msg {
  font-size: 13px;
  color: var(--waypoint-text-secondary);
  margin-bottom: 16px;
}

.waypoint-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.waypoint-btn-danger {
  background: var(--waypoint-danger);
  color: #fff;
}

.waypoint-btn-danger:hover {
  opacity: 0.9;
}

/* Export controls */
.waypoint-export-field {
  display: grid;
  gap: 4px;
  margin-top: 10px;
  font-family: var(--waypoint-font);
  font-size: 12px;
  font-weight: 500;
  color: var(--waypoint-text-primary);
}
.waypoint-export-field select {
  min-height: 34px;
  border: 1px solid var(--waypoint-outline);
  border-radius: var(--waypoint-radius-sm);
  background: var(--waypoint-textarea-bg);
  color: var(--waypoint-text-primary);
  font: inherit;
  padding: 0 8px;
}
.waypoint-export-actions {
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-top: 14px;
}

@media (max-width: 480px) {
  .waypoint-toolbar {
    top: max(8px, env(safe-area-inset-top));
    right: max(8px, env(safe-area-inset-right));
  }
  .waypoint-settings-dropdown {
    width: min(320px, calc(100vw - 16px));
  }
  .waypoint-export-actions .waypoint-btn {
    flex: 1 1 100%;
  }
}

/* Primary button */
.waypoint-btn-primary {
  background: var(--waypoint-accent);
  color: #fff;
}
.waypoint-btn-primary:hover {
  opacity: 0.9;
}

.waypoint-variant-picker {
  position: fixed;
  top: 24px;
  right: 24px;
  width: min(360px, calc(100vw - 48px));
}

.waypoint-variant-list {
  display: grid;
  gap: 8px;
  padding: 16px;
}

.waypoint-variant-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  gap: 8px;
}

.waypoint-variant-activate {
  justify-content: flex-start;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.waypoint-variant-discard:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.waypoint-variant-status {
  color: var(--waypoint-text-secondary);
  font-size: 12px;
}
`;
