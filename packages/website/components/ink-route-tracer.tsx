'use client';

import Image from 'next/image';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Crosshair, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { InkRouteAudio } from '@/components/ink-route-audio';
import { InkRouteRenderer } from '@/components/ink-route-renderer';

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

const HELD_BREATH_TIMING: TimingSpec = { total: 1280, phases: [480, 310, 250, 240] };

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

function routeGeometry(width: number, height: number) {
  const isMobile = width < 720;
  const end = isMobile
    ? { x: width * 0.56, y: height * 0.72 }
    : { x: width * 0.73, y: height * 0.59 };

  return {
    end,
  };
}

export function InkRouteTracer() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const journeyButtonRef = useRef<HTMLButtonElement>(null);
  const journeyHeadingRef = useRef<HTMLHeadingElement>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const audioRef = useRef<InkRouteAudio | null>(null);
  const intentionalJourneyRef = useRef(false);
  const impactPlayedRef = useRef(false);
  const checkpointPlayedRef = useRef(false);
  const programmaticScrollRef = useRef(0);
  const mutedRef = useRef(false);
  const latestRouteProgressRef = useRef(0);
  const latestFrameTimeRef = useRef(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isMotionReduced, setIsMotionReduced] = useState(false);
  const [showsJourneyControls, setShowsJourneyControls] = useState(false);

  useEffect(() => {
    const storedMute = window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    mutedRef.current = storedMute;
    setIsMuted(storedMute);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!root || !stage || !canvas) {
      return;
    }

    audioRef.current = new InkRouteAudio();
    audioRef.current.setMuted(mutedRef.current);
    setIsMotionReduced(reducedMotion.matches);

    let rootTop = 0;
    let entranceRange = 1;
    let annotationRange = 1;
    let animationFrame = 0;
    let latestProgress = -1;
    let latestAnnotationProgress = -1;
    let latestControlsVisible = false;
    let renderer: InkRouteRenderer | null = null;
    let target = { x: 0.73, y: 0.59 };
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
      const geometry = routeGeometry(bounds.width, bounds.height);
      target = { x: geometry.end.x / bounds.width, y: geometry.end.y / bounds.height };
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
      renderer?.resize(stage.clientWidth, stage.clientHeight);
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
      const stageBounds = stage.getBoundingClientRect();
      const origin = originRef.current.x > 0
        ? originRef.current
        : {
            x: stageBounds.width < 720 ? stageBounds.width * 0.78 : stageBounds.width * 0.39,
            y: stageBounds.height * (stageBounds.width < 720 ? 0.38 : 0.68),
          };
      renderer?.render({
        annotationProgress,
        cameraProgress,
        heroProgress,
        impactProgress,
        origin: { x: origin.x / stageBounds.width, y: origin.y / stageBounds.height },
        routeProgress,
        target,
      });

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
      audioRef.current?.setMuted(mutedRef.current || reducedMotion.matches);
      setIsMotionReduced(reducedMotion.matches);
      latestProgress = -1;
      latestAnnotationProgress = -1;
      scheduleRender();
    };

    renderer = InkRouteRenderer.create(canvas, (status) => {
      stage.setAttribute('data-renderer', status);
      scheduleRender();
    });

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
      renderer?.dispose();
      renderer = null;
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

    const timing = HELD_BREATH_TIMING;
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
    if (isMotionReduced) {
      return;
    }
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

  const soundIsOff = isMuted || isMotionReduced;
  const muteIcon = soundIsOff ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />;
  const soundLabel = isMotionReduced ? 'Sound paused' : isMuted ? 'Sound off' : 'Sound on';

  return (
    <main ref={rootRef} id="main-content" className="ink-route" data-rhythm="held-breath">
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

              <p className="ink-route__rhythm-note">DIRECTOR'S RHYTHM · HELD BREATH</p>
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
          <canvas ref={canvasRef} className="ink-route__canvas" aria-hidden="true" />
          <picture className="ink-route__fallback-world" aria-hidden="true">
            <source media="(max-width: 44.99rem)" srcSet="/ink-route/chart-world-mobile-v1.webp" />
            <img src="/ink-route/chart-world-desktop-v1.webp" alt="" />
          </picture>

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
          <button type="button" onClick={toggleMute} disabled={isMotionReduced}>{muteIcon} {soundLabel}</button>
        </div>

        <a id="annotation" className="ink-route__annotation-anchor" href="#annotation" tabIndex={-1}>Annotation checkpoint</a>
      </div>
    </main>
  );
}
