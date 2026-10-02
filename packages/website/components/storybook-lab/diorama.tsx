'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { CanvasTexture, CatmullRomCurve3, DoubleSide, Group, MathUtils, PCFShadowMap, PlaneGeometry, SRGBColorSpace, Vector3 } from 'three';
import type { Chapter } from '@/components/storybook-lab/story-model';

type Point = [number, number, number];
interface SceneProps { chapter: Chapter; bearing: number; skip: number; onArrive: () => void; onFailure: () => void }
const PAPER = '#e9e1d3';
const INK = '#203d3c';
const RUST = '#b74830';
const TEAL = '#497b70';
const route = new CatmullRomCurve3([new Vector3(-2.5, .55, .5), new Vector3(-1.5, .7, 1.25), new Vector3(0, .75, .7), new Vector3(1.3, .68, -.2), new Vector3(2.65, .66, -.65)]);

function makePaperTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new CanvasTexture(canvas);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, 1024, 1024);
  let seed = 91;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 45000; i++) {
    ctx.fillStyle = `rgba(75,56,32,${random() * .075})`;
    ctx.fillRect(random() * 1024, random() * 1024, 1 + random() * 3, 1);
  }
  ctx.strokeStyle = '#abb2a080';
  ctx.lineWidth = 1;
  for (let level = 0; level < 14; level++) {
    ctx.beginPath();
    for (let i = 0; i <= 150; i++) {
      const angle = i / 150 * Math.PI * 2;
      const radius = 50 + level * 13 + Math.sin(angle * 3) * 16 + Math.cos(angle * 5) * 8;
      const x = 790 + Math.cos(angle) * radius;
      const y = 275 + Math.sin(angle) * radius * .7;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = '#b9ac9460';
  for (let n = 0; n < 11; n++) {
    ctx.beginPath(); ctx.moveTo(n * 110, 0); ctx.lineTo(n * 110, 1024); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, n * 110); ctx.lineTo(1024, n * 110); ctx.stroke();
  }
  ctx.strokeStyle = '#958c7299';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 968, 968);
  ctx.font = '16px monospace';
  ctx.fillStyle = '#7a806c';
  ctx.fillText('LOGBOOK / FIELD NOTES', 55, 945);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function Box({ position, size, color, rotation = [0, 0, 0] }: { position: Point; size: Point; color: string; rotation?: Point }) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.88} /></mesh>;
}

function Page({ side, texture }: { side: number; texture: CanvasTexture }) {
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(4.75, 5.8, 32, 1);
    const positions = geo.attributes.position;
    for (let index = 0; index < positions.count; index++) {
      const x = positions.getX(index);
      const normalized = (x + 2.375) / 4.75;
      positions.setZ(index, Math.sin(normalized * Math.PI) * .22);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={[side * 2.4, .36, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={geometry} receiveShadow><meshStandardMaterial map={texture} roughness={1} side={DoubleSide} /></mesh>;
}

function Tree({ position, scale = 1, pale = false }: { position: Point; scale?: number; pale?: boolean }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, .25, 0]} castShadow><cylinderGeometry args={[.035, .045, .5, 5]} /><meshStandardMaterial color="#66543e" /></mesh>
    {[0, 1, 2].map(level => <mesh key={level} position={[0, .45 + level * .22, 0]} castShadow><coneGeometry args={[.32 - level * .07, .65, 5]} /><meshStandardMaterial color={pale ? '#889982' : level === 1 ? '#456b5e' : '#31574c'} flatShading /></mesh>)}
  </group>;
}

function Terrain({ position, size = 1 }: { position: Point; size?: number }) {
  return <group position={position} scale={size}>
    {[0, 1, 2, 3].map(layer => <mesh key={layer} position={[0, layer * .1, 0]} scale={[1.4 - layer * .24, .08, .85 - layer * .14]} rotation={[0, layer * .1, 0]} castShadow receiveShadow><cylinderGeometry args={[1, 1.03, 1, 9]} /><meshStandardMaterial color={layer % 2 === 0 ? '#b9bea4' : '#d0cdb4'} roughness={1} /></mesh>)}
  </group>;
}

function Station({ queue = false }: { queue?: boolean }) {
  const accent = queue ? TEAL : RUST;
  return <group>
    <Box position={[0, .05, 0]} size={[1.5, .12, 1.2]} color="#ad9b75" />
    <Box position={[0, .52, 0]} size={[1.1, .9, .75]} color="#e2d6bc" />
    <mesh position={[0, 1.03, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[.84, .48, 4]} /><meshStandardMaterial color={accent} flatShading /></mesh>
    <Box position={[0, .36, .39]} size={[.28, .55, .045]} color={INK} />
    {[-.35, .35].map(x => <group key={x}><Box position={[x, .68, .395]} size={[.19, .23, .03]} color={INK} /><Box position={[x, .68, .42]} size={[.02, .23, .02]} color="#ceb985" /></group>)}
    <Box position={[.33, 1.1, -.18]} size={[.13, .45, .14]} color="#c6b28e" />
    {queue && [0, 1, 2].map(i => <Box key={i} position={[.8, .13 + i * .09, .15]} size={[.5, .065, .4]} color={i % 2 ? '#d6c4a0' : '#ede4d1'} rotation={[0, i * .11, 0]} />)}
  </group>;
}

function BrowserMonument() {
  return <group position={[-2.7, .53, -.45]} rotation={[0, .15, 0]}>
    <Box position={[0, .6, 0]} size={[1.6, 1.15, .11]} color="#243d39" />
    <Box position={[0, .59, .065]} size={[1.49, 1.02, .025]} color="#f5eedc" />
    <Box position={[0, 1.04, .09]} size={[1.49, .13, .03]} color="#d2c4a7" />
    {[-.62, -.51, -.4].map(x => <mesh key={x} position={[x, 1.04, .115]}><sphereGeometry args={[.025, 8, 8]} /><meshStandardMaterial color={RUST} /></mesh>)}
    <Box position={[-.23, .76, .085]} size={[.78, .08, .03]} color="#677c6b" />
    <Box position={[-.1, .6, .085]} size={[1.04, .035, .03]} color="#c1b89e" />
    <Box position={[-.18, .49, .085]} size={[.88, .035, .03]} color="#c1b89e" />
    <Box position={[-.3, .3, .1]} size={[.62, .2, .05]} color={RUST} />
    <Box position={[-.55, -.02, .16]} size={[.09, .27, .45]} color="#a59069" />
    <Box position={[.55, -.02, .16]} size={[.09, .27, .45]} color="#a59069" />
  </group>;
}

function MapLabel({ text, position, color = INK }: { text: string; position: Point; color?: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.fillStyle = color; ctx.font = '500 35px monospace'; ctx.textAlign = 'center'; ctx.fillText(text, 256, 60); }
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; return map;
  }, [text, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.5, .47]} /><meshBasicMaterial map={texture} transparent depthWrite={false} /></mesh>;
}

