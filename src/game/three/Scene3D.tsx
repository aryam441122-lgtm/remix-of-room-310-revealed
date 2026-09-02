import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { backgrounds } from "@/game/assets";
import { getWorld, type Shot, type WorldDef } from "./world";

/* ------------------------------------------------------------------ */
/* كاميرا سينمائية: تنتقل بين اللقطات مع دوللي واهتزاز محمول          */
/* ------------------------------------------------------------------ */

/** ضوء ملاصق للكاميرا يمنع اللقطات المظلمة تماماً */
function CameraFill({ color, intensity }: { color: string; intensity: number }) {
  const ref = useRef<THREE.PointLight>(null);
  const { camera } = useThree();
  useFrame(() => {
    ref.current?.position.copy(camera.position);
  });
  return <pointLight ref={ref} color={color} intensity={intensity} distance={22} decay={1.3} />;
}

function CameraRig({ shot, shotKey }: { shot: Shot; shotKey: string }) {
  const { camera } = useThree();
  const t = useRef(0);
  const target = useRef(new THREE.Vector3(...shot.target));
  const from = useRef(new THREE.Vector3(...shot.pos));

  useEffect(() => {
    // بداية لقطة جديدة: احفظ الموضع الحالي كنقطة انتقال ناعمة
    from.current.copy(camera.position);
    t.current = 0;
  }, [shotKey, camera]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    t.current = Math.min(t.current + dt, 60);
    const ease = 1 - Math.exp(-2.2 * t.current);
    const drift = shot.drift ?? [0, 0, 0];
    const d = Math.min(t.current / 14, 1);

    const wanted = new THREE.Vector3(
      shot.pos[0] + drift[0] * d,
      shot.pos[1] + drift[1] * d,
      shot.pos[2] + drift[2] * d,
    );
    const pos = from.current.clone().lerp(wanted, ease);

    const sway = shot.handheld ?? 0.4;
    const time = state.clock.elapsedTime;
    pos.x += Math.sin(time * 0.7) * 0.012 * sway;
    pos.y += Math.sin(time * 1.13 + 1.7) * 0.009 * sway;
    camera.position.copy(pos);

    target.current.lerp(new THREE.Vector3(...shot.target), 1 - Math.exp(-2 * dt));
    camera.lookAt(target.current);

    const cam = camera as THREE.PerspectiveCamera;
    const wantedFov = shot.fov ?? 44;
    cam.fov += (wantedFov - cam.fov) * (1 - Math.exp(-2 * dt));
    cam.updateProjectionMatrix();
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* مطر                                                                */
/* ------------------------------------------------------------------ */

function Rain({ count = 900, area = 26, height = 14 }: { count?: number; area?: number; height?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * area;
      arr[i * 3 + 1] = Math.random() * height;
      arr[i * 3 + 2] = (Math.random() - 0.5) * area;
    }
    return arr;
  }, [count, area, height]);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const dt = Math.min(delta, 0.05);
    for (let i = 1; i < arr.length; i += 3) {
      const next = (arr[i] ?? height) - dt * (9 + (i % 7));
      arr[i] = next < 0 ? height : next;
    }

    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#9fb6cc"
        size={0.045}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* عناصر مشتركة                                                       */
/* ------------------------------------------------------------------ */

function Vista({ src, size, position, rotation, intensity = 0.9 }: {
  src: string;
  size: [number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  intensity?: number;
}) {
  const tex = useTexture(src);
  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
  }, [tex]);
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color(intensity, intensity, intensity)} />
    </mesh>
  );
}

