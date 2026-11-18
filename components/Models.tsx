"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { ARTWORK } from "./media";

export type Progress = MutableRefObject<{ value: number }>;
type Vec = [number, number, number];
const { clamp, smoothstep } = THREE.MathUtils;

/** Local progress (0..1) of a stage, read from the shared scroll progress. */
export const local = (progress: Progress, index: number) =>
  clamp(progress.current.value * 8 - index, 0, 1);

function useArtwork() {
  const texture = useTexture(ARTWORK);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);
  return texture;
}

function Block({
  size,
  at = [0, 0, 0],
  color = "#eee",
  radius = 0.06,
  metalness = 0.1,
  roughness = 0.3,
}: {
  size: Vec;
  at?: Vec;
  color?: string;
  radius?: number;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <RoundedBox args={size} radius={Math.min(radius, Math.min(...size) / 2 - 0.001)} smoothness={4} position={at} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </RoundedBox>
  );
}

function roundedRect(p: THREE.Shape | THREE.Path, x: number, y: number, w: number, h: number, r: number) {
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r);
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r);
  p.quadraticCurveTo(x, y, x + r, y);
}

/** The case outline (1.6 × 3.1), optionally with the camera opening, with planar UVs for artwork. */
function useCaseGeometry(cutout: boolean) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    roundedRect(shape, -0.8, -1.55, 1.6, 3.1, 0.22);
    if (cutout) {
      const hole = new THREE.Path();
      roundedRect(hole, -0.62, 0.62, 0.78, 0.78, 0.2);
      shape.holes.push(hole);
    }
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 4,
      steps: 1,
      curveSegments: 18,
    });
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 0.8) / 1.6, (pos.getY(i) + 1.55) / 3.1);
    g.center();
    return g;
  }, [cutout]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** Draws the design-app screen: app chrome around the artwork, as a texture. */
function useAppScreen(art: THREE.Texture) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1440;
    const c = canvas.getContext("2d");
    if (!c) return null;
    const bg = c.createLinearGradient(0, 0, 0, 1440);
    bg.addColorStop(0, "#111a1c");
    bg.addColorStop(1, "#070b0c");
    c.fillStyle = bg;
    c.fillRect(0, 0, 720, 1440);
    c.fillStyle = "#f3ede3";
    c.font = "italic 54px Georgia, serif";
    c.fillText("Case Studio", 56, 150);
    c.fillStyle = "rgba(243,237,227,.55)";
    c.font = "600 22px Arial, sans-serif";
    c.fillText("NEW DESIGN  ·  DRAFT 01", 58, 196);
    // Artwork in a case-shaped frame, cover-fitted.
    const x = 150, y = 250, w = 420, h = 820;
    c.save();
    c.beginPath();
    c.roundRect(x, y, w, h, 58);
    c.clip();
    const img = art.image as HTMLImageElement | undefined;
    if (img?.width) {
      const s = Math.max(w / img.width, h / img.height);
      c.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
    }
    c.restore();
    c.strokeStyle = "rgba(243,237,227,.7)";
    c.lineWidth = 3;
    c.setLineDash([14, 12]);
    c.beginPath();
    c.roundRect(x - 18, y - 18, w + 36, h + 36, 70);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = "rgba(7,11,12,.82)";
    c.beginPath();
    c.roundRect(x + 26, y + 26, 150, 150, 44);
    c.fill();
    ["#f4a6c6", "#7fe0d2", "#93b8ff", "#e6c897", "#f3ede3"].forEach((color, i) => {
      c.fillStyle = color;
      c.beginPath();
      c.arc(136 + i * 112, 1170, 34, 0, Math.PI * 2);
      c.fill();
    });
    c.fillStyle = "#e6c897";
    c.beginPath();
    c.roundRect(150, 1262, 420, 92, 46);
    c.fill();
    c.fillStyle = "#070b0c";
    c.font = "700 30px Arial, sans-serif";
    c.textAlign = "center";
    c.fillText("Send to print", 360, 1318);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [art]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

/** Step 1: a phone running the design app. The screen's artwork builds in as the stage begins. */
export function DesignPhone({ progress }: { progress: Progress }) {
  const art = useArtwork();
  const screen = useAppScreen(art);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    if (glow.current) glow.current.opacity = 0.2 + 0.8 * smoothstep(local(progress, 0), 0, 0.5);
  });
  return (
    <group>
      <Block size={[1.62, 3.22, 0.16]} color="#151c1e" radius={0.24} metalness={0.75} roughness={0.25} />
      <Block size={[1.5, 3.1, 0.02]} at={[0, 0, 0.085]} color="#020405" radius={0.2} roughness={0.08} />
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[1.4, 2.98]} />
        <meshBasicMaterial ref={glow} map={screen} transparent toneMapped={false} />
      </mesh>
      <Block size={[0.42, 0.11, 0.02]} at={[0, 1.42, 0.11]} color="#000" radius={0.05} />
      <Block size={[0.03, 0.42, 0.06]} at={[0.83, 0.62, 0]} color="#3a4447" radius={0.012} metalness={0.8} />
      <Block size={[0.03, 0.28, 0.06]} at={[-0.83, 0.72, 0]} color="#3a4447" radius={0.012} metalness={0.8} />
    </group>
  );
}

