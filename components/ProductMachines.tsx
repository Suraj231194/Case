"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

type Progress = MutableRefObject<{ value: number }>;
type Vector = [number, number, number];

/** Clamp fillets to the thickness: oversized radii distort thin metal panels. */
function Part({
  size,
  at = [0, 0, 0],
  color = "#c4cccb",
  radius = 0.045,
  metalness = 0.65,
  roughness = 0.3,
}: {
  size: Vector;
  at?: Vector;
  color?: string;
  radius?: number;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <RoundedBox
      args={size}
      position={at}
      radius={Math.min(radius, ...size.map((n) => n * 0.44))}
      smoothness={3}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        clearcoat={color === "#039da4" ? 0.45 : 0.08}
        clearcoatRoughness={0.25}
      />
    </RoundedBox>
  );
}

function Screw({ at, top = false }: { at: Vector; top?: boolean }) {
  return (
    <group position={at} rotation={top ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.012, 12]} />
        <meshStandardMaterial
          color="#b8c0be"
          metalness={0.95}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <boxGeometry args={[0.027, 0.004, 0.002]} />
        <meshBasicMaterial color="#4d5556" />
      </mesh>
    </group>
  );
}

function Label({
  children,
  at,
  size = 0.055,
  color = "#7f9697",
  rotation = [0, 0, 0],
}: {
  children: string;
  at: Vector;
  size?: number;
  color?: string;
  rotation?: Vector;
}) {
  // Canvas textures keep tiny engraved/control text local; no remote font request.
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 1024, 128);
    ctx.font = "500 62px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(children, 512, 64);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [children, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={at} rotation={rotation}>
      <planeGeometry args={[size * 8, size]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * The workshop's sublimation printer, modelled on the supplied photographs: a charcoal
 * matte body, a ridged rear paper support propped on its arm, and a front output tray.
 * The printed sheet feeds out over the tray while the artwork appears on it.
 */
export function SublimationPrinter({ progress }: { progress?: Progress }) {
  const artwork = useTexture("/assets/alpine-cover-hd.jpg");
  const sheet = useRef<THREE.Group>(null);
  const ink = useRef<THREE.MeshStandardMaterial>(null);
  const led = useRef<THREE.MeshBasicMaterial>(null);
  useEffect(() => {
    artwork.colorSpace = THREE.SRGBColorSpace;
    artwork.needsUpdate = true;
  }, [artwork]);
  useFrame(({ clock }) => {
    const p = THREE.MathUtils.clamp((progress?.current.value ?? 0.34) * 8 - 2, 0, 1);
    const feed = THREE.MathUtils.smoothstep(p, 0.12, 0.8);
    if (sheet.current) sheet.current.position.z = 0.15 + feed * 1.05;
    if (ink.current) ink.current.opacity = THREE.MathUtils.smoothstep(p, 0.25, 0.85);
    if (led.current) led.current.color.set(feed > 0 && feed < 1 && Math.sin(clock.elapsedTime * 8) > 0 ? "#9ff0c4" : "#3d6b55");
  });
  const body = "#30363a";
  const trim = "#24292c";
  return (
    <group rotation={[0.38, -0.55, 0]} position={[0, -0.25, 0]} scale={0.92}>
      {/* Main body, top cover and a recessed output slot. */}
      <Part size={[3.5, 1.05, 2.4]} at={[0, 0, 0]} color={body} radius={0.16} metalness={0.1} roughness={0.72} />
      <Part size={[3.36, 0.14, 1.7]} at={[0, 0.56, -0.28]} color="#383f43" radius={0.07} metalness={0.1} roughness={0.6} />
      <Part size={[3.42, 0.03, 0.04]} at={[0, 0.1, 1.205]} color="#1b1f21" radius={0.01} metalness={0.2} roughness={0.5} />
      <Part size={[2.3, 0.1, 0.06]} at={[0, -0.06, 1.2]} color="#0b0d0e" radius={0.03} metalness={0.1} roughness={0.8} />
      {/* Front output tray. */}
      <Part size={[2.1, 0.05, 1.3]} at={[0, -0.27, 1.75]} color={trim} radius={0.03} metalness={0.15} roughness={0.55} />
      <Part size={[2.1, 0.05, 0.05]} at={[0, -0.27, 2.38]} color={trim} radius={0.02} metalness={0.15} roughness={0.55} />
      {/* Rear paper support, ridged, propped back on a small arm. */}
      <group position={[0, 0.62, -1.02]} rotation={[-0.38, 0, 0]}>
        <Part size={[2.5, 1.55, 0.06]} at={[0, 0.78, 0]} color={trim} radius={0.03} metalness={0.1} roughness={0.65} />
        {Array.from({ length: 11 }, (_, i) => (
          <Part key={i} size={[0.025, 1.35, 0.02]} at={[-1.0 + i * 0.2, 0.8, 0.035]} color="#2d3337" radius={0.008} metalness={0.1} roughness={0.6} />
        ))}
        {/* A blank sheet waiting in the rear feed. */}
        <mesh position={[0, 0.82, 0.07]}>
          <planeGeometry args={[1.7, 1.3]} />
          <meshStandardMaterial color="#f7f6f2" roughness={0.85} />
        </mesh>
      </group>
      <Part size={[0.05, 0.62, 0.05]} at={[0.95, 0.88, -0.72]} color="#1c2023" radius={0.015} metalness={0.3} roughness={0.5} />
      {/* Control buttons and status light, front left of the top. */}
      {[-1.42, -1.22, -1.02].map((x) => (
        <mesh key={x} position={[x, 0.53, 0.85]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.03, 20]} />
          <meshStandardMaterial color="#454c51" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[-0.8, 0.53, 0.85]}>
        <boxGeometry args={[0.07, 0.02, 0.04]} />
        <meshBasicMaterial ref={led} color="#3d6b55" toneMapped={false} />
      </mesh>
      {/* The printed sheet slides out over the tray as the artwork appears. */}
      <group ref={sheet} position={[0, -0.215, 0.15]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.75]}>
          <planeGeometry args={[1.62, 1.5]} />
          <meshStandardMaterial color="#fbfaf6" roughness={0.8} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0.75]}>
          <planeGeometry args={[1.42, 1.32]} />
          <meshStandardMaterial ref={ink} map={artwork} transparent opacity={0} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/** A mechanical assembly: recessed chamber, seal, hinged platen, controls and feet. */
export function DetailedHeatPress({ progress }: { progress?: Progress }) {
  const lid = useRef<THREE.Group>(null);
  const film = useRef<THREE.Group>(null);
  const heat = useRef<THREE.PointLight>(null);
  const screen = useRef<THREE.MeshBasicMaterial>(null);
  const art = useTexture("/assets/alpine-cover-hd.jpg");
  useFrame(() => {
    const p = THREE.MathUtils.clamp(
      (progress?.current.value ?? 0.6) * 8 - 4,
      0,
      1,
    );
    // The camera first arrives on the open press, then the lid closes to transfer.
    if (lid.current)
      lid.current.rotation.x =
        -1.48 * (1 - THREE.MathUtils.smoothstep(p, 0.58, 0.94));
    if (film.current)
      film.current.position.y =
        0.03 + (1 - THREE.MathUtils.smoothstep(p, 0.3, 0.55)) * 0.45;
    if (heat.current)
      heat.current.intensity = THREE.MathUtils.smoothstep(p, 0.72, 0.96) * 0.6;
    if (screen.current)
      screen.current.color.set(p > 0.75 ? "#a4f4b8" : "#9be5eb");
  });
  return (
    <group rotation={[0.3, -0.24, 0]} position={[0, -0.32, 0]} scale={1.05}>
      {/* Two-piece painted aluminium shell, with a visible assembly seam. */}
      <Part
        size={[3.32, 0.24, 2.28]}
        at={[0, -0.65, 0]}
        color="#027f88"
        radius={0.12}
        roughness={0.3}
      />
      <Part
        size={[3.4, 0.32, 2.34]}
        at={[0, -0.43, 0]}
        color="#039da4"
        radius={0.13}
        roughness={0.27}
      />
      {[-1.33, 1.33].flatMap((x) =>
        [-0.8, 0.8].map((z) => (
          <Part
            key={`${x}-${z}`}
            size={[0.26, 0.15, 0.27]}
            at={[x, -0.82, z]}
            color="#252b2b"
            metalness={0}
            roughness={0.88}
          />
        )),
      )}
      {/* Rim and well are separate rails, leaving a genuinely recessed cavity. */}
      <Part
        size={[3.3, 0.09, 0.31]}
        at={[0, -0.23, 1.0]}
        color="#039da4"
        radius={0.035}
      />
      <Part size={[3.3, 0.09, 0.2]} at={[0, -0.23, -1.04]} color="#039da4" />
      {[-1.52, 1.52].map((x) => (
        <Part
          key={x}
          size={[0.3, 0.1, 1.85]}
          at={[x, -0.23, 0]}
          color="#039da4"
        />
      ))}
      <Part
        size={[2.76, 0.035, 1.83]}
        at={[0, -0.25, -0.03]}
        color="#273638"
        roughness={0.6}
        metalness={0.1}
      />
      <Part
        size={[2.54, 0.035, 1.59]}
        at={[0, -0.225, -0.03]}
        color="#acb8b9"
        roughness={0.34}
        metalness={0.9}
      />
      <Part
        size={[2.3, 0.023, 1.35]}
        at={[0, -0.2, -0.03]}
        color="#293c3f"
        roughness={0.38}
      />
      {/* Four gasket rails and the brushed-steel inner tray. */}
      {[-0.72, 0.66].map((z) => (
        <Part
          key={z}
          size={[2.4, 0.055, 0.055]}
          at={[0, -0.17, z]}
          color="#090f10"
          metalness={0}
          roughness={0.94}
          radius={0.02}
        />
      ))}
      {[-1.2, 1.2].map((x) => (
        <Part
          key={x}
          size={[0.055, 0.055, 1.4]}
          at={[x, -0.17, -0.03]}
          color="#090f10"
          metalness={0}
          roughness={0.94}
          radius={0.02}
        />
      ))}
      <Part
        size={[1.84, 0.04, 0.97]}
        at={[0, -0.17, -0.03]}
        color="#bfc9c9"
        metalness={0.9}
        roughness={0.28}
      />
      <Part
        size={[1.34, 0.12, 0.69]}
        at={[0, -0.085, -0.03]}
        color="#d8dfde"
        metalness={0.5}
        roughness={0.34}
      />
      <Part
        size={[0.25, 0.025, 0.16]}
        at={[-0.45, -0.014, -0.19]}
        color="#73817f"
        roughness={0.4}
      />
      <group
        ref={film}
        position={[0, 0.03, -0.03]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      >
        <mesh>
          <planeGeometry args={[0.63, 1.28]} />
          <meshStandardMaterial
            map={art}
            roughness={0.45}
            transparent
            opacity={0.93}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {/* Real hinges: knuckles, pivot pins, brackets and fixing screws. */}
      {[-1.13, 1.13].map((x) => (
        <group key={x} position={[x, -0.17, -1.02]}>
          <Part size={[0.32, 0.16, 0.15]} color="#657475" roughness={0.26} />
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.075, 0.075, 0.39, 20]} />
            <meshStandardMaterial
              color="#bac4c4"
              metalness={0.95}
              roughness={0.2}
            />
          </mesh>
          <Screw at={[0, 0.08, 0.087]} />
        </group>
      ))}
      {/* Lid and every inner part share the same physical hinge pivot. */}
      <group ref={lid} position={[0, -0.12, -1.02]} rotation={[-1.48, 0, 0]}>
        <Part
          size={[3.36, 0.16, 2.22]}
          at={[0, 0, 1.04]}
          color="#039da4"
          radius={0.075}
          roughness={0.25}
        />
        <Part
          size={[2.84, 0.05, 1.8]}
          at={[0, -0.105, 1.04]}
          color="#dadfdc"
          radius={0.02}
          roughness={0.46}
        />
        <Part
          size={[2.6, 0.028, 1.55]}
          at={[0, -0.14, 1.04]}
          color="#687d7e"
          roughness={0.31}
        />
        {/* White silicone frame with a metal centre, not a solid turquoise slab. */}
        {[0.25, 1.83].map((z) => (
          <Part
            key={z}
            size={[2.72, 0.065, 0.09]}
            at={[0, -0.17, z]}
            color="#f4f5ed"
            metalness={0}
            roughness={0.76}
            radius={0.035}
          />
        ))}
        {[-1.31, 1.31].map((x) => (
          <Part
            key={x}
            size={[0.09, 0.065, 1.64]}
            at={[x, -0.17, 1.04]}
            color="#f4f5ed"
            metalness={0}
            roughness={0.76}
            radius={0.035}
          />
        ))}
        <Part
          size={[2.43, 0.025, 1.39]}
          at={[0, -0.165, 1.04]}
          color="#adbdbc"
          metalness={0.8}
          roughness={0.29}
        />
        {[-1.53, 1.53].flatMap((x) =>
          [0.18, 1.04, 1.93].map((z) => (
            <Screw key={`${x}-${z}`} at={[x, -0.095, z]} top />
          )),
        )}
        <Part
          size={[0.72, 0.09, 0.13]}
          at={[0, 0.11, 2.07]}
          color="#087d83"
          roughness={0.32}
        />
      </group>
      {/* The slightly sloped front control strip follows the reference layout. */}
      <group position={[0, -0.4, 1.195]} rotation={[-0.08, 0, 0]}>
        <Part size={[1.29, 0.2, 0.035]} color="#16383a" roughness={0.28} />
        <Part
          size={[0.59, 0.13, 0.017]}
          at={[0, 0, 0.025]}
          color="#0b1e23"
          roughness={0.15}
        />
        <mesh position={[0, 0, 0.036]}>
          <planeGeometry args={[0.51, 0.096]} />
          <meshBasicMaterial ref={screen} color="#9be5eb" />
        </mesh>
        <Label at={[0, 0.002, 0.04]} size={0.075} color="#174248">
          180° 060
        </Label>
        {[-0.5, 0.5].map((x) => (
          <group key={x} position={[x, 0, 0.03]}>
            <mesh>
              <circleGeometry args={[0.048, 20]} />
              <meshStandardMaterial
                color={x > 0 ? "#c7e8a0" : "#e7e6d8"}
                roughness={0.35}
              />
            </mesh>
            <Label at={[0, 0, 0.005]} size={0.038} color="#34615b">
              {x > 0 ? "START" : "SET"}
            </Label>
          </group>
        ))}
      </group>
      <Label at={[0, -0.65, 1.147]} size={0.055} color="#a3e0dd">
        3D SUBLIMATION SYSTEM
      </Label>
      {/* Vent slots, casing screws, rear hose and restrained transfer light. */}
      {[-1, 1].flatMap((side) =>
        Array.from({ length: 9 }, (_, i) => (
          <Part
            key={`${side}-${i}`}
            size={[0.011, 0.025, 0.12]}
            at={[side * 1.706, -0.43, -0.67 + i * 0.15]}
            color="#225b5b"
            metalness={0.1}
            radius={0.004}
          />
        )),
      )}
      {[-1.49, 1.49].map((x) => (
        <Screw key={x} at={[x, -0.48, 1.177]} />
      ))}
      <pointLight
        ref={heat}
        position={[0, 0.1, 0.1]}
        color="#ffc888"
        intensity={0}
        distance={2}
      />
    </group>
  );
}