function World({ chapter, bearing, skip, onArrive, onFailure }: SceneProps) {
  const { camera, size, invalidate, gl } = useThree();
  const texture = useMemo(makePaperTexture, []);
  const marker = useRef<Group>(null);
  const courier = useRef<Group>(null);
  const animated = useRef({ progress: 0, focus: new Vector3(0, .25, 0), travel: 0, lastSkip: skip });
  const target = useMemo(() => new Vector3(), []);
  const cameraGoal = useMemo(() => new Vector3(), []);
  const isQueue = chapter === 'queue';
  const isPinned = chapter === 'captured' || isQueue;
  const isOverview = chapter === 'overview';

  useEffect(() => { invalidate(); }, [chapter, bearing, skip, invalidate, size]);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    const visible = () => { if (!document.hidden) invalidate(); };
    canvas.addEventListener('webglcontextlost', lost);
    document.addEventListener('visibilitychange', visible);
    return () => { canvas.removeEventListener('webglcontextlost', lost); document.removeEventListener('visibilitychange', visible); };
  }, [gl, onFailure, invalidate]);

  useFrame((_, delta) => {
    if (document.hidden) return;
    const current = animated.current;
    const narrow = size.width < 600;
    const instant = current.lastSkip !== skip;
    current.lastSkip = skip;
    const damp = instant ? 1 : 1 - Math.exp(-Math.min(delta, .045) * 3.1);
    const desired = isOverview ? 0 : isQueue ? 2 : 1;
    current.progress = MathUtils.lerp(current.progress, desired, damp);
    current.travel = MathUtils.lerp(current.travel, isQueue ? 1 : 0, instant ? 1 : damp * .75);
    target.set(isOverview ? 0 : isQueue ? 1.35 : -1.65, .25, 0);
    current.focus.lerp(target, damp);
    const destinationZoom = isQueue ? .86 : .74;
    const closeupZoom = narrow ? .83 : destinationZoom;
    const zoom = isOverview ? 1 : closeupZoom;
    cameraGoal.set(current.focus.x + (6.8 + bearing * 2.6) * zoom, 9.3 * zoom, (10.4 - bearing * 1.7) * zoom);
    if (narrow) cameraGoal.multiplyScalar(1.35);
    camera.position.lerp(cameraGoal, damp);
    camera.lookAt(current.focus);
    if (marker.current) {
      const height = isPinned ? .05 : .6;
      marker.current.position.y = isOverview ? height : MathUtils.lerp(marker.current.position.y, height, damp);
      marker.current.visible = !isOverview;
    }
    if (courier.current) { courier.current.position.copy(route.getPoint(current.travel)); courier.current.position.y += .19; courier.current.visible = isQueue; }
    const pinSettled = !marker.current || Math.abs(marker.current.position.y - (isPinned ? .05 : .6)) < .002;
    const atRest = pinSettled && camera.position.distanceTo(cameraGoal) < .008 && Math.abs(current.progress - desired) < .002 && Math.abs(current.travel - (isQueue ? 1 : 0)) < .002;
    if (!atRest) invalidate(); else onArrive();
  });

  return <>
    <ambientLight intensity={1.3} color="#fff4d9" />
    <hemisphereLight args={['#eaf0e9', '#756649', 1.7]} />
    <directionalLight position={[-3, 9, 4]} intensity={3.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.04} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.37, 0]} receiveShadow><planeGeometry args={[200, 200]} /><shadowMaterial opacity={.18} /></mesh>
    <group rotation={[0, -.12, 0]}>
      <Box position={[0, -.22, 0]} size={[10.2, .18, 6.3]} color="#183c38" />
      <Box position={[0, -.31, .02]} size={[10.25, .055, 6.32]} color="#b29761" />
      <Box position={[0, -.35, .02]} size={[10.3, .04, 6.38]} color="#183c38" />
      {[-1, 1].map(side => <group key={side}>
        {[0, 1, 2, 3, 4, 5, 6].map(layer => <Box key={layer} position={[side * 2.4, -.11 + layer * .063, 0]} size={[4.78, .052, 5.89 - layer * .008]} color={layer % 2 === 0 ? '#d9cdb5' : '#eee3cc'} />)}
        <Page side={side} texture={texture} />
      </group>)}
      <Box position={[0, .4, 0]} size={[.055, .015, 5.8]} color="#938365" />
      <Box position={[1.9, -.19, 3.3]} size={[.35, .025, .6]} color={RUST} />
      <Terrain position={[-3.55, .54, -1.85]} size={.8} />
      <Terrain position={[3.2, .54, -1.6]} size={1.05} />
      <Terrain position={[3.6, .54, 1.5]} size={.55} />
      <Terrain position={[-3.4, .55, 1.7]} size={.47} />
      {Array.from({ length: 18 }, (_, i) => {
        const side = i < 9 ? -1 : 1;
        const n = i % 9;
        return <Tree key={i} position={[side * (2.35 + n % 3 * .61), .63, -1.65 + Math.floor(n / 3) * .43]} scale={.6 + (i % 4) * .14} pale={i % 3 === 0} />;
      })}
      <BrowserMonument />
      <group position={[2.65, .62, -.7]} rotation={[0, -.18, 0]}><Station queue /></group>
      <group position={[3.65, .62, 1]} scale={.45}><Station /></group>
      <MapLabel text="01 / ANNOTATION" position={[-2.5, .61, 1.85]} color={RUST} />
      <MapLabel text="02 / QUEUE" position={[2.6, .64, .78]} color={TEAL} />
      <MapLabel text="THE ATLAS OF SMALL CHANGES" position={[.9, .58, 2.45]} />
      {Array.from({ length: 31 }, (_, i) => {
        const p = route.getPoint(i / 30); const tangent = route.getTangent(i / 30);
        return <mesh key={i} position={p} rotation={[-Math.PI / 2, 0, -Math.atan2(tangent.z, tangent.x)]}><planeGeometry args={[.105, .028]} /><meshBasicMaterial color={isQueue ? TEAL : '#a99670'} /></mesh>;
      })}
      <group position={[-2.45, .05, .3]} ref={marker}>
        <mesh position={[0, .94, 0]} castShadow><cylinderGeometry args={[.025, .013, .78, 8]} /><meshStandardMaterial color="#5a4135" metalness={.3} roughness={.5} /></mesh>
        <mesh position={[0, 1.39, 0]} castShadow><sphereGeometry args={[.17, 20, 14]} /><meshStandardMaterial color={RUST} roughness={.5} /></mesh>
        <mesh position={[-.04, 1.45, .12]}><sphereGeometry args={[.045, 8, 8]} /><meshBasicMaterial color="#efd7b5" /></mesh>
        <mesh position={[0, .535, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.13, .17, 40]} /><meshBasicMaterial color={RUST} side={DoubleSide} /></mesh>
      </group>
      <group ref={courier}><Box position={[0, .1, 0]} size={[.35, .1, .25]} color={RUST} /><Box position={[0, .16, 0]} size={[.29, .02, .19]} color="#f6e7c8" /></group>
      <group position={[.1, .55, .7]} rotation={[0, -.38, 0]}>
        {Array.from({ length: 8 }, (_, i) => <Box key={i} position={[(i - 4) * .13, Math.sin(i / 7 * Math.PI) * .13, 0]} size={[.12, .055, .45]} color="#b3976f" />)}
      </group>
      <mesh position={[-4, .64, 2.3]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.28, .3, 48]} /><meshBasicMaterial color="#9b8152" /></mesh>
      <mesh position={[-4, .65, 2.3]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}><planeGeometry args={[.035, .8]} /><meshBasicMaterial color="#9b8152" /></mesh>
    </group>
  </>;
}

export default function Diorama(props: SceneProps) {
  return <Canvas shadows={{ type: PCFShadowMap }} frameloop="demand" dpr={[1, 1.5]} camera={{ position: [6.8, 9.3, 10.4], fov: 39, near: .1, far: 100 }} gl={{ antialias: true, powerPreference: 'low-power' }} fallback={<span>Use the readable edition if the illustrated world is unavailable.</span>}><World {...props} /></Canvas>;
}