function Lamp({ position, color, intensity = 6, size = 0.09 }: {
  position: [number, number, number];
  color: string;
  intensity?: number;
  size?: number;
}) {
  return (
    <group position={position}>
      <pointLight color={color} intensity={intensity * 24} distance={14} decay={2} />
      <mesh>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Box({ position, size, color, rough = 0.7, metal = 0.05, rotation }: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rough?: number;
  metal?: number;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* الأنماط                                                            */
/* ------------------------------------------------------------------ */

function RoomWorld({ w }: { w: WorldDef }) {
  const flick = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    if (flick.current) {
      flick.current.intensity = 5 + Math.sin(s.clock.elapsedTime * 9) * 0.4 + Math.random() * 0.3;
    }
  });
  return (
    <group>
      {/* أرض وسقف وجدران */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[9, 11]} />
        <meshStandardMaterial color={w.floor} roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh position={[0, 2.9, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[9, 11]} />
        <meshStandardMaterial color={w.wall} roughness={0.9} />
      </mesh>
      <Box position={[0, 1.45, -5.4]} size={[9, 2.9, 0.2]} color={w.wall} rough={0.9} />
      <Box position={[-4.5, 1.45, 0]} size={[0.2, 2.9, 11]} color={w.wall} rough={0.9} />
      <Box position={[4.5, 1.45, 0]} size={[0.2, 2.9, 11]} color={w.wall} rough={0.9} />
      <Box position={[0, 1.45, 5.4]} size={[9, 2.9, 0.2]} color={w.wall} rough={0.9} />

      {/* نافذة بمنظر */}
      {w.vista && backgrounds[w.vista] && (
        <>
          <Vista src={backgrounds[w.vista]!} size={[3.6, 2]} position={[-4.35, 1.6, -1.4]} rotation={[0, Math.PI / 2, 0]} intensity={0.75} />
          <Box position={[-4.28, 1.6, -1.4]} size={[0.06, 2.1, 0.08]} color="#0d0f12" rough={0.8} />
          <rectAreaLight position={[-4.2, 1.6, -1.4]} rotation={[0, Math.PI / 2, 0]} intensity={2} width={3.6} height={2} color="#93b4d8" />
        </>
      )}

      {/* سرير */}
      <Box position={[2.3, 0.28, -2.4]} size={[2.2, 0.55, 3.4]} color="#2c2f36" rough={0.85} />
      <Box position={[2.3, 0.62, -2.4]} size={[2.15, 0.2, 3.3]} color="#d7d2c6" rough={0.95} />
      <Box position={[2.3, 0.8, -3.85]} size={[1.5, 0.28, 0.4]} color="#e8e3d7" rough={0.95} />

      {/* مكتب + كرسي + طرف طاولة */}
      <Box position={[-2.6, 0.72, -3.6]} size={[2.4, 0.08, 1.1]} color="#3a2c22" rough={0.5} />
      <Box position={[-3.7, 0.36, -3.6]} size={[0.1, 0.72, 1]} color="#2a2018" />
      <Box position={[-1.5, 0.36, -3.6]} size={[0.1, 0.72, 1]} color="#2a2018" />
      <Box position={[-2.4, 0.45, -2.5]} size={[0.6, 0.9, 0.6]} color="#22262c" rough={0.8} />

      {/* مصباح المكتب + مصباح السرير + ثريا صغيرة */}
      <Lamp position={[-3.2, 1.05, -3.5]} color={w.accent} intensity={5} />
      <Lamp position={[3.6, 0.95, -3.7]} color="#ffce8a" intensity={3.5} size={0.07} />
      <group position={[0, 2.5, -0.5]}>
        <pointLight ref={flick} color={w.accent} intensity={110.0} distance={12} decay={2} castShadow />
        <mesh>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshBasicMaterial color={w.accent} toneMapped={false} />
        </mesh>
      </group>

      {/* باب */}
      <Box position={[1.4, 1.05, 5.28]} size={[1.1, 2.1, 0.1]} color="#33261d" rough={0.6} />
      <mesh position={[0.95, 1.05, 5.2]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* خزانة وتلفاز وحقيبة على الجهة المقابلة */}
      <Box position={[-3.1, 0.9, 2.6]} size={[1.8, 1.8, 0.6]} color="#2b2118" rough={0.75} />
      <Box position={[-1.2, 1.5, 2.9]} size={[1.6, 0.9, 0.08]} color="#0d0f12" rough={0.3} metal={0.4} />
      <Box position={[0.9, 0.25, 3.4]} size={[0.7, 0.5, 0.35]} color="#241f1c" rough={0.9} />

      {/* مرآة / لوحة */}
      <Box position={[4.35, 1.7, 1.6]} size={[0.05, 1.1, 1.6]} color="#3c3f47" rough={0.2} metal={0.7} />
    </group>
  );
}

function CorridorWorld({ w }: { w: WorldDef }) {
  const doors = useMemo(() => [-6, -3.5, -1, 1.5, 4, 6.5], []);
  const pulse = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (pulse.current && w.accent === "#ff3b30") {
      const v = 0.4 + Math.abs(Math.sin(s.clock.elapsedTime * 2.4)) * 0.9;
      pulse.current.children.forEach((c) => {
        const l = c as THREE.PointLight;
        if (l.isPointLight) l.intensity = v * 7;
      });
    }
  });
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[4.2, 30]} />
        <meshStandardMaterial color={w.floor} roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, 2.7, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[4.2, 30]} />
        <meshStandardMaterial color={w.wall} roughness={0.95} />
      </mesh>
      <Box position={[-2.1, 1.35, 0]} size={[0.2, 2.7, 30]} color={w.wall} rough={0.9} />
      <Box position={[2.1, 1.35, 0]} size={[0.2, 2.7, 30]} color={w.wall} rough={0.9} />
      <Box position={[0, 1.35, -14.9]} size={[4.2, 2.7, 0.2]} color={w.wall} rough={0.9} />

      {doors.map((z) => (
        <group key={z}>
          <Box position={[-1.95, 1.05, z]} size={[0.08, 2.1, 1.05]} color="#33261d" rough={0.6} />
          <Box position={[1.95, 1.05, z + 1.2]} size={[0.08, 2.1, 1.05]} color="#33261d" rough={0.6} />
          <mesh position={[-1.86, 1.9, z]}>
            <boxGeometry args={[0.02, 0.16, 0.3]} />
            <meshStandardMaterial color={w.accent} emissive={w.accent} emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}

      <group ref={pulse}>
        {[-12, -8, -4, 0, 4, 8, 12].map((z) => (
          <Lamp key={z} position={[0, 2.45, z]} color={w.accent} intensity={5} size={0.1} />
        ))}
      </group>

      {/* لوحة رقم الغرفة ٣١٠ */}
      <mesh position={[-1.85, 1.75, 1.5]}>
        <planeGeometry args={[0.42, 0.24]} />
        <meshStandardMaterial color="#0d0f12" emissive={w.accent} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

function HallWorld({ w }: { w: WorldDef }) {
  const cols = useMemo(() => [-6, -2, 2, 6], []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[24, 40]} />
        <meshStandardMaterial color={w.floor} roughness={0.22} metalness={0.55} />
      </mesh>
      <mesh position={[0, 7, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[24, 40]} />
        <meshStandardMaterial color={w.wall} roughness={0.9} />
      </mesh>
      <Box position={[0, 3.5, -12]} size={[24, 7, 0.4]} color={w.wall} rough={0.85} />
      <Box position={[-11.8, 3.5, 0]} size={[0.4, 7, 40]} color={w.wall} rough={0.85} />
      <Box position={[11.8, 3.5, 0]} size={[0.4, 7, 40]} color={w.wall} rough={0.85} />

      {w.vista && backgrounds[w.vista] && (
        <Vista src={backgrounds[w.vista]!} size={[16, 6]} position={[0, 3.4, -11.7]} intensity={0.55} />
      )}

      {cols.map((x) =>
        [-6, 0, 6].map((z) => (
          <group key={`${x}-${z}`}>
            <mesh position={[x, 3.5, z]} castShadow>
              <cylinderGeometry args={[0.42, 0.5, 7, 20]} />
              <meshStandardMaterial color={w.wall} roughness={0.55} metalness={0.2} />
            </mesh>
          </group>
        )),
      )}

      {/* مكتب الاستقبال */}
      <Box position={[-3, 0.6, -6]} size={[7, 1.2, 1.4]} color="#3a2c22" rough={0.4} metal={0.15} />
      <Box position={[-3, 1.25, -6]} size={[7.2, 0.1, 1.6]} color="#161a20" rough={0.2} metal={0.6} />

      {/* ثريّات */}
      {[[-4, 4.8, 2], [4, 4.8, -2], [0, 5.2, 6]].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <pointLight color={w.accent} intensity={572.0} distance={26} decay={2} castShadow />
          {Array.from({ length: 10 }).map((_, k) => {
            const a = (k / 10) * Math.PI * 2;
            return (
              <mesh key={k} position={[Math.cos(a) * 0.55, -Math.sin(k) * 0.2, Math.sin(a) * 0.55]}>
                <sphereGeometry args={[0.075, 10, 10]} />
                <meshBasicMaterial color={w.accent} toneMapped={false} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* أرائك */}
      {[[6, 0.3, 4], [7.5, 0.3, 1]].map((p, i) => (
        <Box key={i} position={p as [number, number, number]} size={[2.4, 0.6, 1.2]} color="#2a2f38" rough={0.9} />
      ))}
    </group>
  );
}

function TechWorld({ w }: { w: WorldDef }) {
  const screens = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        x: -1.65 + (i % 4) * 1.1,
        y: 1.05 + Math.floor(i / 4) * 0.72,
        seed: Math.random() * 10,
      })),
    [],
  );
  const grp = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!grp.current) return;
    grp.current.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m && m.emissiveIntensity !== undefined) {
        m.emissiveIntensity = 0.5 + Math.abs(Math.sin(s.clock.elapsedTime * (1.2 + i * 0.13))) * 0.7;
      }
    });
  });
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[8, 10]} />
        <meshStandardMaterial color={w.floor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.7, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[8, 10]} />
        <meshStandardMaterial color={w.wall} roughness={0.95} />
      </mesh>
      <Box position={[0, 1.35, -3.6]} size={[8, 2.7, 0.2]} color={w.wall} rough={0.9} />
      <Box position={[-3.9, 1.35, 0]} size={[0.2, 2.7, 10]} color={w.wall} rough={0.9} />
      <Box position={[3.9, 1.35, 0]} size={[0.2, 2.7, 10]} color={w.wall} rough={0.9} />

      <group ref={grp}>
        {screens.map((s, i) => (
          <mesh key={i} position={[s.x, s.y, -3.45]}>
            <planeGeometry args={[1, 0.62]} />
            <meshStandardMaterial
              color="#0a1416"
              emissive={w.accent}
              emissiveIntensity={0.7}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>
      <rectAreaLight position={[0, 1.5, -3]} intensity={3.5} width={5} height={2} color={w.accent} />

      {/* طاولة تحكم */}
      <Box position={[0, 0.75, -2.3]} size={[5, 0.1, 1]} color="#20242a" rough={0.4} metal={0.3} />
      <Box position={[0, 0.35, -2.3]} size={[4.8, 0.7, 0.9]} color="#181b20" rough={0.8} />
      <Box position={[-1.4, 0.83, -2.3]} size={[0.9, 0.04, 0.35]} color="#2c3138" />
      <Lamp position={[2.6, 2.3, 0]} color={w.accent} intensity={3} size={0.06} />

      {/* رفوف أرشيف */}
      <Box position={[-3.3, 1.2, 1.5]} size={[0.8, 2.4, 3]} color="#232830" rough={0.85} />
      <Box position={[3.3, 1.2, 1.5]} size={[0.8, 2.4, 3]} color="#232830" rough={0.85} />
    </group>
  );
}

function BasementWorld({ w }: { w: WorldDef }) {
  const bulb = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (bulb.current) {
      bulb.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.9) * 0.12;
      const l = bulb.current.children[1] as THREE.PointLight | undefined;
      if (l?.isPointLight) l.intensity = 4.5 + Math.random() * 1.2;
    }
  });
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[8, 16]} />
        <meshStandardMaterial color={w.floor} roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.4, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[8, 16]} />
        <meshStandardMaterial color={w.wall} roughness={1} />
      </mesh>
      <Box position={[-3.9, 1.2, 0]} size={[0.2, 2.4, 16]} color={w.wall} rough={1} />
      <Box position={[3.9, 1.2, 0]} size={[0.2, 2.4, 16]} color={w.wall} rough={1} />
      <Box position={[0, 1.2, -7.9]} size={[8, 2.4, 0.2]} color={w.wall} rough={1} />

      {/* أنابيب */}
      {[-6, -3, 0, 3, 6].map((z) => (
        <mesh key={z} position={[0, 2.15, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.12, 0.12, 7.6, 12]} />
          <meshStandardMaterial color="#2e3237" roughness={0.6} metalness={0.7} />
        </mesh>
      ))}

      {/* لمبة معلّقة تتأرجح */}
      <group ref={bulb} position={[0, 2.3, 0]}>
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.7, 6]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
        <pointLight position={[0, -0.72, 0]} color={w.accent} intensity={110.0} distance={11} decay={2} castShadow />
        <mesh position={[0, -0.72, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
        </mesh>
      </group>

      {/* صناديق وخزائن */}
      <Box position={[-2.8, 0.4, -3]} size={[1.2, 0.8, 1.2]} color="#2a2520" rough={0.95} />
      <Box position={[2.6, 0.9, -4.5]} size={[1.4, 1.8, 0.7]} color="#22262a" rough={0.9} />
      <Box position={[2.2, 0.3, 2]} size={[1, 0.6, 1]} color="#2a2520" rough={0.95} />
      <Lamp position={[0, 2.1, -6]} color="#ff7a45" intensity={2} size={0.05} />
    </group>
  );
}

