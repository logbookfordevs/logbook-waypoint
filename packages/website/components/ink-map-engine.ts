import * as THREE from 'three';
import type { InkMapSound } from '@/components/ink-map-audio';

type Point = [number, number];
type RoutePiece = ['curve', Point[]] | ['zig', Point, number, number] | ['loop', number, number];
interface CameraFrame { tx: number; ty: number; h: number; tilt: number; yaw: number }

export interface InkMapJourneyOptions {
  onContinue?: () => void;
  inline?: boolean;
  sound?: InkMapSound;
  /** Hold the ink above the chart until the visitor presses to release it. */
  entrance?: boolean;
  /** Runs synchronously inside the visitor's gesture, before the intro starts. */
  onBegin?: (withSound: boolean) => void;
}

export function createInkMapJourney(root: HTMLElement, options: InkMapJourneyOptions = {}): (() => void) | undefined {


  const body = root;
  const abort = new AbortController();
  let disposed = false;
  let frameId = 0;
  const query = <T extends Element = HTMLElement>(selector: string): T => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Missing ink map element: ${selector}`);
    return node;
  };
  function listen<K extends keyof WindowEventMap>(target: Window, type: K, listener: (event: WindowEventMap[K]) => void, options: AddEventListenerOptions = {}) {
    target.addEventListener(type, listener, { ...options, signal: abort.signal });
  }
  const canvas = query<HTMLCanvasElement>('#scene');



  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    body.classList.add('no-webgl');
    return;
  }

  body.classList.remove('no-webgl');

  const css = getComputedStyle(root);
  const tok = (name: string) => css.getPropertyValue(name).trim();
  const C = {
    paper: tok('--paper'), surface: tok('--surface'), ink: tok('--ink'), muted: tok('--muted'),
    border: tok('--border'), verdigris: tok('--verdigris'), signal: tok('--signal'),
    brass: tok('--brass'), lantern: tok('--lantern')
  };
  const col = (hex: string) => new THREE.Color(hex);

  const MOTION = { introEnd: 2.8, impact: 1.3, penSpeed: 560, legMin: 3.6, legMax: 6.2, finalPenShare: 0.66, reverse: 1.7, chain: 2.6, hop: 1.6 };
  const CAM = { fov: 35, stopH: 860, compactStopW: 560, followH: 1120, compactFollowW: 760, stopTilt: 0.24, compactStopTilt: 0.2, followTilt: 0.5, compactFollowTilt: 0.42, introTilt: 0.64 };
  const ROUTE = { step: 3, width: 5.4, compactWidth: 6.6, dash: 22, gap: 14, minPx: 2.2 };
  const DROP = { height: 230, radius: 8 };
  const HANG = { scale: 1.4, swell: 0.18, bob: 3, idleSeconds: 8, easing: 9 };
  // Sound stops once less than half of the inline map remains on screen.
  const AUDIBLE_RATIO = 0.5;
  const MARKER = { size: 72, minPx: 44, anchor: 36, splatAnchor: 50, splatR: 46 };
  const STOP_YAW = [0, -0.04, 0.035, -0.03, 0.04];
  const TAN_HALF = Math.tan(THREE.MathUtils.degToRad(CAM.fov / 2));

  const STATIONS = ['Departure', 'Annotate', 'Queue', 'Agent pick', 'Check results', 'End of route'];
  const NEXT_LABELS = ['Set course', 'Next checkpoint', 'Next checkpoint', 'Next checkpoint', 'Full route', 'Replay'];
  const ICON_NEXT = 'M9 6l6 6-6 6';
  const ICON_REPLAY = 'M4 12a8 8 0 1 0 2.4-5.7M4 4.5V8h3.5';

  const STOPS: Point[] = [[0, 0], [1100, 500], [2100, -350], [3300, 300], [4200, -600], [5000, 100]];
  const LEGS: RoutePiece[][] = [
    [['curve', [[170, -130], [380, -70]]], ['zig', [760, 120], 6, 55], ['loop', 70, 1], ['curve', [[900, 380], [1010, 560], [1100, 500]]]],
    [['curve', [[1250, 640], [1420, 560]]], ['loop', 60, -1], ['zig', [1800, -80], 8, 45], ['curve', [[1900, -300], [2020, -430], [2100, -350]]]],
    [['curve', [[2250, -250], [2360, -430], [2520, -380]]], ['zig', [2900, -40], 5, 70], ['loop', 90, 1], ['curve', [[3100, 380], [3220, 200], [3300, 300]]]],
    [['curve', [[3450, 420], [3560, 250]]], ['zig', [3850, -300], 7, 50], ['loop', 65, -1], ['curve', [[4050, -520], [4150, -730], [4200, -600]]]],
    [['curve', [[4350, -500], [4480, -640]]], ['loop', 75, 1], ['zig', [4820, -80], 6, 45], ['curve', [[4920, 130], [5000, 100]]]]
  ];

  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smoothstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeOutBack = (t: number) => { t = clamp(t, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const penEase = (t: number) => 0.18 * t + 0.82 * easeInOut(t);
  const nowSec = () => performance.now() / 1000;

  function mulberry32(a: number) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ——— route geometry ——— */

  function buildRawRoute() {
    const rand = mulberry32(20260925);
    const raw: Point[] = [[STOPS[0][0], STOPS[0][1]]];
    const legEnds = [0];
    const cur = () => raw[raw.length - 1];
    const heading = () => {
      const b = cur();
      const a = raw.length > 1 ? raw[raw.length - 2] : [b[0] - 1, b[1]];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      return [dx / l, dy / l];
    };

    for (const leg of LEGS) {
      for (const piece of leg) {
        const kind = piece[0];

        if (kind === 'curve') {
          const ctrl = [cur(), ...piece[1]].map(p => new THREE.Vector3(p[0], p[1], 0));
          const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
          const n = Math.max(12, Math.ceil(curve.getLength() / 5));
          const pts = curve.getPoints(n);
          for (let i = 1; i < pts.length; i++) raw.push([pts[i].x, pts[i].y]);
        } else if (kind === 'zig') {
          const to = piece[1], count = piece[2], amp = piece[3];
          const a = cur();
          const dx = to[0] - a[0], dy = to[1] - a[1];
          const l = Math.hypot(dx, dy) || 1;
          const nx = -dy / l, ny = dx / l;
          for (let k = 1; k < count; k++) {
            const t = k / count;
            const off = amp * (k % 2 ? 1 : -1) * (0.75 + rand() * 0.5);
            raw.push([a[0] + dx * t + nx * off, a[1] + dy * t + ny * off]);
          }
          raw.push([to[0], to[1]]);
        } else if (kind === 'loop') {
          const r = piece[1], dir = piece[2];
          const p = cur();
          const h = heading();
          const nx = -h[1], ny = h[0];
          const cx = p[0] + nx * r * dir, cy = p[1] + ny * r * dir;
          const a0 = Math.atan2(p[1] - cy, p[0] - cx);
          const steps = 72;
          for (let k = 1; k <= steps; k++) {
            const f = k / steps;
            const a = a0 + dir * f * Math.PI * 2;
            const rr = r * (1 + 0.08 * Math.sin(f * Math.PI));
            raw.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
          }
        }
      }
      legEnds.push(raw.length - 1);
    }

    const cum = new Float64Array(raw.length);
    for (let i = 1; i < raw.length; i++) cum[i] = cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]);
    return { raw, stopS: legEnds.map(i => cum[i]), total: cum[raw.length - 1] };
  }

  function resample(pts: Point[], step: number) {
    const out = [[pts[0][0], pts[0][1]]];
    let need = step;
    for (let i = 1; i < pts.length; i++) {
      let ax = pts[i - 1][0], ay = pts[i - 1][1];
      const bx = pts[i][0], by = pts[i][1];
      let segLen = Math.hypot(bx - ax, by - ay);
      while (segLen >= need) {
        const t = need / segLen;
        ax += (bx - ax) * t;
        ay += (by - ay) * t;
        out.push([ax, ay]);
        segLen -= need;
        need = step;
      }
      need -= segLen;
    }
    const last = pts[pts.length - 1];
    const tail = out[out.length - 1];
    if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > 0.01) out.push([last[0], last[1]]);
    return out;
  }

  function smoothArr(arr: Float32Array, w: number) {
    const n = arr.length, out = new Float32Array(n), pre = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + arr[i];
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - w), b = Math.min(n - 1, i + w);
      out[i] = (pre[b + 1] - pre[a]) / (b - a + 1);
    }
    return out;
  }

  const built = buildRawRoute();
  const S = built.stopS;
  const TOTAL = built.total;
  const samples = resample(built.raw, ROUTE.step);
  const N = samples.length;
  const PX = new Float32Array(N), PY = new Float32Array(N);
  samples.forEach((p, i) => { PX[i] = p[0]; PY[i] = p[1]; });

  const CAMX = smoothArr(PX, 90), CAMY = smoothArr(PY, 90);
  const HX = smoothArr(PX, 220), HY = smoothArr(PY, 220);
  const HEAD = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.max(0, i - 50), b = Math.min(N - 1, i + 50);
    HEAD[i] = Math.atan2(HY[b] - HY[a], HX[b] - HX[a]);
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < N; i++) {
    minX = Math.min(minX, PX[i]); maxX = Math.max(maxX, PX[i]);
    minY = Math.min(minY, PY[i]); maxY = Math.max(maxY, PY[i]);
  }
  const BOUNDS = { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, spanX: maxX - minX + 220, spanY: maxY - minY + 220 };

  function sampleIndex(s: number): [number, number] {
    s = clamp(s, 0, TOTAL);
    let i = Math.floor(s / ROUTE.step);
    if (i >= N - 1) i = N - 2;
    const span = i === N - 2 ? TOTAL - i * ROUTE.step : ROUTE.step;
    return [i, span > 0 ? clamp((s - i * ROUTE.step) / span, 0, 1) : 0];
  }
  function sampleArr(arr: Float32Array, s: number) {
    const [i, t] = sampleIndex(s);
    return arr[i] + (arr[i + 1] - arr[i]) * t;
  }
  const pointAt = (s: number) => [sampleArr(PX, s), sampleArr(PY, s)];

  const LEG_DUR: number[] = [];
  for (let L = 0; L < 5; L++) {
    const d = clamp((S[L + 1] - S[L]) / MOTION.penSpeed, MOTION.legMin, MOTION.legMax);
    LEG_DUR.push(L === 4 ? d / MOTION.finalPenShare : d);
  }

  /* ——— scene ——— */

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAM.fov, 1, 1, 50000);
  const projCam = new THREE.PerspectiveCamera(CAM.fov, 1, 1, 50000);
  renderer.setClearColor(col(C.paper), 1);

  const NOISE_GLSL = `
    float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
      return v;
    }
  `;

  const paperMat = new THREE.ShaderMaterial({
    extensions: { derivatives: true },
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uPaper: { value: col(C.paper) },
      uGrid: { value: col(C.border) },
      uInk: { value: col(C.ink) },
      uContour: { value: col(C.verdigris) },
      uMuted: { value: col(C.muted) },
      uSplat: { value: new THREE.Vector4(0, 0, 0, 0) },
      uDrop: { value: new THREE.Vector4(0, 0, 0, 0) },
      uRes: { value: new THREE.Vector2(1, 1) }
    },
    vertexShader: `
      varying vec2 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xy;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      uniform vec3 uPaper, uGrid, uInk, uContour, uMuted;
      uniform vec4 uSplat, uDrop;
      uniform vec2 uRes;
      varying vec2 vWorld;
      ${NOISE_GLSL}

      float gridLine(float coord, float spacing) {
        float c = coord / spacing;
        float fw = fwidth(c);
        float d = abs(fract(c + 0.5) - 0.5);
        float line = 1.0 - smoothstep(0.0, fw * 1.2, d);
        return line * (1.0 - smoothstep(0.08, 0.25, fw));
      }

      void main() {
        vec2 p = vWorld;
        vec3 col = uPaper;

        float mottle = fbm(p * 0.0016 + 3.1);
        col *= 0.975 + 0.05 * mottle;

        vec2 gp = mod(p, 640.0);
        float grain = noise(gp * 0.85) * 0.6 + noise(gp * 2.3) * 0.4;
        col *= 0.985 + 0.03 * grain;
        float fib = noise(vec2(gp.x * 0.03, gp.y * 0.45));
        col *= 1.0 - 0.014 * smoothstep(0.6, 0.95, fib);

        float v = fbm(p * 0.00075 + vec2(4.0, 1.7)) * 9.0;
        float fwv = fwidth(v);
        float dv = abs(fract(v + 0.5) - 0.5);
        float contour = (1.0 - smoothstep(0.0, fwv * 1.4, dv)) * (1.0 - smoothstep(0.05, 0.2, fwv));
        col = mix(col, uContour, contour * 0.22);

        float minor = max(gridLine(p.x, 100.0), gridLine(p.y, 100.0));
        float major = max(gridLine(p.x, 500.0), gridLine(p.y, 500.0));
        col = mix(col, uGrid, minor * 0.28);
        col = mix(col, uGrid, major * 0.55);

        if (uDrop.w > 0.0) {
          float r = 9.0 + uDrop.z * 0.07;
          float d = length(p - uDrop.xy - vec2(uDrop.z * 0.12, -uDrop.z * 0.18));
          float sh = 1.0 - smoothstep(r * 0.35, r, d);
          col = mix(col, uMuted, sh * uDrop.w * (0.55 - 0.35 * clamp(uDrop.z / 230.0, 0.0, 1.0)));
        }

        if (uSplat.z > 0.0) {
          vec2 q = p - uSplat.xy;
          float d = length(q);
          vec2 dir = q / max(d, 0.001);
          float R = uSplat.z;
          float wob = noise(dir * 2.5 + 5.0) * 0.18 + noise(dir * 7.0 + 11.0) * 0.08;
          float edgeR = R * (0.84 + wob);
          float body = 1.0 - smoothstep(edgeR - 1.5, edgeR + 0.5, d);

          float sat = 0.0;
          for (int i = 0; i < 9; i++) {
            float fi = float(i);
            float a = hash(vec2(fi, 3.7)) * 6.2831;
            float dist = R * (1.25 + hash(vec2(fi, 8.1)) * 1.1) * (0.6 + 0.4 * uSplat.w);
            float rr = R * (0.04 + hash(vec2(fi, 1.9)) * 0.11);
            vec2 c = vec2(cos(a), sin(a)) * dist;
            sat = max(sat, 1.0 - smoothstep(rr - 1.0, rr + 0.5, length(q - c)));
          }

          float halo = (1.0 - smoothstep(edgeR, edgeR + R * 0.4 * uSplat.w + 2.0, d)) * (0.5 + 0.5 * fbm(p * 0.08));
          float ring = smoothstep(edgeR - 6.0, edgeR - 1.0, d) * body;
          col = mix(col, uMuted, halo * 0.35 * uSplat.w * (1.0 - body));
          col = mix(col, uInk, max(body * (0.9 + 0.1 * ring), sat) * 0.97);
        }

        vec2 sc = gl_FragCoord.xy / uRes - 0.5;
        float vig = smoothstep(0.35, 0.85, length(sc * vec2(1.0, 0.9)));
        col = mix(col, uGrid, vig * 0.18);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), paperMat);
  paper.position.set(2500, 0, 0);
  paper.renderOrder = 0;
  scene.add(paper);

  function buildRibbon() {
    const pos = new Float32Array(N * 2 * 3);
    const nrm = new Float32Array(N * 2 * 2);
    const side = new Float32Array(N * 2);
    const dist = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const a = Math.max(i - 1, 0), b = Math.min(i + 1, N - 1);
      const tx = PX[b] - PX[a], ty = PY[b] - PY[a];
      const l = Math.hypot(tx, ty) || 1;
      const nx = -ty / l, ny = tx / l;
      const d = i === N - 1 ? TOTAL : i * ROUTE.step;
      for (let k = 0; k < 2; k++) {
        const v = i * 2 + k;
        pos[v * 3] = PX[i]; pos[v * 3 + 1] = PY[i]; pos[v * 3 + 2] = 0.4;
        nrm[v * 2] = nx; nrm[v * 2 + 1] = ny;
        side[v] = k === 0 ? -1 : 1;
        dist[v] = d;
      }
    }
    const idx = [];
    for (let i = 0; i < N - 1; i++) {
      const v = i * 2;
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aNormal', new THREE.BufferAttribute(nrm, 2));
    g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
    g.setAttribute('aDist', new THREE.BufferAttribute(dist, 1));
    g.setIndex(idx);
    return g;
  }

  const N1_GLSL = `
    float hash1(float n) { return fract(sin(n) * 43758.5453); }
    float n1(float x) { float i = floor(x), f = fract(x); return mix(hash1(i), hash1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
  `;

  const routeMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uInk: { value: col(C.ink) },
      uProgress: { value: 0 },
      uWidth: { value: ROUTE.width },
      uDash: { value: ROUTE.dash },
      uGap: { value: ROUTE.gap },
      uFadeStart: { value: 1e9 },
      uFadeAlpha: { value: 1 }
    },
    vertexShader: `
      attribute vec2 aNormal;
      attribute float aSide;
      attribute float aDist;
      uniform float uWidth;
      varying float vDist;
      varying float vAcross;
      varying float vHalfW;
      ${N1_GLSL}
      void main() {
        float w = uWidth * (0.82 + 0.36 * n1(aDist * 0.018));
        vHalfW = w * 0.5;
        vDist = aDist;
        vAcross = aSide * (vHalfW + 1.0);
        vec3 p = position + vec3(aNormal * vAcross, 0.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uInk;
      uniform float uProgress, uDash, uGap, uFadeStart, uFadeAlpha;
      varying float vDist;
      varying float vAcross;
      varying float vHalfW;
      ${N1_GLSL}
      void main() {
        if (vDist > uProgress) discard;
        float m = mod(vDist, uDash + uGap);
        if (m > uDash) discard;
        float hw = vHalfW;
        float e = min(min(m, uDash - m), uProgress - vDist);
        float d = e < hw ? length(vec2(hw - e, vAcross)) : abs(vAcross);
        float rough = n1(vDist * 0.6 + sign(vAcross) * 37.0) * 0.9;
        float a = 1.0 - smoothstep(hw - 1.0 - rough, hw + 0.3 - rough * 0.5, d);
        float fade = vDist > uFadeStart ? uFadeAlpha : 1.0;
        float alpha = a * fade * (0.88 + 0.12 * n1(vDist * 0.09));
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uInk, alpha);
      }
    `
  });
  const route = new THREE.Mesh(buildRibbon(), routeMat);
  route.renderOrder = 2;
  route.frustumCulled = false;
  scene.add(route);

  /* ink bead at the drawing tip, so the leading edge of the route reads while it moves */
  const bead = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({ color: col(C.ink), side: THREE.DoubleSide, depthTest: false, depthWrite: false })
  );
  bead.renderOrder = 2;
  bead.visible = false;
  scene.add(bead);

  const dropMat = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: { uInk: { value: col(C.ink) }, uLantern: { value: col(C.lantern) } },
    vertexShader: `
      varying vec3 vN;
      void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform vec3 uInk, uLantern;
      varying vec3 vN;
      void main() {
        float l = clamp(dot(normalize(vN), normalize(vec3(-0.4, 0.5, 0.8))), 0.0, 1.0);
        vec3 c = mix(uInk, uLantern, pow(l, 24.0) * 0.8);
        gl_FragColor = vec4(c, 1.0);
      }
    `
  });
  const drop = new THREE.Mesh(new THREE.SphereGeometry(8, 24, 16), dropMat);
  drop.renderOrder = 14;
  drop.visible = false;
  scene.add(drop);

  /* chart marginalia and checkpoint markers (drawn once fonts are ready) */
  const markers: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; on: boolean; t0: number }[] = [];
  const MONO = '"IBM Plex Mono", SFMono-Regular, Consolas, monospace';

  function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    if (!g) throw new Error('Canvas texture context unavailable');
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  function flatPlane(tex: THREE.Texture, w: number, h: number, order: number, opacity?: number) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, opacity: opacity === undefined ? 1 : opacity })
    );
    m.renderOrder = order;
    return m;
  }

  function drawMarker(g: CanvasRenderingContext2D, label: string, isEnd: boolean) {
    g.translate(128, 128);
    g.lineCap = 'round';
    g.strokeStyle = C.ink;
    g.lineWidth = 5;
    for (let k = 0; k < 4; k++) {
      g.save();
      g.rotate(k * Math.PI / 2);
      g.beginPath(); g.moveTo(0, -122); g.lineTo(0, -100); g.stroke();
      g.restore();
    }
    g.beginPath(); g.arc(0, 0, 86, 0, Math.PI * 2);
    g.fillStyle = C.surface; g.fill();
    g.lineWidth = 10; g.strokeStyle = C.signal; g.stroke();
    if (isEnd) {
      g.beginPath(); g.arc(0, 0, 58, 0, Math.PI * 2);
      g.lineWidth = 5; g.strokeStyle = C.ink; g.stroke();
      g.beginPath(); g.arc(0, 0, 26, 0, Math.PI * 2);
      g.fillStyle = C.ink; g.fill();
    } else {
      g.fillStyle = C.ink;
      g.font = '500 76px ' + MONO;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(label, 0, 6);
    }
  }

  function drawCompass(g: CanvasRenderingContext2D) {
    g.translate(256, 256);
    g.strokeStyle = C.ink;
    g.lineCap = 'round';
    g.globalAlpha = 0.75;
    g.lineWidth = 2;
    [200, 176, 110].forEach(r => { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); });
    for (let k = 0; k < 72; k++) {
      const a = k / 72 * Math.PI * 2;
      const len = k % 18 === 0 ? 30 : (k % 6 === 0 ? 18 : 9);
      g.beginPath();
      g.moveTo(Math.sin(a) * 200, -Math.cos(a) * 200);
      g.lineTo(Math.sin(a) * (200 - len), -Math.cos(a) * (200 - len));
      g.stroke();
    }
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2;
      const len = k % 2 === 0 ? 150 : 90;
      const wd = k % 2 === 0 ? 20 : 12;
      for (let s = -1; s <= 1; s += 2) {
        g.beginPath();
        g.moveTo(Math.sin(a) * len, -Math.cos(a) * len);
        g.lineTo(Math.sin(a + s * Math.PI / 2) * wd, -Math.cos(a + s * Math.PI / 2) * wd);
        g.lineTo(0, 0);
        g.closePath();
        if (s < 0) { g.fillStyle = k % 2 === 0 ? C.ink : C.verdigris; g.fill(); }
        else { g.lineWidth = 2; g.stroke(); }
      }
    }
    g.globalAlpha = 0.9;
    g.fillStyle = C.ink;
    g.font = '500 28px ' + MONO;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    ([['N', 0], ['E', 1], ['S', 2], ['W', 3]] as [string, number][]).forEach(([l, k]) => {
      const a = k * Math.PI / 2;
      g.fillText(l, Math.sin(a) * 228, -Math.cos(a) * 228);
    });
  }

  function drawLabel(g: CanvasRenderingContext2D, w: number, h: number, text: string, align?: CanvasTextAlign) {
    g.fillStyle = C.ink;
    g.globalAlpha = 0.72;
    g.font = '500 34px ' + MONO;
    g.textBaseline = 'middle';
    g.textAlign = align || 'center';
    g.fillText(text, align === 'left' ? 8 : w / 2, h / 2);
  }

  function buildDecor() {
    const compass = flatPlane(canvasTexture(512, 512, drawCompass), 460, 460, 1, 0.55);
    compass.position.set(2650, 860, 0.1);
    compass.rotation.z = 0.12;
    scene.add(compass);

    const title = flatPlane(canvasTexture(1024, 128, (g, w, h) => drawLabel(g, w, h, 'WAYPOINT · ROUTE BRIEFING · SHEET 01', 'left')), 512, 64, 1, 0.9);
    title.position.set(116, -330, 0.1);
    scene.add(title);

    for (let i = 0; i < 5; i++) {
      const a = STOPS[i], b = STOPS[i + 1];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const ang = Math.atan2(dy, dx);
      const brg = Math.round(((90 - ang * 180 / Math.PI) % 360 + 360) % 360);
      const text = 'LEG ' + String(i + 1).padStart(2, '0') + ' · BRG ' + String(brg).padStart(3, '0') + '°';
      const lbl = flatPlane(canvasTexture(640, 80, (g, w, h) => drawLabel(g, w, h, text)), 320, 40, 1, 0.9);
      const l = Math.hypot(dx, dy);
      lbl.position.set((a[0] + b[0]) / 2 + (dy / l) * 250, (a[1] + b[1]) / 2 - (dx / l) * 250, 0.1);
      lbl.rotation.z = ang;
      scene.add(lbl);
    }

    for (let i = 1; i <= 5; i++) {
      const tex = canvasTexture(256, 256, g => drawMarker(g, String(i).padStart(2, '0'), i === 5));
      const m = flatPlane(tex, MARKER.size, MARKER.size, 3, 1);
      m.position.set(STOPS[i][0], STOPS[i][1], 0.8);
      m.visible = false;
      scene.add(m);
      markers[i] = { mesh: m, on: false, t0: 0 };
    }
  }

  const fontWait = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('500 40px "IBM Plex Mono"'), document.fonts.ready]).catch(() => null)
    : Promise.resolve();
  let fontTimeout = 0;
  const timeout = new Promise(resolve => { fontTimeout = window.setTimeout(resolve, 1800); });
  Promise.race([fontWait, timeout]).then(() => {
    window.clearTimeout(fontTimeout);
    if (!disposed) buildDecor();
  });

  /* ——— camera ——— */

  let VW = innerWidth, VH = innerHeight;
  const isCompact = () => VW / VH < 0.9;

  function frameAt(ax: number, ay: number, fx: number, fy: number, h: number, tilt: number, yaw: number): CameraFrame {
    const w = h * (VW / VH);
    const Rx = Math.cos(yaw), Ry = Math.sin(yaw);
    const Ux = -Math.sin(yaw), Uy = Math.cos(yaw);
    const ox = (fx - 0.5) * w, oy = (0.5 - fy) * h;
    return { tx: ax - Rx * ox - Ux * oy, ty: ay - Ry * ox - Uy * oy, h, tilt, yaw };
  }

  function stopCam(i: number) {
    const compact = isCompact();
    const h = compact ? CAM.compactStopW / (VW / VH) : CAM.stopH;
    return frameAt(STOPS[i][0], STOPS[i][1], compact ? 0.5 : 0.32, compact ? 0.27 : 0.52, h, compact ? CAM.compactStopTilt : CAM.stopTilt, STOP_YAW[i]);
  }

  function overviewCam() {
    const aspect = VW / VH;
    if (isCompact()) {
      const h = Math.max(BOUNDS.spanX / 0.52, BOUNDS.spanY / (0.9 * aspect));
      return frameAt(BOUNDS.cx, BOUNDS.cy, 0.5, 0.33, h, 0.1, -Math.PI / 2);
    }
    const h = Math.max(BOUNDS.spanY / 0.62, BOUNDS.spanX / (0.54 * aspect));
    return frameAt(BOUNDS.cx, BOUNDS.cy, 0.66, 0.5, h, 0.1, 0);
  }

  function introCam() {
    const compact = isCompact();
    return { tx: 0, ty: 90, h: compact ? 520 / (VW / VH) : 560, tilt: CAM.introTilt, yaw: -0.12 };
  }

  function followCam(s: number, q: number) {
    const compact = isCompact();
    const la = s + (compact ? 90 : 170);
    const hd = clamp(sampleArr(HEAD, s), -1.1, 1.1);
    const base = compact ? CAM.compactFollowW / (VW / VH) : CAM.followH;
    return {
      tx: sampleArr(CAMX, la),
      ty: sampleArr(CAMY, la),
      h: base * (1 + 0.16 * Math.sin(Math.PI * q)),
      tilt: compact ? CAM.compactFollowTilt : CAM.followTilt,
      yaw: hd * 0.3
    };
  }

  function mixState(a: CameraFrame, b: CameraFrame, t: number) {
    return {
      tx: lerp(a.tx, b.tx, t),
      ty: lerp(a.ty, b.ty, t),
      h: Math.exp(lerp(Math.log(a.h), Math.log(b.h), t)),
      tilt: lerp(a.tilt, b.tilt, t),
      yaw: lerp(a.yaw, b.yaw, t)
    };
  }

  function legS(L: number, q: number) {
    const qq = L === 4 ? Math.min(1, q / MOTION.finalPenShare) : q;
    return lerp(S[L], S[L + 1], penEase(qq));
  }

  function legCam(L: number, q: number) {
    const A = stopCam(L);
    const B = L === 4 ? overviewCam() : stopCam(L + 1);
    const F = followCam(legS(L, q), q);
    const wF = smoothstep(0, 0.24, q);
    const wB = smoothstep(L === 4 ? 0.58 : 0.74, 1, q);
    return mixState(mixState(A, F, wF), B, wB);
  }

  function addDrift(st: CameraFrame, t: number) {
    const k = st.h / CAM.stopH;
    st.tx += (Math.sin(t * 0.31) * 3.2 + Math.sin(t * 0.83 + 1.3) * 1.4) * k;
    st.ty += (Math.cos(t * 0.27) * 3.0 + Math.sin(t * 0.61 + 0.4) * 1.2) * k;
    st.yaw += Math.sin(t * 0.19) * 0.004;
  }

  function applyCam(cam: THREE.PerspectiveCamera, st: CameraFrame) {
    const d = st.h / (2 * TAN_HALF);
    const Ux = -Math.sin(st.yaw), Uy = Math.cos(st.yaw);
    const back = d * Math.sin(st.tilt);
    cam.position.set(st.tx - Ux * back, st.ty - Uy * back, d * Math.cos(st.tilt));
    cam.up.set(Ux, Uy, 0);
    cam.lookAt(st.tx, st.ty, 0);
    cam.near = Math.max(1, d * 0.02);
    cam.far = d * 8 + 2000;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  const tmpV = new THREE.Vector3();
  function projectWith(cam: THREE.PerspectiveCamera, x: number, y: number) {
    tmpV.set(x, y, 0).project(cam);
    return { x: (tmpV.x + 1) / 2 * VW, y: (1 - tmpV.y) / 2 * VH };
  }

  /* ——— DOM ——— */

  const cards = [0, 1, 2, 3, 4, 5].map(i => query('#card-' + i));
  const leader = query('#leader');
  const leaderLine = query<SVGLineElement>('#leader-line');
  const topbar = query('.topbar');
  const controls = query('.controls');
  const nextBtn = query('#next');
  const nextLabel = query('#next-label');
  const nextPath = query('#next-path');
  const backBtn = query('#back');
  const hint = query('#hint');
  const startHint = query('#start-hint');
  const announcer = query('#announce');
  const railBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('.rail-btn'));
  const mq = matchMedia('(prefers-reduced-motion: reduce)');

  cards.forEach(card => {
    card.setAttribute('inert', '');
    card.setAttribute('aria-hidden', 'true');
    Array.from(card.querySelector<HTMLElement>('.card-scroll')!.children).forEach((el, i) => (el as HTMLElement).style.setProperty('--i', String(i)));
  });

  /* ——— journey state ——— */

  let mode: 'poised' | 'intro' | 'leg' | 'idle' = 'intro';
  let station = 0;
  let leg: { L: number; dir: number; t0: number; dur: number } | null = null;
  let pendingTarget: number | null = null;
  let introT0 = nowSec();
  let poisedT0 = introT0;
  let hungDrop = false;
  let wink = 0;
  let winkHover = false;
  let winkPress = false;
  let lastFrameT = 0;
  let progress = 0;
  let fadeT0 = -1;
  let reduceMotion = mq.matches;
  let visibleCard = -1;
  let leaderStart: Point | null = null;
  let needsResize = true;
  let requireQuiet = false;
  let lastWheelT = 0;
  let wheelAcc = 0;
  let inView = true;
  let mostlyInView = true;
  let pausedAt: number | null = null;
  let dripCued = false;
  let blobCued = false;
  let penLevel = 0;
  let penSample: { t: number; progress: number } | null = null;

  const ownsViewport = () => !options.inline || Math.abs(root.getBoundingClientRect().top) <= 2;
  const canScrollOnward = () => Boolean(options.inline && options.onContinue && mode === 'idle' && station === 5);

  function placeCard(i: number) {
    const card = cards[i];
    const scroller = card.querySelector<HTMLElement>('.card-scroll')!;
    const origin = options.inline ? root.getBoundingClientRect().top : 0;
    const topLimit = topbar.getBoundingClientRect().bottom - origin + 12;
    const bottomLimit = controls.getBoundingClientRect().top - origin - 12;
    scroller.style.maxHeight = Math.max(160, bottomLimit - topLimit) + 'px';

    const w = card.offsetWidth, h = card.offsetHeight;
    const compact = isCompact();
    let left, top;

    if (i === 5) {
      card.removeAttribute('data-tail');
      left = compact ? (VW - w) / 2 : Math.max(24, VW * 0.06);
      top = compact ? bottomLimit - h : clamp((VH - h) / 2, topLimit, Math.max(topLimit, bottomLimit - h));
      leaderStart = null;
    } else {
      applyCam(projCam, stopCam(i));
      const a = projectWith(projCam, STOPS[i][0], STOPS[i][1]);
      if (!compact) {
        left = Math.min(a.x + 64, VW - w - 24);
        top = clamp(a.y - h * 0.42, topLimit, Math.max(topLimit, bottomLimit - h));
        const tail = clamp(a.y - top, 24, h - 24);
        card.dataset.tail = 'left';
        card.style.setProperty('--tail', tail + 'px');
        leaderStart = [left - 9, top + tail];
      } else {
        left = clamp((VW - w) / 2, 16, Math.max(16, VW - w - 16));
        top = clamp(a.y + 56, topLimit, Math.max(topLimit, bottomLimit - h));
        const tail = clamp(a.x - left, 24, w - 24);
        card.dataset.tail = 'top';
        card.style.setProperty('--tail', tail + 'px');
        leaderStart = [left + tail, top - 9];
      }
    }
    card.style.left = Math.round(left) + 'px';
    card.style.top = Math.round(top) + 'px';
  }

  function showCard(i: number) {
    hideCards();
    const card = cards[i];
    placeCard(i);
    card.removeAttribute('inert');
    card.removeAttribute('aria-hidden');
    card.classList.add('is-visible');
    visibleCard = i;
    leader.classList.toggle('is-visible', i < 5);
  }

  function hideCards() {
    cards.forEach(card => {
      card.classList.remove('is-visible');
      card.setAttribute('inert', '');
      card.setAttribute('aria-hidden', 'true');
    });
    visibleCard = -1;
    leaderStart = null;
    leader.classList.remove('is-visible');
  }

  function updateUI() {
    const compact = isCompact();
    const idle = mode === 'idle';

    nextBtn.setAttribute('aria-disabled', mode === 'leg' || mode === 'poised' ? 'true' : 'false');
    const atEnd = idle && station === 5;
    const continuationLabel = options.inline ? 'More details' : 'Make your own mark';
    const idleLabel = atEnd && options.onContinue ? continuationLabel : NEXT_LABELS[station];
    nextLabel.textContent = mode === 'intro' ? 'Skip intro' : mode === 'leg' ? 'Charting…' : idleLabel;
    nextPath.setAttribute('d', atEnd && !options.onContinue ? ICON_REPLAY : ICON_NEXT);
    backBtn.setAttribute('aria-disabled', idle && station > 0 ? 'false' : 'true');

    if (mode === 'intro') hint.textContent = 'The ink is landing…';
    else if (mode === 'leg') hint.textContent = 'Charting the route…';
    else if (station === 5) hint.textContent = options.onContinue ? 'Scroll onward to discover Waypoint.' : 'Replay draws the route again from the first mark.';
    else hint.textContent = 'Scroll or press ↓ to continue · ↑ to go back';

    startHint.textContent = compact
      ? 'Swipe up or tap Set course to follow the ink.'
      : 'Scroll, press ↓ or select Set course to follow the ink.';

    railBtns.forEach(btn => {
      const k = Number(btn.dataset.go);
      let state = 'upcoming';
      if (idle && station === k) state = 'current';
      else if (station > k || (station === k && !idle)) state = 'done';
      btn.dataset.state = state;
      const name = STATIONS[k];
      const suffix = state === 'current' ? ', current' : state === 'done' ? ', visited' : '';
      btn.setAttribute('aria-label', 'Checkpoint ' + k + ': ' + name + suffix);
      if (state === 'current') btn.setAttribute('aria-current', 'step');
      else btn.removeAttribute('aria-current');
    });
  }

  function announce(i: number) {
    if (i === 0) announcer.textContent = 'Departure. Chart the route before the build.';
    else if (i === 5) announcer.textContent = 'End of route. The route, charted.';
    else announcer.textContent = 'Checkpoint ' + i + ' of 4: ' + STATIONS[i] + '. ' + cards[i].querySelector('h2')!.textContent;
  }

  function setPen(level: number) {
    if (level === penLevel) return;
    penLevel = level;
    options.sound?.setPen(level);
  }

  function resetMarkers() {
    markers.forEach(m => { if (m) { m.on = false; m.mesh.visible = false; } });
  }

  function startIntro() {
    hideCards();
    leg = null;
    pendingTarget = null;
    station = 0;
    progress = 0;
    routeMat.uniforms.uFadeStart.value = 1e9;
    resetMarkers();
    introT0 = nowSec() - (reduceMotion ? MOTION.introEnd : 0);
    hungDrop = false;
    dripCued = blobCued = reduceMotion;
    mode = 'intro';
    updateUI();
  }

  function enterPoised() {
    hideCards();
    mode = 'poised';
    poisedT0 = nowSec();
    root.classList.add('is-poised');
    updateUI();
  }

  function beginJourney(withSound: boolean) {
    if (mode !== 'poised') return;
    options.onBegin?.(withSound);
    root.classList.remove('is-poised');
    startIntro();
    hungDrop = true;
  }

  function finishIntro() {
    introT0 = Math.min(introT0, nowSec() - MOTION.introEnd);
  }

  function startLeg(from: number, to: number, speed: number) {
    const dir = to > from ? 1 : -1;
    const L = Math.min(from, to);
    hideCards();

    if (reduceMotion) {
      const prev = progress;
      progress = S[to];
      if (dir > 0) {
        routeMat.uniforms.uFadeStart.value = prev;
        routeMat.uniforms.uFadeAlpha.value = 0;
        fadeT0 = nowSec();
      }
      // Reduced motion changes checkpoints without camera travel or canvas flashes.
      arriveAt(to);
      return;
    }

    leg = { L, dir, t0: nowSec(), dur: LEG_DUR[L] / ((speed || 1) * (dir < 0 ? MOTION.reverse : 1)) };
    mode = 'leg';
    updateUI();
  }

  function arriveAt(to: number) {
    station = to;
    leg = null;

    if (pendingTarget !== null && pendingTarget !== to) {
      const remaining = Math.abs(pendingTarget - to);
      startLeg(to, to + Math.sign(pendingTarget - to), remaining > 1 ? MOTION.chain : MOTION.hop);
      return;
    }

    pendingTarget = null;
    mode = 'idle';
    requireQuiet = true;
    if (to === 5) options.sound?.cue('complete');
    else if (to > 0) options.sound?.cue('checkpoint');
    options.sound?.cue('card');
    showCard(to);
    updateUI();
    announce(to);
  }

  function goNext() {
    if (mode === 'intro') { finishIntro(); return; }
    if (mode !== 'idle') return;
    if (station === 5) {
      if (options.onContinue) options.onContinue();
      else startIntro();
      return;
    }
    startLeg(station, station + 1, 1);
  }

  function goPrev() {
    if (mode !== 'idle' || station === 0) return;
    startLeg(station, station - 1, 1);
  }

  function goTo(k: number) {
    if (mode === 'intro') { finishIntro(); return; }
    if (mode !== 'idle' || k === station) return;
    pendingTarget = k;
    const hops = Math.abs(k - station);
    startLeg(station, station + Math.sign(k - station), hops > 1 ? MOTION.chain : 1);
  }

  /* ——— input ——— */

  function scrollerCanScroll(target: EventTarget | null, dy: number) {
    const sc = target instanceof Element ? target.closest('.card-scroll') : null;
    if (!sc || sc.scrollHeight <= sc.clientHeight + 1) return false;
    return dy > 0 ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1 : sc.scrollTop > 0;
  }

  nextBtn.addEventListener('click', () => { if (nextBtn.getAttribute('aria-disabled') !== 'true') goNext(); }, { signal: abort.signal });
  const pressTarget = root.querySelector('[data-begin]');
  pressTarget?.addEventListener('click', () => beginJourney(true), { signal: abort.signal });
  pressTarget?.addEventListener('pointerenter', () => { winkHover = true; }, { signal: abort.signal });
  pressTarget?.addEventListener('pointerleave', () => { winkHover = false; }, { signal: abort.signal });
  pressTarget?.addEventListener('pointerdown', () => { winkPress = true; }, { signal: abort.signal });
  listen(window, 'pointerup', () => { winkPress = false; });
  listen(window, 'pointercancel', () => { winkPress = false; });
  root.querySelector('[data-begin-silent]')?.addEventListener('click', () => beginJourney(false), { signal: abort.signal });
  root.querySelector('[data-replay]')?.addEventListener('click', startIntro, { signal: abort.signal });
  backBtn.addEventListener('click', () => { if (backBtn.getAttribute('aria-disabled') !== 'true') goPrev(); }, { signal: abort.signal });
  railBtns.forEach(btn => btn.addEventListener('click', () => goTo(Number(btn.dataset.go)), { signal: abort.signal }));

  listen(window, 'wheel', e => {
    if (!ownsViewport() || e.ctrlKey) return;
    const t = nowSec();
    const gap = t - lastWheelT;
    lastWheelT = t;
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * VH : e.deltaY;
    if (mode === 'poised') {
      e.preventDefault();
      if (dy !== 0) { requireQuiet = true; beginJourney(false); }
      return;
    }
    if (scrollerCanScroll(e.target, dy)) return;
    if (canScrollOnward() && dy > 0 && (!requireQuiet || gap >= 0.22)) {
      requireQuiet = false;
      return;
    }
    e.preventDefault();

    if (mode === 'intro') {
      if (!requireQuiet) { finishIntro(); requireQuiet = true; }
      return;
    }
    if (mode !== 'idle') { wheelAcc = 0; return; }
    if (requireQuiet) {
      if (gap < 0.22) return;
      requireQuiet = false;
    }
    if (gap > 0.3) wheelAcc = 0;
    wheelAcc += dy;
    if (wheelAcc > 45) { wheelAcc = 0; requireQuiet = true; goNext(); }
    else if (wheelAcc < -45) { wheelAcc = 0; requireQuiet = true; goPrev(); }
  }, { passive: false });

  let touch: { x: number; y: number; target: EventTarget | null } | null = null;
  listen(window, 'touchstart', e => {
    if (!ownsViewport()) { touch = null; return; }
    if (e.touches.length !== 1) { touch = null; return; }
    const t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY, target: e.target };
  }, { passive: true });
  listen(window, 'touchmove', e => {
    if (!touch || e.touches.length !== 1) return;
    const sc = touch.target instanceof Element ? touch.target.closest('.card-scroll') : null;
    if (sc && sc.scrollHeight > sc.clientHeight + 1) return;
    if (canScrollOnward() && e.touches[0].clientY < touch.y) return;
    e.preventDefault();
  }, { passive: false });
  listen(window, 'touchend', e => {
    if (!touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    const start = touch;
    touch = null;
    if (!ownsViewport() || (canScrollOnward() && dy < 0)) return;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 44) return;
    if (mode === 'poised') { beginJourney(false); return; }
    if (Math.abs(dy) >= Math.abs(dx)) {
      if (scrollerCanScroll(start.target, -dy)) return;
      if (dy < 0) goNext(); else goPrev();
    } else if (dx < 0) goNext(); else goPrev();
  }, { passive: true });

  listen(window, 'keydown', e => {
    if (!ownsViewport()) return;
    const focusOutsideMap = e.target instanceof Element && e.target !== document.body && e.target !== document.documentElement && !root.contains(e.target);
    if (options.inline && focusOutsideMap) return;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
    const onButton = e.target instanceof Element && e.target.closest('button');
    const editingText = e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]');
    if (editingText) return;
    const k = e.key;
    const forward = k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !onButton);
    const backward = k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp';
    if (!forward && !backward) return;
    if (mode === 'poised') {
      e.preventDefault();
      beginJourney(false);
      return;
    }
    const dy = forward ? 1 : -1;
    if ((k === 'ArrowDown' || k === 'ArrowUp' || k === 'PageDown' || k === 'PageUp' || k === ' ') && scrollerCanScroll(e.target, dy)) return;
    e.preventDefault();
    if (forward) goNext(); else goPrev();
  });

  listen(window, 'resize', () => { needsResize = true; });
  const onMotionPref = () => { reduceMotion = mq.matches; };
  if (mq.addEventListener) mq.addEventListener('change', onMotionPref); else mq.addListener(onMotionPref);

  function resize() {
    VW = options.inline ? root.clientWidth || innerWidth : innerWidth;
    VH = options.inline ? root.clientHeight || innerHeight : innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, isCompact() ? 1.75 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(VW, VH, false);
    camera.aspect = projCam.aspect = VW / VH;
    paperMat.uniforms.uRes.value.set(VW * dpr, VH * dpr);
    if (visibleCard >= 0) placeCard(visibleCard);
    updateUI();
  }

  /* ——— frame ——— */

  const swelling = () => 1 + HANG.swell * wink;

  function hangingDrop(t: number) {
    const bob = reduceMotion ? 0 : Math.sin(t * 1.7) * HANG.bob;
    return { z: DROP.height + bob, s: HANG.scale * swelling(), stretch: 1 };
  }

  function dropState(ti: number, t: number) {
    if (ti < 0.3) return hungDrop ? hangingDrop(t) : null;
    if (ti >= MOTION.impact) return null;
    const f = (ti - 0.3) / (MOTION.impact - 0.3);
    const grow = easeOutCubic(f * 4);
    const s = hungDrop ? lerp(HANG.scale, 1, grow) * swelling() : grow;
    return { z: DROP.height * (1 - f * f), s, stretch: 1 + 0.9 * f };
  }

  function frame(ms: number) {
    frameId = 0;
    if (disposed || pausedAt !== null) return;
    frameId = requestAnimationFrame(frame);
    if (needsResize) { needsResize = false; resize(); }

    const t = ms / 1000;
    let cam: CameraFrame;
    let ds: { z: number; s: number; stretch: number } | null = null;

    const winkTarget = mode === 'poised' && !reduceMotion && (winkHover || winkPress) ? 1 : 0;
    wink += (winkTarget - wink) * (1 - Math.exp(-clamp(t - lastFrameT, 0, 0.1) * HANG.easing));
    lastFrameT = t;

    if (mode === 'poised') {
      cam = introCam();
      ds = hangingDrop(t);
      if (t - poisedT0 >= HANG.idleSeconds) beginJourney(false);
    } else if (mode === 'intro') {
      const ti = t - introT0;
      cam = mixState(introCam(), stopCam(0), easeInOut((ti - 0.15) / (MOTION.introEnd - 0.15)));
      if (!reduceMotion) ds = dropState(ti, t);
      // A skipped intro jumps past these marks; only cue a mark crossed in real time.
      if (!dripCued && ti >= 0.3) { dripCued = true; if (ti < 0.5) options.sound?.cue('drip'); }
      if (!blobCued && ti >= MOTION.impact) { blobCued = true; if (ti < MOTION.impact + 0.2) options.sound?.cue('blob'); }
      if (ti >= MOTION.introEnd) {
        mode = 'idle';
        station = 0;
        requireQuiet = true;
        options.sound?.cue('card');
        showCard(0);
        updateUI();
        announce(0);
      }
    } else if (mode === 'leg' && leg) {
      const raw = clamp((t - leg.t0) / leg.dur, 0, 1);
      const q = leg.dir > 0 ? raw : 1 - raw;
      progress = legS(leg.L, q);
      cam = legCam(leg.L, q);
      if (leg.dir > 0 && penSample && t > penSample.t) setPen(clamp((progress - penSample.progress) / (t - penSample.t) / MOTION.penSpeed, 0, 1));
      penSample = { t, progress };
      if (raw >= 1) arriveAt(leg.dir > 0 ? leg.L + 1 : leg.L);
    } else {
      cam = station === 5 ? overviewCam() : stopCam(station);
    }
    if (mode !== 'leg') { penSample = null; setPen(0); }

    if (!reduceMotion) addDrift(cam, t);
    applyCam(camera, cam);

    const ppu = VH / cam.h;
    const zoomScale = Math.max(1, MARKER.minPx / (MARKER.size * ppu));

    const impactT = introT0 + MOTION.impact;
    const since = mode === 'poised' ? -1 : t - impactT;
    const splatR = since > 0 ? MARKER.splatR * easeOutCubic(since / 0.65) : 0;
    const bleed = reduceMotion ? 1 : (since > 0 ? easeOutCubic(since / 2.6) : 0);
    paperMat.uniforms.uSplat.value.set(0, 0, splatR, bleed);

    if (ds) {
      drop.visible = true;
      drop.position.set(0, 0, ds.z + 8 * ds.s);
      drop.scale.set(Math.max(ds.s, 0.001), Math.max(ds.s, 0.001), Math.max(ds.s * ds.stretch, 0.001));
      paperMat.uniforms.uDrop.value.set(0, 0, ds.z, ds.s);
    } else {
      drop.visible = false;
      paperMat.uniforms.uDrop.value.w = 0;
    }

    const routeWidth = Math.max(isCompact() ? ROUTE.compactWidth : ROUTE.width, ROUTE.minPx / ppu);
    routeMat.uniforms.uProgress.value = progress;
    routeMat.uniforms.uWidth.value = routeWidth;
    if (fadeT0 >= 0) {
      const f = clamp((t - fadeT0) / 0.3, 0, 1);
      routeMat.uniforms.uFadeAlpha.value = f;
      if (f >= 1) { fadeT0 = -1; routeMat.uniforms.uFadeStart.value = 1e9; routeMat.uniforms.uFadeAlpha.value = 1; }
    }

    const tip = pointAt(progress);
    bead.visible = mode === 'leg' && progress > 1 && progress < TOTAL - 1;
    bead.position.set(tip[0], tip[1], 0.5);
    bead.scale.setScalar(routeWidth * 0.95);

    for (let i = 1; i <= 5; i++) {
      const m = markers[i];
      if (!m) continue;
      const on = progress >= S[i] - 1;
      if (on !== m.on) { m.on = on; m.t0 = t; }
      const k = on ? (reduceMotion ? 1 : easeOutBack((t - m.t0) / 0.4)) : 0;
      m.mesh.visible = k > 0.001;
      m.mesh.scale.setScalar(Math.max(k, 0.001) * zoomScale);
    }

    renderer.render(scene, camera);

    if (visibleCard >= 0 && visibleCard < 5 && leaderStart) {
      const a = projectWith(camera, STOPS[visibleCard][0], STOPS[visibleCard][1]);
      const r = (visibleCard === 0 ? MARKER.splatAnchor : MARKER.anchor * zoomScale) * ppu;
      const dx = a.x - leaderStart[0], dy = a.y - leaderStart[1];
      const len = Math.hypot(dx, dy);
      if (len > r + 8) {
        const ex = a.x - dx / len * r, ey = a.y - dy / len * r;
        leaderLine.setAttribute('x1', leaderStart[0].toFixed(1));
        leaderLine.setAttribute('y1', leaderStart[1].toFixed(1));
        leaderLine.setAttribute('x2', ex.toFixed(1));
        leaderLine.setAttribute('y2', ey.toFixed(1));
        leaderLine.style.display = '';
      } else {
        leaderLine.style.display = 'none';
      }
    }
  }

  if (options.entrance) enterPoised(); else startIntro();
  frameId = requestAnimationFrame(frame);

  function updatePlayback() {
    if (disposed) return;
    const shouldPlay = inView && !document.hidden;
    options.sound?.setActive(mostlyInView && !document.hidden);
    if (!shouldPlay && pausedAt === null) {
      pausedAt = nowSec();
      penSample = null;
      setPen(0);
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else if (shouldPlay && pausedAt !== null) {
      const pauseDuration = nowSec() - pausedAt;
      introT0 += pauseDuration;
      poisedT0 += pauseDuration;
      if (leg) leg.t0 += pauseDuration;
      if (fadeT0 >= 0) fadeT0 += pauseDuration;
      markers.forEach(marker => { if (marker) marker.t0 += pauseDuration; });
      pausedAt = null;
      needsResize = true;
      frameId = requestAnimationFrame(frame);
    }
  }

  const viewportObserver = options.inline && typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting && entry.intersectionRatio > 0);
      mostlyInView = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= AUDIBLE_RATIO);
      updatePlayback();
    }, { threshold: [0, 0.001, AUDIBLE_RATIO] }) : null;
  viewportObserver?.observe(root);
  document.addEventListener('visibilitychange', updatePlayback, { signal: abort.signal });
  updatePlayback();

  function cleanup() {
    if (disposed) return;
    disposed = true;
    abort.abort();
    viewportObserver?.disconnect();
    cancelAnimationFrame(frameId);
    window.clearTimeout(fontTimeout);
    mq.removeEventListener('change', onMotionPref);
    const textures = new Set<THREE.Texture>();
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        if (material instanceof THREE.MeshBasicMaterial && material.map) textures.add(material.map);
        material.dispose();
      });
    });
    textures.forEach(texture => texture.dispose());
    renderer.dispose();
  }

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    cleanup();
    root.classList.add('no-webgl');
    root.classList.remove('is-poised');
    cards.forEach(card => {
      card.removeAttribute('inert');
      card.removeAttribute('aria-hidden');
    });
    announcer.textContent = 'The animated chart is unavailable. All checkpoints are available as field notes.';
  }, { signal: abort.signal });

  return cleanup;

}
