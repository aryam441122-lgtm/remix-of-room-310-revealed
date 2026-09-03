/**
 * سيارة سيدان مجسّمة بتفاصيل: هيكل بطلاء لامع (clearcoat)، زجاج،
 * كروم، عجلات بإطارات مطاطية وجنوط، مصابيح أمامية وخلفية،
 * ومقصورة داخلية (طبلون، دركسون، مقاعد، عدّادات) للقطات الداخل.
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { surface } from "./textures";

function tireTexture(): THREE.CanvasTexture {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#141416";
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 4;
  for (let i = 0; i < S; i += 10) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 6, S);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Wheel({ position, spin }: { position: [number, number, number]; spin: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const tire = useMemo(() => tireTexture(), []);
  useFrame((_, delta) => {
    if (spin && ref.current) ref.current.rotation.x -= Math.min(delta, 0.05) * 22;
  });
  return (
    <group position={position} rotation-z={Math.PI / 2}>
      <group ref={ref}>
        <mesh castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.24, 28]} />
          <meshStandardMaterial map={tire} color="#1a1a1c" roughness={0.94} />
        </mesh>
        <mesh position={[0, 0.005, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.26, 24]} />
          <meshStandardMaterial color="#b9bdc4" metalness={0.95} roughness={0.24} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.12, 0.135, Math.sin(a) * 0.12]}>
              <boxGeometry args={[0.05, 0.02, 0.14]} />
              <meshStandardMaterial color="#8d939b" metalness={0.9} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function Car3D({
  position = [0, 0, 0],
  rotation = 0,
  color = "#1d2733",
  spin = false,
  headlights = true,
}: {
  position?: [number, number, number];
  rotation?: number;
  color?: string;
  spin?: boolean;
  headlights?: boolean;
}) {
  const paint = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        metalness: 0.55,
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.1,
      }),
    [color],
  );
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#0d1319"),
        metalness: 0.1,
        roughness: 0.05,
        transparent: true,
        opacity: 0.55,
        transmission: 0.35,
      }),
    [],
  );
  const chrome = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c9ced6", metalness: 1, roughness: 0.18 }),
    [],
  );
  const trim = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#14171b", roughness: 0.72, metalness: 0.2 }),
    [],
  );

  return (
    <group position={position} rotation-y={rotation}>
      {/* الهيكل السفلي */}
      <mesh position={[0, 0.52, 0]} castShadow material={paint}>
        <boxGeometry args={[1.86, 0.5, 4.4]} />
      </mesh>
      {/* غطاء المحرك المنحدر */}
      <mesh position={[0, 0.78, 1.55]} rotation-x={-0.07} castShadow material={paint}>
        <boxGeometry args={[1.78, 0.2, 1.4]} />
      </mesh>
      {/* الصندوق الخلفي */}
      <mesh position={[0, 0.8, -1.7]} rotation-x={0.06} castShadow material={paint}>
        <boxGeometry args={[1.78, 0.22, 1.1]} />
      </mesh>
      {/* المقصورة */}
      <mesh position={[0, 1.02, -0.12]} castShadow material={paint}>
        <boxGeometry args={[1.68, 0.56, 2.3]} />
      </mesh>
      <mesh position={[0, 1.3, -0.2]} castShadow material={paint}>
        <boxGeometry args={[1.5, 0.06, 2]} />
      </mesh>
      {/* زجاج أمامي/خلفي/جنبي */}
      <mesh position={[0, 1.08, 1.02]} rotation-x={-0.62} material={glass}>
        <planeGeometry args={[1.52, 0.92]} />
      </mesh>
      <mesh position={[0, 1.1, -1.28]} rotation-x={0.66} material={glass}>
        <planeGeometry args={[1.48, 0.82]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.845, 1.08, -0.2]} rotation-y={(s * Math.PI) / 2} material={glass}>
          <planeGeometry args={[1.9, 0.5]} />
        </mesh>
      ))}
      {/* خطوط الأبواب ومقابض */}
      {[-1, 1].map((s) =>
        [0.45, -0.75].map((z) => (
          <group key={`${s}${z}`}>
            <mesh position={[s * 0.94, 0.62, z]} material={trim}>
              <boxGeometry args={[0.02, 0.5, 0.02]} />
            </mesh>
            <mesh position={[s * 0.95, 0.72, z - 0.3]} material={chrome}>
              <boxGeometry args={[0.04, 0.05, 0.22]} />
            </mesh>
          </group>
        )),
      )}
      {/* مرايا */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1, 1.03, 0.85]} castShadow material={paint}>
          <boxGeometry args={[0.24, 0.11, 0.1]} />
        </mesh>
      ))}
      {/* مصدات + شبك */}
      <mesh position={[0, 0.5, 2.24]} material={trim}>
        <boxGeometry args={[1.88, 0.36, 0.16]} />
      </mesh>
      <mesh position={[0, 0.72, 2.24]} material={chrome}>
        <boxGeometry args={[1, 0.16, 0.08]} />
      </mesh>
      <mesh position={[0, 0.5, -2.24]} material={trim}>
        <boxGeometry args={[1.88, 0.36, 0.16]} />
      </mesh>
      {/* مصابيح */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.66, 0.78, 2.22]}>
            <boxGeometry args={[0.42, 0.16, 0.08]} />
            <meshStandardMaterial
              color="#e8f0ff"
              emissive="#dbe8ff"
              emissiveIntensity={headlights ? 2.4 : 0.05}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[s * 0.66, 0.82, -2.22]}>
            <boxGeometry args={[0.4, 0.14, 0.08]} />
            <meshStandardMaterial color="#3a0d0c" emissive="#ff3b2f" emissiveIntensity={1.6} />
          </mesh>
        </group>
      ))}
      {headlights && (
        <>
          <spotLight
            position={[-0.66, 0.78, 2.3]}
            target-position={[-0.7, 0, 14]}
            angle={0.42}
            penumbra={0.6}
            intensity={90}
            distance={40}
            color="#e6f0ff"
          />
          <spotLight
            position={[0.66, 0.78, 2.3]}
            target-position={[0.7, 0, 14]}
            angle={0.42}
            penumbra={0.6}
            intensity={90}
            distance={40}
            color="#e6f0ff"
          />
        </>
      )}
      {/* عجلات */}
      <Wheel position={[-0.94, 0.34, 1.42]} spin={spin} />
      <Wheel position={[0.94, 0.34, 1.42]} spin={spin} />
      <Wheel position={[-0.94, 0.34, -1.42]} spin={spin} />
      <Wheel position={[0.94, 0.34, -1.42]} spin={spin} />
    </group>
  );
}

