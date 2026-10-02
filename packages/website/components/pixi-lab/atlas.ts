import 'pixi.js/prepare';
import { Application, Assets, Container, Graphics, Sprite, type Texture } from 'pixi.js';

export interface Atlas {
  travel(destination: number, immediate?: boolean): Promise<void>;
  destroy(): void;
}

const paper = 0xe9e1d3;
const ink = 0x302c25;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => n * n * (3 - 2 * n);

export async function createAtlas(host: HTMLElement): Promise<Atlas> {
  const app = new Application();
  await app.init({ resizeTo: host, background: paper, antialias: true, resolution: Math.min(devicePixelRatio, 1.5), autoDensity: true, preference: 'webgl', autoStart: false });
  let textures: Texture[];
  try {
    textures = await Promise.all([
      Assets.load<Texture>(host.clientWidth < 700 ? '/ink-route/chart-world-mobile-v1.webp' : '/ink-route/chart-world-desktop-v1.webp'),
      Assets.load<Texture>('/ink-route/ink-density-v1.webp'),
    ]);
  } catch (error) {
    app.destroy(true, { children: true });
    throw error;
  }
  delete host.dataset.failed;
  host.appendChild(app.canvas);
  app.canvas.setAttribute('aria-hidden', 'true');
  const world = new Container();
  app.stage.addChild(world);
  const plate = new Sprite(textures[0]);
  const faint = new Sprite(textures[0]);
  const wash = new Graphics();
  faint.alpha = 0.12;
  world.addChild(faint, plate, wash);
  plate.mask = wash;
  const route = new Graphics();
  world.addChild(route);
  const impact = new Sprite(textures[1]);
  impact.anchor.set(0.5);
  impact.blendMode = 'multiply';
  world.addChild(impact);
  const tide = new Graphics();
  const bearings = new Graphics();
  world.addChild(tide, bearings);
  let progress = 0;
  let source = 0;
  let target = 0;
  let elapsed = 0;
  let duration = 1;
  let resolveTravel: (() => void) | undefined;
  let alive = true;
  let available = true;
  let idle = 0;
  let lastGeometry = '';

  const point = (t: number) => {
    const mobile = app.screen.width < 700;
    const x = mobile ? 0.19 + 0.59 * t + Math.sin(t * Math.PI * 2) * 0.09 : 0.18 + 0.59 * t;
    const y = mobile ? 0.76 - t * 0.47 + Math.sin(t * 7) * 0.045 : 0.8 - t * 0.37 - Math.sin(t * Math.PI * 2) * 0.115;
    return { x: x * app.screen.width, y: y * app.screen.height };
  };

  function draw() {
    const w = app.screen.width;
    const h = app.screen.height;
    const mobile = w < 700;
    const cover = Math.max(w / textures[0].width, h / textures[0].height);
    for (const layer of [faint, plate]) {
      layer.scale.set(cover * (1.05 + Math.min(progress, 1) * 0.07));
      layer.position.set(w - layer.width + progress * w * 0.025, (h - layer.height) * 0.5);
    }
    world.position.set(progress > 1 ? -(progress - 1) * w * 0.055 : 0, 0);
    const geometry = `${w}:${h}:${progress}`;
    if (geometry !== lastGeometry) {
      lastGeometry = geometry;
      const reveal = ease(clamp(progress * 1.35));
      wash.clear();
      for (let i = 0; i < 29; i++) {
        const t = i / 28;
        const p = point(t);
        const local = clamp((reveal - t * 0.6) * 2.5);
        const radius = local * (mobile ? w * 0.63 : h * 0.58) * (0.85 + Math.sin(i * 17) * 0.15);
        wash.circle(p.x, p.y, radius).fill(0xffffff);
      }
      route.clear();
      const reach = clamp(progress) * 0.88;
      for (let i = 0; i < 370 * reach; i++) {
        if (Math.floor(i / 13) % 2 === 1) continue;
        const p = point(i / 370);
        const radius = 1.1 + (Math.sin(i * 23) + 1) * 0.9;
        route.circle(p.x + Math.sin(i * 19) * 1.1, p.y, radius).fill({ color: ink, alpha: 0.72 });
      }
      const origin = point(0);
      impact.position.set(origin.x, origin.y);
      impact.width = impact.height = (mobile ? 125 : 210) * ease(clamp(progress * 6));
      impact.alpha = clamp(progress * 12) * 0.9;
    }
    tide.clear();
    const tideOpacity = clamp(progress * 1.4) * 0.2;
    for (let row = 0; row < 6; row++) {
      const y = h * (0.7 + row * 0.038);
      const x = w * 0.7 + Math.sin(idle * 0.00022 + row) * 3;
      tide.moveTo(x, y).bezierCurveTo(x + 18, y - 3, x + 31, y + 3, x + 55, y).stroke({ color: 0x315a58, width: 0.8, alpha: tideOpacity });
    }
    bearings.clear();
    const end = point(0.88);
    const arrival = clamp((progress - 0.77) * 5);
    bearings.circle(end.x, end.y, 18 + 5 * Math.sin(idle * 0.0006)).stroke({ color: 0xb5482e, width: 1, alpha: arrival * 0.55 });
    bearings.circle(end.x, end.y, 7).fill({ color: 0xb5482e, alpha: arrival });
    if (progress > 1) {
      const length = clamp(progress - 1);
      for (let i = 0; i < length * 130; i++) {
        if (Math.floor(i / 10) % 2 === 1) continue;
        bearings.circle(end.x - i * w * 0.0036, end.y + Math.sin(i / 130 * Math.PI) * h * 0.24, 1.9).fill(0x167b78);
      }
    }
  }

  app.ticker.maxFPS = 30;
  app.ticker.add((ticker) => {
    idle += ticker.deltaMS;
    if (resolveTravel) {
      elapsed += ticker.deltaMS;
      const fraction = clamp(elapsed / duration);
      progress = source + (target - source) * ease(fraction);
      if (fraction === 1) {
        const complete = resolveTravel;
        resolveTravel = undefined;
        complete();
      }
    }
    draw();
  });
  const visibility = () => {
    if (document.hidden) app.stop();
    else if (available) app.start();
  };
  document.addEventListener('visibilitychange', visibility);
  const resize = new ResizeObserver(() => app.resize());
  resize.observe(host);
  const contextLost = () => {
    available = false;
    host.dataset.failed = 'true';
    progress = target;
    const complete = resolveTravel;
    resolveTravel = undefined;
    complete?.();
    app.stop();
  };
  app.canvas.addEventListener('webglcontextlost', contextLost);
  draw();
  try {
    await app.renderer.prepare.upload(app.stage);
  } catch (error) {
    resize.disconnect();
    document.removeEventListener('visibilitychange', visibility);
    app.canvas.removeEventListener('webglcontextlost', contextLost);
    app.destroy(true, { children: true });
    throw error;
  }
  app.render();
  app.start();

  return {
    travel(destination, immediate = false) {
      if (!alive || !available) return Promise.resolve();
      resolveTravel?.();
      resolveTravel = undefined;
      source = progress;
      target = destination;
      elapsed = 0;
      duration = destination === 1 ? 6200 : 3900;
      if (immediate) {
        progress = destination;
        draw();
        app.render();
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => { resolveTravel = resolve; });
    },
    destroy() {
      if (!alive) return;
      alive = false;
      resolveTravel?.();
      resize.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      app.canvas.removeEventListener('webglcontextlost', contextLost);
      app.destroy(true, { children: true });
    },
  };
}
