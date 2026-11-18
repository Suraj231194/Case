"use client";

import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { SublimationPrinter, DetailedHeatPress } from "./ProductMachines";
import { DesignPhone, PhoneCase, Sheet, UniversalMould, local, type Progress } from "./Models";
import { steps, TRAVEL } from "./process";

const COUNT = steps.length;
const RADIUS = 7.4;
const ARC = (Math.PI * 2) / COUNT;
const { clamp, smoothstep } = THREE.MathUtils;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** One camera shot per stage: position relative to the product, and a slight roll. */
const shots: { at: [number, number, number]; roll: number }[] = [
  { at: [0.2, 0.3, 8.4], roll: 0 },
  { at: [1.5, 1.9, 8.2], roll: -0.035 },
  { at: [-1.1, 0.5, 9.2], roll: 0.02 },
  { at: [1.0, -0.6, 7.6], roll: 0.05 },
  { at: [0, 3.1, 8.6], roll: 0 },
  { at: [-1.8, 1.3, 7.9], roll: -0.04 },
  { at: [0.7, 0.1, 7.8], roll: 0.025 },
  { at: [-0.3, 0.45, 8.2], roll: 0 },
];

/** Where the scroll position puts the carousel: whole numbers rest on a stage. */
function stagePosition(value: number) {
  const f = clamp(value, 0, 1) * COUNT - 1e-4;
  const i = clamp(Math.floor(f), 0, COUNT - 1);
  const t = ease(clamp((f - i) / TRAVEL, 0, 1));
  const hold = clamp((f - i - TRAVEL) / (1 - TRAVEL), 0, 1);
  return { i, t, hold, position: i === 0 ? 0 : i - 1 + t };
}

function Product({ index, progress }: { index: number; progress: Progress }) {
  switch (index) {
    case 0: return <DesignPhone progress={progress} />;
    case 1: return <Sheet progress={progress} index={1} />;
    case 2: return <SublimationPrinter progress={progress} />;
    case 3: return <Sheet printed progress={progress} index={3} />;
    case 4: return <DetailedHeatPress progress={progress} />;
    case 5: return <group scale={0.86}><UniversalMould progress={progress} /></group>;
    case 6: return <PhoneCase progress={progress} />;
    default: return <PhoneCase printed progress={progress} />;
  }
}

/** Each product's own motion while its stage is held: unfurl, swing, explode, spin. */
function Station({ index, progress, carousel }: { index: number; progress: Progress; carousel: { current: number } }) {
  const turn = useRef<THREE.Group>(null);
  const move = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = move.current;
    const outer = turn.current;
    if (!g || !outer) return;
    const p = local(progress, index);
    const settle = smoothstep(p, TRAVEL * 0.6, 1);
    const offset = index - carousel.current;
    // Turn toward the viewer as it swings in.
    outer.rotation.y = -offset * ARC * 0.55;
    // Only the products being swapped are on show: neighbours shrink away at rest.
    const away = Math.abs(offset);
    const shown = 1 - smoothstep(away, 0.28, 0.92);
    outer.visible = shown > 0.001;
    outer.scale.setScalar(Math.max(0.001, shown * (1 - 0.18 * clamp(away, 0, 1))));
    const float = Math.sin(clock.elapsedTime * 0.9 + index) * 0.05;
    g.position.set(0, float, 0);
    g.rotation.set(0, 0, 0);
    switch (index) {
      case 0:
        g.rotation.set(-0.08, -0.4 + settle * 0.7, 0.04 - settle * 0.08);
        break;
      case 1: // the blank sheet lifts from flat to upright
        g.rotation.set(-1.15 * (1 - smoothstep(p, 0, 0.7)), -0.25 + settle * 0.4, -0.08);
        break;
      case 2: // the printer turns slowly while the sheet feeds out
        g.rotation.set(0, -0.12 + settle * 0.3, 0);
        break;
      case 3: // the printed film swings to show its artwork
        g.rotation.set(0.05, 0.55 - settle * 0.9, -0.1 + settle * 0.14);
        g.position.z = settle * 0.35;
        break;
      case 4:
        g.rotation.set(0, -0.15 + settle * 0.3, 0);
        break;
      case 5:
        g.rotation.set(0.45 - settle * 0.25, -0.6 + settle * 0.5, -0.1);
        break;
      case 6: // a full turn reveals the blank shell from every side
        g.rotation.set(0.06, ease(smoothstep(p, 0.1, 1)) * Math.PI * 2 - 0.3, 0);
        break;
      case 7:
        g.rotation.set(0.04, -0.5 + settle * 0.85, 0.1 - settle * 0.12);
        g.position.y = float + settle * 0.12;
        break;
    }
  });
  const angle = index * ARC;
  return (
    <group position={[Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS]} rotation={[0, angle, 0]}>
      <group ref={turn}>
        <group ref={move}>
          <Product index={index} progress={progress} />
        </group>
      </group>
    </group>
  );
}