/** مقصورة داخلية تُصوَّر من مقعد الراكب — لقطات القيادة */
export function CarInterior() {
  const wheel = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (wheel.current) wheel.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.5) * 0.16;
  });
  const leather = useMemo(() => surface("leather", { tint: "#15181d", repeat: [3, 2] }), []);
  const cloth = useMemo(() => surface("fabric", { tint: "#1b1f25", repeat: [3, 3] }), []);
  const roofCloth = useMemo(() => surface("fabric", { tint: "#0e1116", repeat: [1.2, 1.2] }), []);
  return (
    <group>
      {/* طبلون */}
      <mesh position={[0, 0.78, 1.35]} rotation-x={0.14}>
        <boxGeometry args={[3, 0.42, 0.9]} />
        <meshStandardMaterial {...leather} />
      </mesh>
      <mesh position={[0, 0.98, 1.62]}>
        <boxGeometry args={[3, 0.1, 0.5]} />
        <meshStandardMaterial {...leather} />
      </mesh>
      {/* عدّادات مضاءة */}
      <mesh position={[-0.72, 0.86, 0.95]} rotation-x={-0.5}>
        <planeGeometry args={[0.6, 0.24]} />
        <meshStandardMaterial color="#05080a" emissive="#66e0c0" emissiveIntensity={0.7} />
      </mesh>
      {/* شاشة وسطى */}
      <mesh position={[0.35, 0.9, 1.02]} rotation-x={-0.35}>
        <planeGeometry args={[0.42, 0.28]} />
        <meshStandardMaterial color="#04070a" emissive="#4a8fd8" emissiveIntensity={0.55} />
      </mesh>
      {/* دركسون */}
      <group ref={wheel} position={[-0.72, 0.78, 0.72]} rotation-x={-1.15}>
        <mesh>
          <torusGeometry args={[0.19, 0.026, 12, 30]} />
          <meshStandardMaterial color="#181b1f" roughness={0.5} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.055, 0.055, 0.06, 14]} />
          <meshStandardMaterial color="#22262b" roughness={0.6} metalness={0.4} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, 0, 0]} rotation-z={Math.PI / 2}>
            <boxGeometry args={[0.02, 0.18, 0.02]} />
            <meshStandardMaterial color="#2a2f35" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>
      {/* أبواب جانبية + مقاعد */}
      {[-1.32, 1.32].map((x) => (
        <mesh key={x} position={[x, 0.6, 0.4]}>
          <boxGeometry args={[0.18, 1.1, 2.4]} />
          <meshStandardMaterial {...leather} />
        </mesh>
      ))}
      {[-0.72, 0.72].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.36, -0.35]}>
            <boxGeometry args={[0.62, 0.16, 0.7]} />
            <meshStandardMaterial {...cloth} />
          </mesh>
          <mesh position={[x, 0.78, -0.7]} rotation-x={0.12}>
            <boxGeometry args={[0.6, 0.86, 0.16]} />
            <meshStandardMaterial {...cloth} />
          </mesh>
        </group>
      ))}
      {/* سقف */}
      <mesh position={[0, 1.52, 0.3]}>
        <boxGeometry args={[2.7, 0.1, 2.8]} />
        <meshStandardMaterial {...roofCloth} />
      </mesh>
    </group>
  );
}

export default Car3D;
