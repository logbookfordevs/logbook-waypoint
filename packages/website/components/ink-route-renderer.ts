export type InkRouteRenderFrame = {
  annotationProgress: number;
  cameraProgress: number;
  heroProgress: number;
  impactProgress: number;
  origin: { x: number; y: number };
  routeProgress: number;
  target: { x: number; y: number };
};

type RendererStatus = 'ready' | 'unavailable';

type TextureAsset = {
  height: number;
  texture: WebGLTexture;
  width: number;
};

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform vec2 u_scene_size;
  uniform vec2 u_origin;
  uniform vec2 u_target;
  uniform sampler2D u_scene;
  uniform sampler2D u_ink;
  uniform float u_annotation;
  uniform float u_camera;
  uniform float u_hero;
  uniform float u_impact;
  uniform float u_route;

  float random(vec2 value) {
    return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float valueNoise(vec2 value) {
    vec2 cell = floor(value);
    vec2 local = fract(value);
    local = local * local * (3.0 - 2.0 * local);
    float lower = mix(random(cell), random(cell + vec2(1.0, 0.0)), local.x);
    float upper = mix(random(cell + vec2(0.0, 1.0)), random(cell + vec2(1.0, 1.0)), local.x);
    return mix(lower, upper, local.y);
  }

  float luminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
  }

  vec2 cubicBezier(vec2 start, vec2 controlA, vec2 controlB, vec2 end, float amount) {
    float inverse = 1.0 - amount;
    return inverse * inverse * inverse * start
      + 3.0 * inverse * inverse * amount * controlA
      + 3.0 * inverse * amount * amount * controlB
      + amount * amount * amount * end;
  }

  float routeDistance(vec2 point, out float nearestProgress) {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 controlA = mix(u_origin, u_target, 0.28) + vec2(0.075, 0.08);
    vec2 controlB = mix(u_origin, u_target, 0.72) + vec2(-0.09, 0.06);
    float nearest = 10.0;
    nearestProgress = 0.0;
    vec2 previousPoint = u_origin;
    float previousProgress = 0.0;

    for (int index = 1; index < 56; index += 1) {
      float progress = float(index) / 55.0;
      vec2 routePoint = cubicBezier(u_origin, controlA, controlB, u_target, progress);
      vec2 pointDelta = (point - previousPoint) * vec2(aspect, 1.0);
      vec2 segment = (routePoint - previousPoint) * vec2(aspect, 1.0);
      float projection = clamp(dot(pointDelta, segment) / max(dot(segment, segment), 0.000001), 0.0, 1.0);
      float distanceToRoute = length(pointDelta - segment * projection);
      if (distanceToRoute < nearest) {
        nearest = distanceToRoute;
        nearestProgress = mix(previousProgress, progress, projection);
      }
      previousPoint = routePoint;
      previousProgress = progress;
    }

    return nearest;
  }

  vec2 coverUv(vec2 uv) {
    float viewportAspect = u_resolution.x / u_resolution.y;
    float imageAspect = u_scene_size.x / u_scene_size.y;
    vec2 scale = vec2(1.0);
    if (viewportAspect > imageAspect) {
      scale.y = imageAspect / viewportAspect;
    } else {
      scale.x = viewportAspect / imageAspect;
    }
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    float aspect = u_resolution.x / u_resolution.y;
    float fineNoise = random(floor(v_uv * u_resolution * 0.34));
    float broadNoise = valueNoise(v_uv * vec2(52.0, 31.0));
    vec3 paper = vec3(0.914, 0.882, 0.827);
    paper *= 0.975 + fineNoise * 0.025 + broadNoise * 0.012;

    vec2 sceneUv = coverUv(v_uv);
    vec3 scene = texture2D(u_scene, sceneUv).rgb;
    float edgeDistance = min(min(v_uv.x, 1.0 - v_uv.x), min(v_uv.y, 1.0 - v_uv.y));
    float edgeRelief = 1.0 - smoothstep(0.025, 0.23, edgeDistance);
    vec2 parallaxUv = coverUv(v_uv + vec2(-0.012, 0.009) * u_camera);
    vec3 parallaxScene = texture2D(u_scene, parallaxUv).rgb;
    float reliefInk = smoothstep(0.24, 0.68, 1.0 - luminance(scene));
    scene = mix(scene, parallaxScene, edgeRelief * reliefInk * u_camera * 0.76);

    float nearestProgress = 0.0;
    float distanceToRoute = routeDistance(v_uv, nearestProgress);
    float passedByHead = 1.0 - smoothstep(u_route - 0.02, u_route + 0.025, nearestProgress);
    float corridorWidth = mix(0.045, 0.15, nearestProgress);
    float brokenEdge = corridorWidth * (0.76 + broadNoise * 0.42);
    float corridor = 1.0 - smoothstep(brokenEdge * 0.58, brokenEdge, distanceToRoute);
    float routeExists = smoothstep(0.0, 0.055, u_route);
    float traveledWorld = corridor * passedByHead * routeExists;
    float arrivalDistance = length((v_uv - u_target) * vec2(aspect, 1.0));
    float arrivalWorld = (1.0 - smoothstep(0.08, 0.4, arrivalDistance)) * smoothstep(0.42, 0.94, u_annotation);
    float openingWorld = smoothstep(0.42, 0.82, v_uv.x) * (1.0 - u_hero) * 0.42;
    float worldOpacity = max(openingWorld, max(traveledWorld * 0.94, arrivalWorld));

    vec3 color = mix(paper, scene, clamp(worldOpacity, 0.0, 1.0));

    float impactScale = mix(0.24, 1.0, u_impact);
    float impactSize = mix(0.19, 0.235, step(1.0, aspect));
    vec2 inkUv = ((v_uv - u_origin) * vec2(aspect, 1.0)) / (impactSize * impactScale) + 0.5;
    float insideInk = step(0.0, inkUv.x) * step(inkUv.x, 1.0) * step(0.0, inkUv.y) * step(inkUv.y, 1.0);
    vec3 inkPlate = texture2D(u_ink, clamp(inkUv, 0.0, 1.0)).rgb;
    float inkDensity = clamp(1.0 - luminance(inkPlate), 0.0, 1.0) * insideInk;
    float impactAlpha = smoothstep(0.025, 0.72, inkDensity) * smoothstep(0.0, 0.18, u_impact);

    float routeWidth = mix(0.0047, 0.0076, broadNoise);
    float routeEdge = 1.0 - smoothstep(routeWidth * 0.48, routeWidth * 1.32, distanceToRoute);
    float dryBrush = smoothstep(0.17, 0.84, broadNoise + fineNoise * 0.34);
    float routeAlpha = routeEdge * passedByHead * routeExists * mix(0.52, 1.0, dryBrush);
    vec3 wetInk = mix(vec3(0.055, 0.043, 0.035), vec3(0.12, 0.076, 0.047), broadNoise * 0.46);
    color = mix(color, wetInk, clamp(max(impactAlpha, routeAlpha), 0.0, 0.97));

    float stain = (1.0 - smoothstep(routeWidth * 1.4, routeWidth * 3.8, distanceToRoute))
      * passedByHead * routeExists * 0.14;
    color = mix(color, vec3(0.22, 0.17, 0.12), stain);

    float vignette = smoothstep(0.82, 0.25, length((v_uv - 0.5) * vec2(0.78, 1.0)));
    color *= mix(0.965, 1.015, vignette);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Unable to create Ink Route shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown Ink Route shader error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Unable to create Ink Route renderer program.');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown Ink Route renderer link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function requireUniform(gl: WebGLRenderingContext, program: WebGLProgram, name: string) {
  const location = gl.getUniformLocation(program, name);
  if (!location) {
    throw new Error(`Missing Ink Route uniform: ${name}`);
  }
  return location;
}