/** Steps 2 and 4: the sublimation sheet, plain or printed. Printed ink fades in with `ink`. */
export function Sheet({ printed = false, progress, index }: { printed?: boolean; progress: Progress; index: number }) {
  const art = useArtwork();
  const ink = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (ink.current) ink.current.opacity = smoothstep(local(progress, index), 0.02, 0.4);
  });
  return (
    <group>
      <Block size={[2.1, 2.97, 0.018]} color="#fbfaf6" radius={0.008} roughness={0.85} />
      {printed && (
        <mesh position={[0, 0.02, 0.011]}>
          <planeGeometry args={[1.78, 2.6]} />
          <meshStandardMaterial ref={ink} map={art} transparent opacity={1} roughness={0.55} />
        </mesh>
      )}
      {/* Registration marks in the corners. */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <mesh key={`${sx}${sy}`} position={[sx * 0.97, sy * 1.4, 0.011]}>
            <ringGeometry args={[0.025, 0.04, 24]} />
            <meshBasicMaterial color="#9aa3a3" />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Step 6: the aluminium universal mould. Its layers separate into an exploded view mid-stage. */
export function UniversalMould({ progress }: { progress: Progress }) {
  const top = useRef<THREE.Group>(null);
  const clips = useRef<THREE.Group>(null);
  const screws = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = local(progress, 5);
    const spread = Math.sin(smoothstep(p, 0.3, 0.95) * Math.PI);
    if (top.current) top.current.position.z = 0.13 + spread * 0.55;
    if (clips.current) clips.current.position.z = spread * 0.95;
    if (screws.current) screws.current.position.z = spread * 1.3;
  });
  const alu = { color: "#dfe5e7", metalness: 0.72, roughness: 0.26 };
  return (
    <group>
      <Block size={[1.78, 3.3, 0.22]} radius={0.2} {...alu} color="#c3cbcd" />
      <group ref={top}>
        <Block size={[0.62, 1.46, 0.05]} at={[-0.5, 0.78, 0]} radius={0.04} {...alu} />
        <Block size={[0.98, 1.0, 0.07]} at={[0.3, 0.98, 0.01]} radius={0.04} {...alu} color="#eef2f3" />
        <Block size={[1.0, 1.7, 0.05]} at={[-0.26, -0.72, 0]} radius={0.04} {...alu} color="#d3dadc" />
        <Block size={[0.6, 0.6, 0.06]} at={[0.52, -1.18, 0.005]} radius={0.04} {...alu} color="#f1f4f5" />
        <Block size={[0.56, 1.18, 0.045]} at={[0.52, -0.2, 0]} radius={0.04} {...alu} color="#e2e8e9" />
      </group>
      <group ref={clips}>
        {[-1, 1].map((s) => (
          <Block key={s} size={[0.05, 0.9, 0.14]} at={[s * 0.9, 0, 0.1]} radius={0.02} color="#a9b2b4" metalness={0.75} roughness={0.25} />
        ))}
        {[-1, 1].map((s) => (
          <Block key={"h" + s} size={[0.6, 0.05, 0.12]} at={[0, s * 1.66, 0.1]} radius={0.02} color="#a9b2b4" metalness={0.75} roughness={0.25} />
        ))}
      </group>
      <group ref={screws}>
        {[[0.62, 1.28], [-0.62, -1.28], [0.1, 0.4]].map(([x, y]) => (
          <mesh key={`${x}${y}`} position={[x, y, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.05, 20]} />
            <meshStandardMaterial color="#b98a52" metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Steps 7 and 8: the case shell. `printed` reveals the artwork as the final stage begins. */
export function PhoneCase({ printed = false, progress }: { printed?: boolean; progress: Progress }) {
  const geometry = useCaseGeometry(true);
  const art = useArtwork();
  const ink = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame(() => {
    if (ink.current) ink.current.opacity = smoothstep(local(progress, 7), 0.04, 0.5);
  });
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f6f4ef" roughness={0.18} metalness={0.02} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      {printed && (
        <mesh geometry={geometry} position={[0, 0, 0.004]} scale={[1.001, 1.001, 1.02]}>
          <meshPhysicalMaterial ref={ink} map={art} transparent opacity={0} roughness={0.22} clearcoat={1} clearcoatRoughness={0.05} />
        </mesh>
      )}
      {/* Raised camera ring inside the opening. */}
      <mesh position={[-0.23, 1.01, -0.02]}>
        <torusGeometry args={[0.36, 0.025, 12, 48]} />
        <meshStandardMaterial color="#d8d4cc" metalness={0.4} roughness={0.3} />
      </mesh>
      <Block size={[0.04, 0.42, 0.09]} at={[0.84, 0.48, 0]} color="#e7e3db" radius={0.015} />
      <Block size={[0.04, 0.26, 0.09]} at={[-0.84, 0.6, 0]} color="#e7e3db" radius={0.015} />
    </group>
  );
}