function RooftopWorld({ w }: { w: WorldDef }) {
  const city = useMemo(
    () =>
      Array.from({ length: 46 }).map(() => ({
        x: (Math.random() - 0.5) * 90,
        z: -18 - Math.random() * 55,
        h: 4 + Math.random() * 26,
        wd: 3 + Math.random() * 6,
      })),
    [],
  );
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color={w.floor} roughness={0.9} />
      </mesh>
      {/* حواجز السطح */}
      <Box position={[0, 0.55, -13]} size={[26, 1.1, 0.4]} color={w.wall} rough={0.9} />
      <Box position={[-13, 0.55, 0]} size={[0.4, 1.1, 26]} color={w.wall} rough={0.9} />
      <Box position={[13, 0.55, 0]} size={[0.4, 1.1, 26]} color={w.wall} rough={0.9} />
      {/* غرفة المصعد */}
      <Box position={[7, 1.6, 8]} size={[5, 3.2, 4]} color={w.wall} rough={0.9} />
      <Lamp position={[7, 3.4, 6]} color="#ffb057" intensity={4} size={0.07} />

      {w.vista && backgrounds[w.vista] && (
        <Vista src={backgrounds[w.vista]!} size={[130, 44]} position={[0, 12, -70]} intensity={0.45} />
      )}

      {city.map((b, i) => (
        <group key={i}>
          <Box position={[b.x, b.h / 2 - 2, b.z]} size={[b.wd, b.h, b.wd]} color="#12161d" rough={0.85} />
          <mesh position={[b.x, b.h / 2 - 2, b.z + b.wd / 2 + 0.02]}>
            <planeGeometry args={[b.wd * 0.8, b.h * 0.85]} />
            <meshStandardMaterial
              color="#0b0f14"
              emissive={i % 3 === 0 ? "#ffce8a" : "#7fa8ff"}
              emissiveIntensity={0.22}
            />
          </mesh>
        </group>
      ))}
      <directionalLight position={[-10, 18, -8]} intensity={0.5} color="#8fb0ff" />
    </group>
  );
}