export class InkRouteRenderer {
  private readonly buffer: WebGLBuffer;
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGLRenderingContext;
  private readonly onStatus: (status: RendererStatus) => void;
  private readonly positionLocation: number;
  private readonly program: WebGLProgram;
  private readonly uniforms: Record<'annotation' | 'camera' | 'hero' | 'impact' | 'ink' | 'origin' | 'resolution' | 'route' | 'scene' | 'sceneSize' | 'target', WebGLUniformLocation>;
  private desktopScene: TextureAsset | null = null;
  private inkDensity: TextureAsset | null = null;
  private mobileScene: TextureAsset | null = null;
  private destroyed = false;
  private ready = false;

  static create(canvas: HTMLCanvasElement, onStatus: (status: RendererStatus) => void) {
    try {
      const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        powerPreference: 'high-performance',
        premultipliedAlpha: false,
      });
      if (!gl) {
        onStatus('unavailable');
        return null;
      }
      return new InkRouteRenderer(canvas, gl, onStatus);
    } catch {
      onStatus('unavailable');
      return null;
    }
  }

  private constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, onStatus: (status: RendererStatus) => void) {
    this.canvas = canvas;
    this.gl = gl;
    this.onStatus = onStatus;
    this.program = createProgram(gl);
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error('Unable to create Ink Route geometry buffer.');
    }
    this.buffer = buffer;
    this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
    this.uniforms = {
      annotation: requireUniform(gl, this.program, 'u_annotation'),
      camera: requireUniform(gl, this.program, 'u_camera'),
      hero: requireUniform(gl, this.program, 'u_hero'),
      impact: requireUniform(gl, this.program, 'u_impact'),
      ink: requireUniform(gl, this.program, 'u_ink'),
      origin: requireUniform(gl, this.program, 'u_origin'),
      resolution: requireUniform(gl, this.program, 'u_resolution'),
      route: requireUniform(gl, this.program, 'u_route'),
      scene: requireUniform(gl, this.program, 'u_scene'),
      sceneSize: requireUniform(gl, this.program, 'u_scene_size'),
      target: requireUniform(gl, this.program, 'u_target'),
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    void this.loadAssets();
  }

  resize(width: number, height: number) {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, width < 720 ? 1.35 : 1.65);
    const drawingWidth = Math.max(1, Math.round(width * pixelRatio));
    const drawingHeight = Math.max(1, Math.round(height * pixelRatio));
    if (this.canvas.width !== drawingWidth || this.canvas.height !== drawingHeight) {
      this.canvas.width = drawingWidth;
      this.canvas.height = drawingHeight;
    }
  }

  render(frame: InkRouteRenderFrame) {
    if (this.destroyed || !this.ready || !this.desktopScene || !this.mobileScene || !this.inkDensity) {
      return;
    }

    const gl = this.gl;
    const usesMobileScene = this.canvas.clientWidth < 720;
    const scene = usesMobileScene ? this.mobileScene : this.desktopScene;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.texture);
    gl.uniform1i(this.uniforms.scene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.inkDensity.texture);
    gl.uniform1i(this.uniforms.ink, 1);

    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniforms.sceneSize, scene.width, scene.height);
    gl.uniform2f(this.uniforms.origin, frame.origin.x, 1 - frame.origin.y);
    gl.uniform2f(this.uniforms.target, frame.target.x, 1 - frame.target.y);
    gl.uniform1f(this.uniforms.annotation, frame.annotationProgress);
    gl.uniform1f(this.uniforms.camera, frame.cameraProgress);
    gl.uniform1f(this.uniforms.hero, frame.heroProgress);
    gl.uniform1f(this.uniforms.impact, frame.impactProgress);
    gl.uniform1f(this.uniforms.route, frame.routeProgress);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    for (const asset of [this.desktopScene, this.mobileScene, this.inkDensity]) {
      if (asset) {
        this.gl.deleteTexture(asset.texture);
      }
    }
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }

  private readonly handleContextLost = (event: Event) => {
    event.preventDefault();
    this.ready = false;
    this.onStatus('unavailable');
  };

  private async loadAssets() {
    try {
      const [desktopScene, mobileScene, inkDensity] = await Promise.all([
        this.loadTexture('/ink-route/chart-world-desktop-v1.webp'),
        this.loadTexture('/ink-route/chart-world-mobile-v1.webp'),
        this.loadTexture('/ink-route/ink-density-v1.webp'),
      ]);
      if (this.destroyed) {
        for (const asset of [desktopScene, mobileScene, inkDensity]) {
          this.gl.deleteTexture(asset.texture);
        }
        return;
      }
      this.desktopScene = desktopScene;
      this.mobileScene = mobileScene;
      this.inkDensity = inkDensity;
      this.ready = true;
      this.onStatus('ready');
    } catch {
      this.onStatus('unavailable');
    }
  }

  private loadTexture(source: string) {
    return new Promise<TextureAsset>((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (this.destroyed) {
          reject(new Error('Ink Route renderer disposed before texture upload.'));
          return;
        }
        const texture = this.gl.createTexture();
        if (!texture) {
          reject(new Error(`Unable to create Ink Route texture: ${source}`));
          return;
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        resolve({ height: image.naturalHeight, texture, width: image.naturalWidth });
      };
      image.onerror = () => reject(new Error(`Unable to load Ink Route texture: ${source}`));
      image.src = source;
    });
  }
}
