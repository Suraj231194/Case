"use client";
import {
  Suspense,
  useMemo,
  useRef,
  useEffect,
  useState,
  Component,
  type ReactNode,
  type MutableRefObject,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  RoundedBox,
  useTexture,
  Html,
  ContactShadows,
  Environment,
  Lightformer,
} from "@react-three/drei";
import * as THREE from "three";
import {
  PhotographicPrinter as Printer,
  DetailedHeatPress as HeatPress,
} from "./ProductMachines";

type Progress = MutableRefObject<{ value: number }>;
const aqua = "#08bfc0";
const { clamp, damp } = THREE.MathUtils;
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
/** Share of each stage spent travelling to its station; the rest is a slow hold. */
const TRAVEL = 0.42;
export const stations: [number, number, number][] = [
  [-9, 2, 0],
  [-3, 2, 0],
  [3, 2, 0],
  [9, 2, 0],
  [9, -4, 0],
  [3, -4, 0],
  [-3, -4, 0],
  [-9, -4, 0],
];
function Block({
  size,
  position = [0, 0, 0],
  color = "#eee",
  radius = 0.08,
  metal = 0.1,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  color?: string;
  radius?: number;
  metal?: number;
}) {
  return (
    <RoundedBox
      args={size}
      radius={radius}
      smoothness={4}
      position={position}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.28} metalness={metal} />
    </RoundedBox>
  );
}
function Case({
  blank = false,
  phone = false,
  reveal = 1,
  progress,
}: {
  blank?: boolean;
  phone?: boolean;
  reveal?: number;
  progress?: Progress;
}) {
  const artwork = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame(() => {
    if (artwork.current && progress)
      artwork.current.opacity = THREE.MathUtils.smoothstep(
        progress.current.value * 8 - 7,
        0.05,
        0.8,
      );
  });
  const texture = useTexture("/assets/alpine-cover-hd.jpg");
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const rounded = (
      p: THREE.Shape | THREE.Path,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) => {
      p.moveTo(x + r, y);
      p.lineTo(x + w - r, y);
      p.quadraticCurveTo(x + w, y, x + w, y + r);
      p.lineTo(x + w, y + h - r);
      p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      p.lineTo(x + r, y + h);
      p.quadraticCurveTo(x, y + h, x, y + h - r);
      p.lineTo(x, y + r);
      p.quadraticCurveTo(x, y, x + r, y);
    };
    rounded(s, -0.8, -1.55, 1.6, 3.1, 0.21);
    if (!phone) {
      const h = new THREE.Path();
      rounded(h, -0.59, 0.65, 1.18, 0.68, 0.16);
      s.holes.push(h);
    }
    return s;
  }, [phone]);
  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.035,
      bevelSegments: 3,
      steps: 1,
    });
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (pos.getX(i) + 0.8) / 1.6, (pos.getY(i) + 1.55) / 3.1);
    return g;
  }, [shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial
          color={blank ? "#f8faf8" : phone ? "#1c282b" : "#53839a"}
          metalness={0.6}
          roughness={0.21}
          clearcoat={1}
        />
      </mesh>
      {!blank && !phone && (
        <mesh geometry={geometry} position={[0, 0, 0.015]}>
          <meshPhysicalMaterial
            ref={artwork}
            map={texture}
            roughness={0.32}
            metalness={0.04}
            transparent
            opacity={reveal}
            clearcoat={0.6}
          />
        </mesh>
      )}
      {phone && (
        <>
          <Block
            size={[1.44, 2.91, 0.025]}
            position={[0, 0, 0.19]}
            color="#e5fcfa"
            radius={0.16}
          />
          <mesh position={[0, -0.03, 0.212]}>
            <planeGeometry args={[1.22, 2.1]} />
            <meshBasicMaterial map={texture} />
          </mesh>
          <Block
            size={[0.48, 0.12, 0.03]}
            position={[0, 1.3, 0.23]}
            color="#111"
            radius={0.055}
          />
          <Html transform position={[0, 1.09, 0.24]} scale={0.1}>
            <div className="app-label">
              CASE <span>DESIGN STUDIO</span>
            </div>
          </Html>
        </>
      )}
      <Block
        size={[0.035, 0.43, 0.08]}
        position={[-0.85, 0.1, 0.07]}
        color="#667980"
        radius={0.015}
      />
      <Block
        size={[0.035, 0.27, 0.08]}
        position={[0.85, 0.45, 0.07]}
        color="#667980"
        radius={0.015}
      />
    </group>
  );
}
function Paper({
  printed = false,
  amount = 1,
}: {
  printed?: boolean;
  amount?: number;
}) {
  const t = useTexture("/assets/alpine-cover-hd.jpg");
  useEffect(() => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
  }, [t]);
  return (
    <group rotation={[0, -0.12, -0.1]}>
      <Block size={[1.9, 2.9, 0.025]} color="#fff" radius={0.018} />
      {printed && (
        <mesh position={[0, 0, 0.024]}>
          <planeGeometry args={[1.64, 2.57]} />
          <meshStandardMaterial
            map={t}
            transparent
            opacity={amount}
            roughness={0.7}
          />
        </mesh>
      )}
      <mesh position={[0.77, -1.28, 0.025]} rotation={[0, 0, 0.2]}>
        <planeGeometry args={[0.28, 0.28]} />
        <meshStandardMaterial color="#e5e9e8" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
function Mould() {
  return (
    <group rotation={[0.1, -0.45, -0.12]}>
      <Block
        size={[1.65, 3.12, 0.4]}
        color="#9eaaa9"
        radius={0.18}
        metal={0.7}
      />
      <Block
        size={[1.42, 2.91, 0.07]}
        position={[0, 0, 0.23]}
        color="#cdd3d1"
        radius={0.14}
        metal={0.6}
      />
      <Block
        size={[0.9, 0.57, 0.08]}
        position={[0, 1.03, 0.28]}
        color="#939e9b"
        radius={0.1}
      />
      <Html transform position={[0, -0.2, 0.29]} scale={0.15}>
        <div className="mould-label">
          <small>UNIVERSAL MOULD</small>
        </div>
      </Html>
    </group>
  );
}
function Product({
  index,
  phase,
  progress,
}: {
  index: number;
  phase: number;
  progress?: Progress;
}) {
  switch (index) {
    case 0:
      return <Case phone />;
    case 1:
      return <Paper />;
    case 2:
      return <Printer progress={progress} />;
    case 3:
      return <Paper printed />;
    case 4:
      return <HeatPress progress={progress} />;
    case 5:
      return <Mould />;
    case 6:
      return <Case blank />;
    default:
      return <Case reveal={Math.min(1, phase * 2 + 0.1)} progress={progress} />;
  }
}
function ProcessWorld({ progress }: { progress: Progress }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const path = useRef<THREE.Mesh>(null);
  const state = useRef({ p: 0 });
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-10, 0, -1),
          new THREE.Vector3(-3, 0, -1),
          new THREE.Vector3(3, 0, -1),
          new THREE.Vector3(9, 0, -1),
          new THREE.Vector3(12, -1.5, -1),
          new THREE.Vector3(12, -4, -1),
          new THREE.Vector3(9, -6, -1),
          new THREE.Vector3(3, -6, -1),
          new THREE.Vector3(-3, -6, -1),
          new THREE.Vector3(-10, -6, -1),
        ],
        false,
        "catmullrom",
        0.25,
      ),
    [],
  );
  const tube = useMemo(
    () => new THREE.TubeGeometry(curve, 360, 0.035, 8, false),
    [curve],
  );
  useEffect(() => () => tube.dispose(), [tube]);
  const scratch = useMemo(
    () => ({
      from: new THREE.Vector3(),
      to: new THREE.Vector3(),
      look: new THREE.Vector3(),
      lookTo: new THREE.Vector3(),
    }),
    [],
  );
  // Camera framing relative to a station: drifts in and across while a stage is held.
  const frame = (out: THREE.Vector3, station: number, hold: number) =>
    out
      .set(...stations[station])
      .add({ x: 0.7 - 0.55 * hold, y: 0.2, z: 8.5 - 0.75 * hold });
  useFrame(({ camera }, delta) => {
    const s = state.current;
    s.p = damp(s.p, progress.current.value, 7, delta);
    const f = s.p * 7.999;
    const i = Math.min(7, Math.floor(f));
    const prev = Math.max(0, i - 1);
    const local = f - i;
    const t = easeInOut(clamp(local / TRAVEL, 0, 1));
    const lookT = easeInOut(clamp(local / (TRAVEL * 0.8), 0, 1));
    const hold = clamp((local - TRAVEL) / (1 - TRAVEL), 0, 1);
    const { from, to, look, lookTo } = scratch;
    // Each stage starts exactly where the previous one ended, so the move is
    // continuous in both scroll directions. Stage 1 opens with a push-in.
    if (i === 0) frame(from, 0, 0).z += 2.4;
    else frame(from, prev, 1);
    frame(to, i, hold);
    const travel = i === 0 ? 0 : Math.sin(t * Math.PI);
    camera.position.lerpVectors(from, to, t);
    camera.position.z += travel * 2.6;
    camera.position.y += travel * 0.45;
    look.set(...stations[prev]);
    lookTo.set(...stations[i]);
    look.lerp(lookTo, lookT);
    camera.lookAt(look);
    camera.rotateZ(-Math.sign(lookTo.x - stations[prev][0]) * travel * 0.045);
    tube.setDrawRange(
      0,
      Math.max(3, Math.floor((s.p * 0.94 + 0.06) * 360) * 48),
    );
    groups.current.forEach((g, j) => {
      if (!g) return;
      const d = f - j;
      g.rotation.y =
        j === i
          ? -0.23 + Math.sin(Math.min(1, Math.max(0, d)) * Math.PI) * 0.45
          : 0;
      g.rotation.z = j === i ? Math.sin(d * Math.PI) * 0.04 : 0;
      // The current product comes forward; its neighbours recede.
      g.scale.setScalar(damp(g.scale.x, j === i ? 1 : 0.82, 5, delta));
    });
  });
  return (
    <>
      <mesh ref={path} geometry={tube}>
        <meshStandardMaterial
          color={aqua}
          emissive={aqua}
          emissiveIntensity={0.4}
        />
      </mesh>
      {stations.map((pos, i) => (
        <group key={i} position={pos}>
          <group
            ref={(g) => {
              groups.current[i] = g;
            }}
          >
            <AnimatedProduct index={i} progress={progress} />
          </group>
          <mesh position={[-1.7, -1.9, 0.05]}>
            <circleGeometry args={[0.19, 32]} />
            <meshBasicMaterial color={aqua} />
          </mesh>
          <Html position={[-1.7, -1.9, 0.07]} center>
            <span className="world-number">{i + 1}</span>
          </Html>
        </group>
      ))}
    </>
  );
}
function AnimatedProduct({
  index,
  progress,
}: {
  index: number;
  progress: Progress;
}) {
  const ref = useRef<THREE.Group>(null);
  const paper = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = THREE.MathUtils.clamp(progress.current.value * 8 - index, 0, 1);
    if (ref.current) {
      ref.current.rotation.y =
        index === 6
          ? p * Math.PI * 1.8
          : index === 0
            ? -0.35 + p * 0.7
            : index === 1 || index === 3
              ? -0.3 + p * 0.6
              : index === 7
                ? -0.45 + p * 0.9
                : 0;
      ref.current.position.y = Math.sin(p * Math.PI) * 0.12;
    }
    if (paper.current) paper.current.position.z = p * 0.65;
  });
  return (
    <group ref={ref}>
      <group ref={paper}>
        <Product index={index} phase={0.5} progress={progress} />
      </group>
    </group>
  );
}
function HeroWorld({ scroll }: { scroll?: Progress }) {
  const ref = useRef<THREE.Group>(null);
  const back = useRef<THREE.Group>(null);
  useFrame(({ pointer, clock }, delta) => {
    const s = scroll?.current.value ?? 0;
    const bob = Math.sin(clock.elapsedTime * 0.9) * 0.05;
    if (ref.current) {
      ref.current.rotation.y = damp(
        ref.current.rotation.y,
        -0.38 + pointer.x * 0.16 + s * 1.15,
        2.5,
        delta,
      );
      ref.current.rotation.x = damp(
        ref.current.rotation.x,
        -0.13 + pointer.y * 0.08 - s * 0.2,
        2.5,
        delta,
      );
      ref.current.position.y = damp(
        ref.current.position.y,
        0.1 + bob + s * 0.45,
        4,
        delta,
      );
    }
    // The blank case slides out from behind as the page scrolls.
    if (back.current) {
      back.current.position.x = damp(
        back.current.position.x,
        -1.25 - s * 0.95,
        4,
        delta,
      );
      back.current.position.y = damp(
        back.current.position.y,
        -0.05 - bob - s * 0.3,
        4,
        delta,
      );
      back.current.rotation.z = damp(
        back.current.rotation.z,
        -0.33 - s * 0.3,
        4,
        delta,
      );
    }
  });
  return (
    <>
      <group
        ref={ref}
        rotation={[-0.12, -0.38, -0.18]}
        position={[0.35, 0.1, 0]}
        scale={1.35}
      >
        <Case />
      </group>
      <group
        ref={back}
        position={[-1.25, -0.05, -0.8]}
        rotation={[0.08, -0.5, -0.33]}
        scale={1.19}
      >
        <Case blank />
      </group>
      <ContactShadows
        position={[0, -2.4, 0]}
        opacity={0.28}
        scale={10}
        blur={2.8}
        far={6}
      />
    </>
  );
}
class Boundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}
function SceneFallback({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return (
    <div className="scene-fallback">
      <img
        src="/assets/alpine-cover-hd.jpg"
        alt="HD photograph of a skier in pink against snowy mountains"
      />
      <span>YOUR MEMORY. MADE PERSONAL.</span>
    </div>
  );
}
export default function ThreeDScene({
  progress,
  scroll,
  hero = false,
}: {
  progress?: Progress;
  scroll?: Progress;
  hero?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "100px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const fallback = <SceneFallback onReady={() => setReady(true)} />;
  return (
    <div
      ref={root}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <Boundary fallback={fallback}>
        {lost ? (
          fallback
        ) : (
          <Canvas
            frameloop={visible ? "always" : "demand"}
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 8], fov: 36 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            fallback={fallback}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener(
                "webglcontextlost",
                () => setLost(true),
                { once: true },
              );
            }}
          >
            <ambientLight intensity={1.25} />
            <directionalLight
              position={[3, 5, 6]}
              intensity={4}
              color="#ffffff"
            />
            <directionalLight
              position={[-4, 0, 3]}
              intensity={2}
              color="#8ce7e0"
            />
            <pointLight position={[1, -3, 4]} intensity={15} />
            <Suspense fallback={null}>
              {/* Soft studio reflections for the metal and clear-coat finishes. */}
              <Environment
                resolution={256}
                frames={1}
                environmentIntensity={0.6}
              >
                <Lightformer
                  form="rect"
                  intensity={3}
                  position={[0, 5, 6]}
                  scale={[12, 2.5, 1]}
                />
                <Lightformer
                  form="rect"
                  intensity={1.6}
                  color="#bff5ef"
                  position={[-7, 0, 3]}
                  scale={[8, 4, 1]}
                />
                <Lightformer
                  form="ring"
                  intensity={2.2}
                  position={[6, 2, 5]}
                  scale={2.5}
                />
              </Environment>
              {hero ? (
                <HeroWorld scroll={scroll} />
              ) : (
                progress && <ProcessWorld progress={progress} />
              )}
              <Ready onReady={() => setReady(true)} />
            </Suspense>
          </Canvas>
        )}
      </Boundary>
      {!ready && !lost && (
        <div className="scene-loading" aria-live="polite">
          <i />
          Preparing your experience
        </div>
      )}
    </div>
  );
}