function DriveWorld({ w }: { w: WorldDef }) {
  const road = useRef<THREE.Group>(null);
  const lights = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const speed = 16;
    [road.current, lights.current].forEach((g) => {
      if (!g) return;
      g.children.forEach((c) => {
        c.position.z += speed * dt;
        if (c.position.z > 6) c.position.z -= 60;
      });
    });
  });
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[26, 140]} />
        <meshStandardMaterial color={w.floor} roughness={0.35} metalness={0.35} />
      </mesh>
      {/* خطوط الطريق */}
      <group ref={road}>
        {Array.from({ length: 24 }).map((_, i) => (
          <mesh key={i} position={[0, 0.01, -i * 2.5]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.16, 1.4]} />
            <meshStandardMaterial color="#c9c2ae" roughness={0.6} />
          </mesh>
        ))}
      </group>
      {/* أعمدة الإنارة */}
      <group ref={lights}>
        {Array.from({ length: 12 }).map((_, i) => (
          <group key={i} position={[0, 0, -i * 5]}>
            <Box position={[4.2, 2.4, 0]} size={[0.14, 4.8, 0.14]} color="#1b1f26" />
            <Lamp position={[3.6, 4.7, 0]} color={w.accent} intensity={7} size={0.11} />
            <Box position={[-4.2, 2.4, 0]} size={[0.14, 4.8, 0.14]} color="#1b1f26" />
            <Lamp position={[-3.6, 4.7, 0]} color={w.accent} intensity={7} size={0.11} />
          </group>
        ))}
      </group>
      {/* لوح المطر الأمامي/الأفق */}
      {w.vista && backgrounds[w.vista] && (
        <Vista src={backgrounds[w.vista]!} size={[60, 22]} position={[0, 7, -46]} intensity={0.5} />
      )}
      {/* داخل السيارة: طبلون */}
      <Box position={[0, 0.72, 1.3]} size={[3.2, 0.5, 1]} color="#0e1116" rough={0.7} />
      <Lamp position={[0.6, 0.95, 1.2]} color="#66e0c0" intensity={1.2} size={0.03} />
    </group>
  );
}