function Showroom({ progress, active, onReady }: { progress: Progress; active: number; onReady: () => void }) {
  const ring = useRef<THREE.Group>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const edge = useRef<THREE.MeshBasicMaterial>(null);
  const carousel = useRef(0);
  const smooth = useRef(0);
  const { size } = useThree();
  const colors = useMemo(() => steps.map((s) => new THREE.Color(s.accent)), []);
  const scratch = useMemo(() => ({ from: new THREE.Vector3(), to: new THREE.Vector3(), tint: new THREE.Color() }), []);

  useFrame(({ camera, pointer }, delta) => {
    smooth.current = THREE.MathUtils.damp(smooth.current, progress.current.value, 6, delta);
    const { i, t, hold, position } = stagePosition(smooth.current);
    carousel.current = position;
    if (ring.current) ring.current.rotation.y = -position * ARC;

    const prev = Math.max(0, i - 1);
    const { from, to, tint } = scratch;
    const shot = (out: THREE.Vector3, s: number, h: number) =>
      out.set(...shots[s].at).add({ x: -0.5 * h, y: -0.15 * h, z: -0.7 * h });
    if (i === 0) shot(from, 0, 0).z += 2.2;
    else shot(from, prev, 1);
    shot(to, i, hold);
    const swoop = i === 0 ? 0 : Math.sin(t * Math.PI);
    camera.position.lerpVectors(from, to, i === 0 ? smoothstep(hold + t, 0, 1) : t);
    camera.position.z += swoop * 1.6;
    camera.position.z *= 1 + Math.max(0, 1.15 - size.width / size.height) * 0.42;
    camera.position.x += pointer.x * 0.35;
    camera.position.y += pointer.y * 0.22;
    camera.lookAt(0, -0.42, 0);
    camera.rotateZ(THREE.MathUtils.lerp(shots[prev].roll, shots[i].roll, t) - swoop * 0.03);

    tint.copy(colors[prev]).lerp(colors[i], i === 0 ? 1 : t);
    if (rim.current) rim.current.color.copy(tint);
    if (halo.current) halo.current.color.copy(tint);
    if (edge.current) edge.current.color.copy(tint);
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#f3ede3", "#0b1214", 0.6]} />
      <directionalLight position={[4, 6, 7]} intensity={3.4} />
      <directionalLight position={[-5, 1, 5]} intensity={0.9} color="#cfe9e6" />
      <directionalLight ref={rim} position={[-2, 3, -6]} intensity={5} />
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1} environmentIntensity={0.7}>
          <Lightformer form="rect" intensity={3} position={[0, 5, 6]} scale={[12, 2.5, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#e6c897" position={[-7, 0, 3]} scale={[8, 4, 1]} />
          <Lightformer form="ring" intensity={2.2} position={[6, 2, 5]} scale={2.5} />
        </Environment>
        <group position={[0, 0, -RADIUS]}>
          <group ref={ring}>
            {steps.map((_, i) => (
              <Station key={i} index={i} progress={progress} carousel={carousel} />
            ))}
          </group>
        </group>
        <Ready onReady={onReady} />
      </Suspense>
      {/* The pedestal: a slim matte disc with a lit edge and a soft halo, fixed at the front of the ring. */}
      <group position={[0, -2.02, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[1.85, 1.95, 0.08, 96]} />
          <meshStandardMaterial color="#0a0f10" metalness={0.3} roughness={0.6} envMapIntensity={0.25} />
        </mesh>
        <mesh position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.79, 1.84, 128]} />
          <meshBasicMaterial ref={edge} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.78, 96]} />
          <meshBasicMaterial ref={halo} transparent opacity={0.05} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
      <ContactShadows position={[0, -1.97, 0]} scale={5} blur={2.2} far={3} opacity={0.65} resolution={512} color="#000000" />
      <Sparkles count={70} scale={[9, 5.5, 5]} position={[0, 0.4, 0]} size={2.2} speed={0.28} opacity={0.55} color={steps[active].accent} />
      {active === 4 && <Sparkles count={40} scale={[3.4, 2.6, 2.2]} position={[0, 0.6, 0]} size={3.4} speed={0.9} opacity={0.8} color="#ffc48f" noise={0.4} />}
    </>
  );
}

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => onReady(), [onReady]);
  return null;
}

export default function ThreeDScene({
  progress,
  active,
  fallback,
}: {
  progress: Progress;
  active: number;
  fallback: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={root} className="stage-canvas">
      <Boundary fallback={fallback}>
        {lost ? (
          fallback
        ) : (
          <Canvas
            frameloop={visible ? "always" : "never"}
            dpr={[1, 1.75]}
            camera={{ position: [0, 0, 10], fov: 34, near: 0.1, far: 60 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            onCreated={({ gl }) => {
              gl.toneMappingExposure = 1.05;
              gl.domElement.addEventListener("webglcontextlost", () => setLost(true), { once: true });
            }}
          >
            <Showroom progress={progress} active={active} onReady={markReady} />
          </Canvas>
        )}
      </Boundary>
      {!ready && !lost && (
        <div className="stage-loading" aria-hidden="true">
          <i /> Preparing the showroom
        </div>
      )}
    </div>
  );
}
