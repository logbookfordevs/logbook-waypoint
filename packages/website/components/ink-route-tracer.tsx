'use client';

import Image from 'next/image';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Crosshair, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { InkRouteAudio } from '@/components/ink-route-audio';

type Take = 'a' | 'b';

type TimingSpec = {
  total: number;
  phases: readonly [number, number, number, number];
};

type InkRouteTrace = {
  samples: number;
  maxWorkMs: number;
  maxFrameGapMs: number;
  framesOver50Ms: number;
  impactWorkMs: number | null;
  viewport: { width: number; height: number };
};

declare global {
  interface Window {
    __waypointInkRouteTrace?: InkRouteTrace;
  }
}

const TAKE_TIMINGS: Record<Take, TimingSpec> = {
  a: { total: 980, phases: [360, 180, 170, 270] },
  b: { total: 1280, phases: [480, 310, 250, 240] },
};

const VISUAL_PHASES = [0, 0.28, 0.42, 0.56, 1] as const;
const MUTE_STORAGE_KEY = 'waypoint-ink-route-muted';

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function smoothstep(start: number, end: number, value: number) {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function easeInOut(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function timelineProgress(elapsed: number, timing: TimingSpec) {
  let phaseStart = 0;

  for (let index = 0; index < timing.phases.length; index += 1) {
    const phaseDuration = timing.phases[index];
    const phaseEnd = phaseStart + phaseDuration;
    if (elapsed <= phaseEnd) {
      const local = easeInOut(clamp((elapsed - phaseStart) / phaseDuration));
      const visualStart = VISUAL_PHASES[index];
      const visualEnd = VISUAL_PHASES[index + 1];
      return visualStart + (visualEnd - visualStart) * local;
    }
    phaseStart = phaseEnd;
  }

  return 1;
}

function routeGeometry(width: number, height: number, origin: { x: number; y: number }) {
  const isMobile = width < 720;
  const end = isMobile
    ? { x: width * 0.56, y: height * 0.72 }
    : { x: width * 0.73, y: height * 0.59 };
  const firstControl = isMobile
    ? { x: origin.x - width * 0.13, y: origin.y + height * 0.13 }
    : { x: origin.x + width * 0.1, y: origin.y + height * 0.08 };
  const secondControl = isMobile
    ? { x: end.x + width * 0.14, y: end.y - height * 0.13 }
    : { x: end.x - width * 0.18, y: end.y - height * 0.16 };

  return {
    end,
    path: `M ${origin.x} ${origin.y} C ${firstControl.x} ${firstControl.y}, ${secondControl.x} ${secondControl.y}, ${end.x} ${end.y}`,
  };
}

export function InkRouteTracer() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const journeyButtonRef = useRef<HTMLButtonElement>(null);
  const journeyHeadingRef = useRef<HTMLHeadingElement>(null);
  const routePathRef = useRef<SVGPathElement>(null);
  const routeRevealRef = useRef<SVGPathElement>(null);
  const routeShadowRef = useRef<SVGPathElement>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const audioRef = useRef<InkRouteAudio | null>(null);
  const intentionalJourneyRef = useRef(false);
  const impactPlayedRef = useRef(false);
  const checkpointPlayedRef = useRef(false);
  const programmaticScrollRef = useRef(0);
  const takeRef = useRef<Take>('a');
  const mutedRef = useRef(false);
  const latestRouteProgressRef = useRef(0);
  const latestFrameTimeRef = useRef(0);
  const [take, setTake] = useState<Take>('a');
  const [isMuted, setIsMuted] = useState(false);
  const [showsJourneyControls, setShowsJourneyControls] = useState(false);

  useEffect(() => {
    takeRef.current = take;
  }, [take]);

  useEffect(() => {
    const storedMute = window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    mutedRef.current = storedMute;
    setIsMuted(storedMute);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const routePath = routePathRef.current;
    const routeReveal = routeRevealRef.current;
    const routeShadow = routeShadowRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!root || !stage || !routePath || !routeReveal || !routeShadow) {
      return;
    }

    audioRef.current = new InkRouteAudio();
    audioRef.current.setMuted(mutedRef.current);

    let rootTop = 0;
    let entranceRange = 1;
    let annotationRange = 1;
    let routeLength = 1;
    let animationFrame = 0;
    let latestProgress = -1;
    let latestAnnotationProgress = -1;
    let latestControlsVisible = false;
    const trace: InkRouteTrace = {
      samples: 0,
      maxWorkMs: 0,
      maxFrameGapMs: 0,
      framesOver50Ms: 0,
      impactWorkMs: null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };

    const setRouteGeometry = () => {
      const bounds = stage.getBoundingClientRect();
      const fallbackOrigin = bounds.width < 720
        ? { x: bounds.width * 0.78, y: bounds.height * 0.38 }
        : { x: bounds.width * 0.39, y: bounds.height * 0.68 };
      const origin = originRef.current.x > 0 ? originRef.current : fallbackOrigin;
      const geometry = routeGeometry(bounds.width, bounds.height, origin);

      for (const path of [routePath, routeReveal, routeShadow]) {
        path.setAttribute('d', geometry.path);
      }
      routeLength = typeof routePath.getTotalLength === 'function'
        ? Math.max(routePath.getTotalLength(), 1)
        : 1;
      routeReveal.style.strokeDasharray = `${routeLength}`;
      routeShadow.style.strokeDasharray = `${routeLength}`;
      stage.style.setProperty('--ink-origin-x', `${origin.x}px`);
      stage.style.setProperty('--ink-origin-y', `${origin.y}px`);
      stage.style.setProperty('--annotation-x', `${geometry.end.x}px`);
      stage.style.setProperty('--annotation-y', `${geometry.end.y}px`);
    };

    const measure = () => {
      rootTop = root.getBoundingClientRect().top + window.scrollY;
      entranceRange = Math.max(window.innerHeight * 0.92, 620);
      annotationRange = Math.max(window.innerHeight * 1.18, 760);
      root.style.setProperty('--ink-route-height', `${window.innerHeight + entranceRange + annotationRange}px`);
      trace.viewport = { width: window.innerWidth, height: window.innerHeight };
      setRouteGeometry();
    };

    const render = () => {
      animationFrame = 0;
      const workStart = performance.now();
      const frameGap = latestFrameTimeRef.current ? workStart - latestFrameTimeRef.current : 0;
      latestFrameTimeRef.current = workStart;
      const isMeasuredFrameGap = frameGap > 0 && frameGap < 250;
      if (isMeasuredFrameGap) {
        trace.maxFrameGapMs = Math.max(trace.maxFrameGapMs, frameGap);
      }
      if (isMeasuredFrameGap && frameGap > 50) {
        trace.framesOver50Ms += 1;
      }

      const localScroll = window.scrollY - rootTop;
      const progress = reducedMotion.matches
        ? (localScroll > 4 || window.location.hash === '#annotation' ? 1 : 0)
        : clamp(localScroll / entranceRange);
      const annotationProgress = reducedMotion.matches
        ? progress
        : clamp((localScroll - entranceRange) / annotationRange);
      const routeProgress = clamp(smoothstep(0.56, 1, progress) * 0.36 + annotationProgress * 0.64);
      const impactProgress = smoothstep(0.42, 0.56, progress);
      const heroProgress = smoothstep(0, 0.28, progress);
      const mapProgress = smoothstep(0.12, 0.78, routeProgress);
      const annotationReveal = smoothstep(0.54, 0.88, annotationProgress);
      const cameraProgress = smoothstep(0.12, 0.92, routeProgress);
      const forwardVelocity = latestFrameTimeRef.current && frameGap > 0
        ? Math.max((routeProgress - latestRouteProgressRef.current) / frameGap * 1000, 0)
        : 0;

      stage.style.setProperty('--hero-exit', heroProgress.toFixed(4));
      stage.style.setProperty('--hero-translate', `${-35 * heroProgress}px`);
      stage.style.setProperty('--impact-progress', impactProgress.toFixed(4));
      stage.style.setProperty('--impact-scale', (0.34 + impactProgress * 0.66).toFixed(4));
      stage.style.setProperty('--route-progress', routeProgress.toFixed(4));
      stage.style.setProperty('--map-progress', mapProgress.toFixed(4));
      stage.style.setProperty('--map-dash-offset', `${620 * (1 - mapProgress)}px`);
      stage.style.setProperty('--map-contour-offset', `${900 * (1 - mapProgress)}px`);
      stage.style.setProperty('--annotation-progress', annotationReveal.toFixed(4));
      stage.style.setProperty('--annotation-lift', `${32 * (1 - annotationReveal)}px`);
      stage.style.setProperty('--journey-copy-progress', smoothstep(0.08, 0.3, routeProgress).toFixed(4));
      stage.style.setProperty('--camera-x', `${-window.innerWidth * 0.045 * cameraProgress}px`);
      stage.style.setProperty('--camera-y', `${-window.innerHeight * 0.035 * cameraProgress}px`);
      stage.style.setProperty('--camera-scale', (1 + cameraProgress * 0.075).toFixed(4));
      stage.toggleAttribute('data-hero-hidden', progress >= 0.28);
      routeReveal.style.strokeDashoffset = `${routeLength * (1 - routeProgress)}`;
      routeShadow.style.strokeDashoffset = `${routeLength * (1 - routeProgress)}`;

      const movedForward = routeProgress > latestRouteProgressRef.current;
      const crossedImpact = latestProgress < 0.42 && progress >= 0.42;
      const crossedCheckpoint = latestAnnotationProgress < 0.88 && annotationProgress >= 0.88;
      if (intentionalJourneyRef.current && movedForward && crossedImpact && !impactPlayedRef.current) {
        impactPlayedRef.current = true;
        audioRef.current?.playImpact();
      }
      if (intentionalJourneyRef.current && movedForward && crossedCheckpoint && !checkpointPlayedRef.current) {
        checkpointPlayedRef.current = true;
        audioRef.current?.playCheckpoint();
      }
      audioRef.current?.setScratchVelocity(intentionalJourneyRef.current && movedForward ? forwardVelocity : 0);

      const controlsVisible = progress > 0.78;
      if (controlsVisible !== latestControlsVisible) {
        latestControlsVisible = controlsVisible;
        setShowsJourneyControls(controlsVisible);
      }

      const workDuration = performance.now() - workStart;
      trace.samples += 1;
      trace.maxWorkMs = Math.max(trace.maxWorkMs, workDuration);
      if (crossedImpact) {
        trace.impactWorkMs = workDuration;
      }
      window.__waypointInkRouteTrace = { ...trace };
      latestProgress = progress;
      latestAnnotationProgress = annotationProgress;
      latestRouteProgressRef.current = routeProgress;
    };

    const scheduleRender = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const handleResize = () => {
      measure();
      scheduleRender();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        void audioRef.current?.suspend();
      }
      scheduleRender();
    };

    const handleMotionPreference = () => {
      audioRef.current?.setScratchVelocity(0);
      latestProgress = -1;
      latestAnnotationProgress = -1;
      scheduleRender();
    };

    measure();
    if (window.location.hash === '#annotation') {
      window.requestAnimationFrame(() => {
        window.scrollTo(0, rootTop + entranceRange + annotationRange * 0.9);
        journeyHeadingRef.current?.focus({ preventScroll: true });
        scheduleRender();
      });
    } else {
      render();
    }

    window.addEventListener('scroll', scheduleRender, { passive: true });
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);
    reducedMotion.addEventListener('change', handleMotionPreference);

    return () => {
      window.removeEventListener('scroll', scheduleRender);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      reducedMotion.removeEventListener('change', handleMotionPreference);
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(programmaticScrollRef.current);
      audioRef.current?.dispose();
      audioRef.current = null;
      delete window.__waypointInkRouteTrace;
    };
  }, []);

  const disableAudio = () => {
    audioRef.current?.dispose();
    audioRef.current = null;
  };

  const prepareAudio = () => {
    try {
      audioRef.current?.prepare();
    } catch {
      disableAudio();
    }
  };

  const startJourney = () => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const button = journeyButtonRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!root || !stage || !button || programmaticScrollRef.current) {
      return;
    }

    const stageBounds = stage.getBoundingClientRect();
    const arrowBounds = button.querySelector<SVGElement>('[data-journey-arrow]')?.getBoundingClientRect();
    originRef.current = arrowBounds
      ? { x: arrowBounds.left + arrowBounds.width / 2 - stageBounds.left, y: arrowBounds.top + arrowBounds.height / 2 - stageBounds.top }
      : originRef.current;
    window.dispatchEvent(new Event('resize'));
    intentionalJourneyRef.current = true;
    impactPlayedRef.current = false;
    checkpointPlayedRef.current = false;
    void audioRef.current?.unlock().catch(disableAudio);
    audioRef.current?.setMuted(mutedRef.current || reducedMotion);

    const rootTop = root.getBoundingClientRect().top + window.scrollY;
    const entranceRange = Math.max(window.innerHeight * 0.92, 620);
    window.history.replaceState(null, '', '#journey');

    if (reducedMotion) {
      window.scrollTo(0, rootTop + entranceRange);
      journeyHeadingRef.current?.focus({ preventScroll: true });
      return;
    }

    const timing = TAKE_TIMINGS[takeRef.current];
    const startTime = performance.now();
    const animateScroll = (now: number) => {
      const elapsed = now - startTime;
      const progress = timelineProgress(elapsed, timing);
      window.scrollTo(0, rootTop + entranceRange * progress);
      if (elapsed < timing.total) {
        programmaticScrollRef.current = window.requestAnimationFrame(animateScroll);
        return;
      }

      programmaticScrollRef.current = 0;
      window.scrollTo(0, rootTop + entranceRange);
      journeyHeadingRef.current?.focus({ preventScroll: true });
    };

    programmaticScrollRef.current = window.requestAnimationFrame(animateScroll);
  };

  const toggleMute = () => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    setIsMuted(nextMuted);
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(nextMuted));
    audioRef.current?.setMuted(nextMuted);
  };

  const returnToHero = () => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    intentionalJourneyRef.current = false;
    audioRef.current?.setScratchVelocity(0);
    window.history.replaceState(null, '', window.location.pathname);
    window.scrollTo({
      top: root.getBoundingClientRect().top + window.scrollY,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    window.setTimeout(() => journeyButtonRef.current?.focus({ preventScroll: true }), 520);
  };

  const muteIcon = isMuted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />;

  return (
    <main ref={rootRef} id="main-content" className="ink-route" data-take={take}>
      <div ref={stageRef} className="ink-route__stage">
        <div className="ink-route__paper" aria-hidden="true" />

        <section className="ink-route__hero" aria-labelledby="ink-route-title">
          <div className="ink-route__brand">
            <Image src="/brand/waypoint-mark.svg" alt="" width={48} height={48} priority />
            <span><small>Logbook</small><strong>Waypoint</strong></span>
          </div>

          <div className="ink-route__hero-grid">
            <div className="ink-route__hero-copy">
              <p className="ink-route__eyebrow">Local-first visual feedback</p>
              <h1 id="ink-route-title">Mark what matters.<br /><em>Chart the change.</em></h1>
              <p>
                Point to the rendered detail. Waypoint retains the context so your coding agent can act—and return evidence to the same place.
              </p>

              <div className="ink-route__actions" aria-label="Explore Logbook Waypoint">
                <a className="ink-route__primary-action" href="https://github.com/logbookfordevs/logbook-waypoint">
                  Get Waypoint <ArrowRight aria-hidden="true" />
                </a>
                <button
                  ref={journeyButtonRef}
                  type="button"
                  className="ink-route__journey-action"
                  onClick={startJourney}
                  onFocus={prepareAudio}
                  onPointerDown={prepareAudio}
                >
                  See the journey <ArrowDown data-journey-arrow aria-hidden="true" />
                </button>
                <a className="ink-route__docs-action" href="/docs"><BookOpen aria-hidden="true" /> Docs</a>
              </div>

              <fieldset className="ink-route__takes">
                <legend>Tracer edit</legend>
                <label><input type="radio" name="ink-route-take" checked={take === 'a'} onChange={() => setTake('a')} /> Take A · Quiet cut</label>
                <label><input type="radio" name="ink-route-take" checked={take === 'b'} onChange={() => setTake('b')} /> Take B · Held breath</label>
              </fieldset>
            </div>

            <div className="ink-route__thelu" aria-label="Thelu holds the field notebook, ready to set out">
              <div className="ink-route__thelu-frame">
                <Image src="/brand/thelu-profile.webp" alt="Thelu, Waypoint's field companion" width={560} height={700} priority sizes="(max-width: 720px) 54vw, 36vw" />
              </div>
              <span className="ink-route__coordinate">37° 47.200′ N · 122° 24.800′ W</span>
            </div>
          </div>
        </section>

        <div className="ink-route__world">
          <svg className="ink-route__map" focusable="false" aria-hidden="true">
            <defs>
              <mask id="ink-route-reveal" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                <path ref={routeRevealRef} className="ink-route__reveal-path" />
              </mask>
            </defs>

            <g className="ink-route__cartography">
              <path className="ink-route__coast ink-route__coast--one" d="M72 170 C180 92 255 146 318 100 S472 48 558 124" />
              <path className="ink-route__coast ink-route__coast--two" d="M884 80 C970 160 1060 122 1136 208 S1282 284 1392 248" />
              <path className="ink-route__coast ink-route__coast--three" d="M870 706 C974 632 1064 692 1130 620 S1280 566 1394 634" />
              <path className="ink-route__contour" d="M930 214c56-46 142-26 174 32s-11 133-82 140-125-49-110-104 84-83 132-48 31 104-21 120-98-29-82-72 73-57 96-19" />
              <path className="ink-route__bearing" d="M236 704v-88m-44 44h88m-75-31 62 62m0-62-62 62" />
              <path className="ink-route__survey" d="M412 198h170m-145-28v57m88-41v29m31-50v82" />
              <g className="ink-route__ticks">
                <path d="M80 450h74m-37-37v74M1180 458h92m-46-46v92" />
                <path d="M746 112l24 13m-35 7 13-24M682 714l24 13m-35 7 13-24" />
              </g>
              <g className="ink-route__map-copy">
                <text x="102" y="142">SOUNDING 28</text>
                <text x="1004" y="414">DRIFTWOOD PASSAGE</text>
                <text x="202" y="752">N</text>
                <text x="1138" y="654">31° 14.200′</text>
              </g>
            </g>

            <g className="ink-route__impact">
              <path className="ink-route__impact-wash ink-route__impact-wash--one" d="M-8-52c19-5 29 8 41 5 18-4 31 8 29 24 19 7 25 23 15 37 15 14 6 36-10 39-4 21-25 27-39 17-16 15-39 7-42-10-22 1-34-18-23-34-14-12-8-31 8-35 4-13 17-22 29-17 8-9 19-15 29-13Z" />
              <path className="ink-route__impact-wash ink-route__impact-wash--two" d="M-18-35c15-20 40-24 57-10 20 1 34 19 27 37 12 15 3 35-15 39-8 17-31 19-42 5-18 8-37-5-35-24-14-13-8-35 8-39 8-5 18-7 26-8Z" />
              <path className="ink-route__impact-core" d="M-9-21c8-12 20-7 27-12 13-8 24 2 23 14 15 1 20 15 12 24 8 12-3 25-15 23-5 14-23 14-30 4-13 6-25-5-21-17-11-7-8-24 5-29 1-7 7-11 14-7Z" />
              <path className="ink-route__impact-ring ink-route__impact-ring--one" d="M-45-16c17-28 52-37 80-20 29 18 38 55 18 82-21 28-61 33-87 11-24-20-29-51-11-73Z" />
              <path className="ink-route__impact-ring ink-route__impact-ring--two" d="M-67-24c27-43 87-57 130-27 45 31 55 92 21 134-35 43-100 48-140 9-35-34-40-81-11-116Z" />
              <path className="ink-route__impact-feathers" d="M-18-38c-7-12-8-22-11-34M10-38c3-15 8-25 9-40M36-21c12-8 21-17 31-26M43 8c16 0 29-4 44-4M34 38c13 8 22 18 35 30M0 47c-1 15-6 27-5 40M-28 34c-11 10-20 20-33 32M-42 3c-15-2-28-8-45-9M-7-10c-18-4-28 5-40 2M21 17c14 4 25 2 38 11" />
            </g>

            <path ref={routeShadowRef} className="ink-route__route-shadow" />
            <g mask="url(#ink-route-reveal)">
              <path ref={routePathRef} className="ink-route__route" />
            </g>
          </svg>

          <div className="ink-route__checkpoint">
            <div className="ink-route__checkpoint-mark"><Crosshair aria-hidden="true" /></div>
            <div className="ink-route__annotation-card">
              <span>01 · Annotation</span>
              <strong>Target retained.</strong>
              <p>The selector, screenshot, route, and requested change stay together.</p>
              <code>section.empty-state · context saved</code>
            </div>
          </div>
        </div>

        <div className="ink-route__journey-copy">
          <p>THE INK ROUTE · FIRST BEARING</p>
          <h2 ref={journeyHeadingRef} id="journey" tabIndex={-1}>The route authors the world.</h2>
          <span>Scroll to follow the ink into Annotation.</span>
        </div>

        <div className="ink-route__persistent-controls" hidden={!showsJourneyControls}>
          <button type="button" onClick={returnToHero}><ArrowLeft aria-hidden="true" /> Back to hero</button>
          <span aria-hidden="true" />
          <button type="button" onClick={toggleMute}>{muteIcon} {isMuted ? 'Sound off' : 'Sound on'}</button>
          <label>
            <span className="sr-only">Tracer edit</span>
            <select value={take} onChange={(event) => setTake(event.target.value as Take)}>
              <option value="a">Take A · Quiet cut</option>
              <option value="b">Take B · Held breath</option>
            </select>
          </label>
        </div>

        <a id="annotation" className="ink-route__annotation-anchor" href="#annotation" tabIndex={-1}>Annotation checkpoint</a>
      </div>
    </main>
  );
}