function WorldBody({ w }: { w: WorldDef }) {
  switch (w.kind) {
    case "corridor":
      return <CorridorWorld w={w} />;
    case "hall":
      return <HallWorld w={w} />;
    case "tech":
      return <TechWorld w={w} />;
    case "basement":
      return <BasementWorld w={w} />;
    case "rooftop":
      return <RooftopWorld w={w} />;
    case "drive":
      return <DriveWorld w={w} />;
    default:
      return <RoomWorld w={w} />;
  }
}

/* ------------------------------------------------------------------ */
/* المشهد الكامل                                                      */
/* ------------------------------------------------------------------ */

export type Scene3DProps = {
  /** مفتاح المكان (نفس مفتاح الخلفية) */
  place: string;
  /** رقم اللقطة — يتغير مع تقدّم الحوار */
  shotIndex: number;
};

export default function Scene3D({ place, shotIndex }: Scene3DProps) {
  const w = useMemo(() => getWorld(place), [place]);
  const shot = w.shots[shotIndex % w.shots.length]!;

  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.15 }}
      camera={{ position: shot.pos, fov: shot.fov ?? 44, near: 0.1, far: 300 }}
      className="absolute inset-0"
    >
      <color attach="background" args={[w.fog]} />
      <fog attach="fog" args={[w.fog, w.fogNear * 2.2, w.fogFar * 2.2]} />
      <ambientLight intensity={w.ambient * 3.4} color="#aec1da" />
      <CameraFill color="#d6e0ee" intensity={32} />
      <hemisphereLight intensity={w.ambient * 2.6} color="#8fa6c8" groundColor="#241d18" />
      <directionalLight position={[3, 6, 5]} intensity={1.4} color="#cddcf2" />

      <CameraRig shot={shot} shotKey={`${place}-${shotIndex}`} />

      <Suspense fallback={null}>
        <WorldBody w={w} />
      </Suspense>

      {w.rain && <Rain />}

      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.5} luminanceSmoothing={0.5} mipmapBlur />
        <Noise opacity={0.045} />
        <Vignette eskil={false} offset={0.32} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
}
