/**
 * مدينة مجسّمة تُبنى من مبانٍ حقيقية (لا صور مسطّحة).
 * كل مبنى صندوق بستّ مواد — واجهة لكل اتجاه بتكرار مطابق لأبعاده،
 * مع أسطح وخزانات ماء وهوائيات وأضواء طيران، وشوارع مضاءة بينها.
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { buildingMaterials, pavementMaterial, type FacadeStyle } from "./city";

type Block = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  style: FacadeStyle;
  seed: number;
  beacon: boolean;
};

function rnd(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const styles: FacadeStyle[] = ["office", "residential", "old"];

export function City3D({
  seed = 3,
  count = 26,
  spread = 90,
  depth = 140,
  minH = 10,
  maxH = 46,
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  streets = true,
}: {
  seed?: number;
  count?: number;
  spread?: number;
  depth?: number;
  minH?: number;
  maxH?: number;
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  streets?: boolean;
}) {
  const beacons = useRef<THREE.Group>(null);
  const blocks = useMemo<Block[]>(() => {
    const r = rnd(seed);
    const out: Block[] = [];
    for (let i = 0; i < count; i++) {
      const w = 7 + r() * 14;
      const d = 7 + r() * 14;
      const h = minH + r() * (maxH - minH);
      out.push({
        x: (r() - 0.5) * spread,
        z: -12 - r() * depth,
        w,
        d,
        h,
        style: styles[Math.floor(r() * styles.length)]!,
        seed: 100 + Math.floor(r() * 6) * 13,
        beacon: h > maxH * 0.7,
      });
    }
    return out.sort((a, b) => a.z - b.z);
  }, [seed, count, spread, depth, minH, maxH]);

  const mats = useMemo(
    () => blocks.map((b) => buildingMaterials(b.w, b.h, b.d, b.style, b.seed)),
    [blocks],
  );
  const pave = useMemo(() => pavementMaterial("#33363b"), []);

  useFrame((s) => {
    if (!beacons.current) return;
    const on = Math.sin(s.clock.elapsedTime * 2.2) > 0.4 ? 1 : 0.05;
    beacons.current.children.forEach((c) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (m?.color) m.opacity = on;
    });
  });

  return (
    <group position={position} scale={scale}>
      {streets && (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -depth / 2]} receiveShadow material={pave}>
          <planeGeometry args={[spread * 1.8, depth * 1.6]} />
        </mesh>
      )}
      {blocks.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow material={mats[i]!}>
            <boxGeometry args={[b.w, b.h, b.d]} />
          </mesh>
          {/* حافة السطح */}
          <mesh position={[0, b.h + 0.25, 0]}>
            <boxGeometry args={[b.w + 0.5, 0.5, b.d + 0.5]} />
            <meshStandardMaterial color="#2a2d31" roughness={0.9} />
          </mesh>
          {/* خزان ماء + وحدة تكييف على السطح */}
          <mesh position={[b.w * 0.22, b.h + 1.4, b.d * 0.2]}>
            <cylinderGeometry args={[1, 1.1, 2.2, 12]} />
            <meshStandardMaterial color="#4a423a" roughness={0.85} />
          </mesh>
          <mesh position={[-b.w * 0.25, b.h + 0.9, -b.d * 0.18]}>
            <boxGeometry args={[2.2, 1.2, 2]} />
            <meshStandardMaterial color="#3d4247" roughness={0.8} metalness={0.3} />
          </mesh>
          {b.beacon && (
            <>
              <mesh position={[0, b.h + 2.6, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 4.4, 6]} />
                <meshStandardMaterial color="#20242a" roughness={0.7} metalness={0.5} />
              </mesh>
              <group ref={beacons}>
                <mesh position={[0, b.h + 4.9, 0]}>
                  <sphereGeometry args={[0.24, 10, 10]} />
                  <meshBasicMaterial color="#ff4436" transparent opacity={1} toneMapped={false} />
                </mesh>
              </group>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

export default City3D;
