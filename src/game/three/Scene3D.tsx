import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CharacterId } from "@/game/types";
import { Character3D } from "./Character3D";
import { cityNightTexture, surface, type TexKind } from "./textures";
import { getWorld, type Shot, type WorldDef } from "./world";

/* ------------------------------------------------------------------ */
/* كاميرا سينمائية                                                     */
/* ------------------------------------------------------------------ */

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
/* أسطح مكسوّة بتكسترات إجرائية                                        */
/* ------------------------------------------------------------------ */

/** جسم صندوقي مكسوّ من كل الاتجاهات */
function Surf({
  position,
  size,
  tex,
  tint,
  rotation,
  repeat,
  roughness,
  metalness,
}: {
  position: [number, number, number];
  size: [number, number, number];
  tex: TexKind;
  tint?: string;
  rotation?: [number, number, number];
  repeat?: [number, number];
  roughness?: number;
  metalness?: number;
}) {
  const props = useMemo(
    () =>
      surface(tex, {
        repeat: repeat ?? [Math.max(0.5, size[0] * 0.6), Math.max(0.5, size[1] * 0.6)],
        ...(tint ? { tint } : {}),
        ...(roughness !== undefined ? { roughness } : {}),
        ...(metalness !== undefined ? { metalness } : {}),
      }),
    [tex, tint, size[0], size[1], repeat?.[0], repeat?.[1], roughness, metalness],
  );
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial {...props} />
    </mesh>
  );
}

/** سطح مستوٍ (أرض/سقف) مكسوّ */
function Plane({
  size,
  tex,
  tint,
  position,
  rotation,
  repeat,
  roughness,
  metalness,
}: {
  size: [number, number];
  tex: TexKind;
  tint?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  repeat?: [number, number];
  roughness?: number;
  metalness?: number;
}) {
  const props = useMemo(
    () =>
      surface(tex, {
        repeat: repeat ?? [size[0] * 0.5, size[1] * 0.5],
        ...(tint ? { tint } : {}),
        ...(roughness !== undefined ? { roughness } : {}),
        ...(metalness !== undefined ? { metalness } : {}),
      }),
    [tex, tint, size[0], size[1], repeat?.[0], repeat?.[1], roughness, metalness],
  );
  return (
    <mesh
      position={position ?? [0, 0, 0]}
      rotation={rotation ?? [-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={size} />
      <meshStandardMaterial {...props} />
    </mesh>
  );
}

/** نافذة/أفق مدينة إجرائي — بلا أي صور معلّقة على الجدران */
function CityView({
  size,
  position,
  rotation,
  intensity = 1,
  seed = 7,
}: {
  size: [number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  intensity?: number;
  seed?: number;
}) {
  const tex = useMemo(() => cityNightTexture(seed), [seed]);
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={tex}
        toneMapped={false}
        color={new THREE.Color(intensity, intensity, intensity)}
      />
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

/* ------------------------------------------------------------------ */
/* الأنماط                                                            */
/* ------------------------------------------------------------------ */

function RoomWorld({ w }: { w: WorldDef }) {
  const flick = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    if (flick.current) {
      flick.current.intensity = 105 + Math.sin(s.clock.elapsedTime * 9) * 6 + Math.random() * 4;
    }
  });
  return (
    <group>
      {/* أرض سجاد وسقف جبس وجدران ورق حائط */}
      <Plane size={[9, 11]} tex="carpet" tint={w.floor} repeat={[6, 7]} />
      <Plane
        size={[9, 11]}
        tex="plaster"
        tint={w.wall}
        position={[0, 2.9, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        repeat={[4, 5]}
      />
      <Surf position={[0, 1.45, -5.4]} size={[9, 2.9, 0.2]} tex="wallpaper" tint={w.wall} repeat={[5, 2]} />
      <Surf position={[-4.5, 1.45, 0]} size={[0.2, 2.9, 11]} tex="wallpaper" tint={w.wall} repeat={[6, 2]} />
      <Surf position={[4.5, 1.45, 0]} size={[0.2, 2.9, 11]} tex="wallpaper" tint={w.wall} repeat={[6, 2]} />
      <Surf position={[0, 1.45, 5.4]} size={[9, 2.9, 0.2]} tex="wallpaper" tint={w.wall} repeat={[5, 2]} />
      {/* وزرة خشبية أسفل الجدران */}
      {[
        [0, 0.08, -5.28, 9, 0.16, 0.06],
        [-4.38, 0.08, 0, 0.06, 0.16, 11],
        [4.38, 0.08, 0, 0.06, 0.16, 11],
      ].map((b, i) => (
        <Surf
          key={i}
          position={[b[0]!, b[1]!, b[2]!]}
          size={[b[3]!, b[4]!, b[5]!]}
          tex="darkwood"
          repeat={[4, 1]}
        />
      ))}

      {/* نافذة على المدينة */}
      <group>
        <CityView
          size={[3.4, 1.9]}
          position={[-4.36, 1.6, -1.4]}
          rotation={[0, Math.PI / 2, 0]}
          intensity={0.85}
          seed={w.vista === "room310b" ? 12 : 7}
        />
        <Surf position={[-4.3, 1.6, -1.4]} size={[0.05, 2.05, 0.07]} tex="metal" tint="#20242a" repeat={[1, 2]} />
        <Surf position={[-4.3, 0.55, -1.4]} size={[0.14, 0.1, 3.6]} tex="darkwood" repeat={[3, 1]} />
        <rectAreaLight
          position={[-4.2, 1.6, -1.4]}
          rotation={[0, Math.PI / 2, 0]}
          intensity={2.4}
          width={3.4}
          height={1.9}
          color="#93b4d8"
        />
        {/* ستارة قماشية */}
        <Surf position={[-4.2, 1.6, -3.5]} size={[0.08, 2.2, 0.9]} tex="fabric" tint="#3a3f4a" repeat={[1, 3]} />
      </group>

      {/* سرير: هيكل خشب + مرتبة + شراشف كتّان */}
      <Surf position={[2.3, 0.28, -2.4]} size={[2.25, 0.55, 3.45]} tex="darkwood" repeat={[3, 3]} />
      <Surf position={[2.3, 0.63, -2.4]} size={[2.15, 0.22, 3.3]} tex="linen" tint="#d9d4c7" repeat={[3, 4]} />
      <Surf position={[2.3, 0.8, -3.85]} size={[1.5, 0.28, 0.4]} tex="linen" tint="#efeade" repeat={[2, 1]} />
      <Surf position={[3.55, 0.35, -3.7]} size={[0.6, 0.7, 0.5]} tex="darkwood" repeat={[2, 2]} />

      {/* مكتب + كرسي جلد */}
      <Surf position={[-2.6, 0.72, -3.6]} size={[2.4, 0.09, 1.1]} tex="wood" repeat={[3, 2]} />
      <Surf position={[-3.7, 0.36, -3.6]} size={[0.1, 0.72, 1]} tex="darkwood" />
      <Surf position={[-1.5, 0.36, -3.6]} size={[0.1, 0.72, 1]} tex="darkwood" />
      <Surf position={[-2.4, 0.45, -2.5]} size={[0.6, 0.12, 0.6]} tex="leather" repeat={[2, 2]} />
      <Surf position={[-2.4, 0.78, -2.24]} size={[0.58, 0.66, 0.1]} tex="leather" repeat={[2, 2]} />

      {/* مصابيح */}
      <Lamp position={[-3.2, 1.05, -3.5]} color={w.accent} intensity={5} />
      <Lamp position={[3.6, 0.95, -3.7]} color="#ffce8a" intensity={3.5} size={0.07} />
      <group position={[0, 2.5, -0.5]}>
        <pointLight ref={flick} color={w.accent} intensity={105} distance={12} decay={2} castShadow />
        <mesh>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshBasicMaterial color={w.accent} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <coneGeometry args={[0.32, 0.22, 18, 1, true]} />
          <meshStandardMaterial {...surface("metal", { tint: "#2b2f36", repeat: [2, 1] })} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* باب */}
      <Surf position={[1.4, 1.05, 5.28]} size={[1.1, 2.1, 0.1]} tex="darkwood" repeat={[2, 3]} />
      <mesh position={[0.95, 1.05, 5.2]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial {...surface("metal", { tint: "#c9a227", repeat: [1, 1], metalness: 0.95, roughness: 0.22 })} />
      </mesh>

      {/* خزانة وتلفاز وحقيبة */}
      <Surf position={[-3.1, 0.9, 2.6]} size={[1.8, 1.8, 0.6]} tex="darkwood" repeat={[3, 3]} />
      <Surf position={[-1.2, 1.5, 2.9]} size={[1.6, 0.9, 0.08]} tex="metal" tint="#12151a" repeat={[2, 1]} roughness={0.3} />
      <Surf position={[0.9, 0.25, 3.4]} size={[0.7, 0.5, 0.35]} tex="leather" repeat={[2, 2]} />

      {/* مرآة بإطار معدني */}
      <Surf position={[4.36, 1.7, 1.6]} size={[0.06, 1.2, 1.7]} tex="metal" tint="#3c3f47" repeat={[1, 2]} />
      <mesh position={[4.31, 1.7, 1.6]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.5, 1.0]} />
        <meshStandardMaterial color="#5b6470" roughness={0.06} metalness={0.95} />
      </mesh>
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
        c.children.forEach((cc) => {
          const l = cc as THREE.PointLight;
          if (l.isPointLight) l.intensity = v * 150;
        });
      });
    }
  });
  return (
    <group>
      <Plane size={[4.2, 30]} tex="carpet" tint={w.floor} repeat={[4, 26]} />
      <Plane
        size={[4.2, 30]}
        tex="plaster"
        tint={w.wall}
        position={[0, 2.7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        repeat={[3, 18]}
      />
      <Surf position={[-2.1, 1.35, 0]} size={[0.2, 2.7, 30]} tex="wallpaper" tint={w.wall} repeat={[16, 2]} />
      <Surf position={[2.1, 1.35, 0]} size={[0.2, 2.7, 30]} tex="wallpaper" tint={w.wall} repeat={[16, 2]} />
      <Surf position={[0, 1.35, -14.9]} size={[4.2, 2.7, 0.2]} tex="wallpaper" tint={w.wall} repeat={[3, 2]} />
      {/* وزرة */}
      <Surf position={[-1.98, 0.09, 0]} size={[0.06, 0.18, 30]} tex="darkwood" repeat={[10, 1]} />
      <Surf position={[1.98, 0.09, 0]} size={[0.06, 0.18, 30]} tex="darkwood" repeat={[10, 1]} />

      {doors.map((z) => (
        <group key={z}>
          <Surf position={[-1.95, 1.05, z]} size={[0.08, 2.1, 1.05]} tex="darkwood" repeat={[2, 3]} />
          <Surf position={[1.95, 1.05, z + 1.2]} size={[0.08, 2.1, 1.05]} tex="darkwood" repeat={[2, 3]} />
          <mesh position={[-1.86, 1.9, z]}>
            <boxGeometry args={[0.02, 0.16, 0.3]} />
            <meshStandardMaterial color="#0d0f12" emissive={w.accent} emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}

      <group ref={pulse}>
        {[-12, -8, -4, 0, 4, 8, 12].map((z) => (
          <Lamp key={z} position={[0, 2.45, z]} color={w.accent} intensity={5} size={0.1} />
        ))}
      </group>

      <mesh position={[-1.85, 1.75, 1.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.42, 0.24]} />
        <meshStandardMaterial color="#0d0f12" emissive={w.accent} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function HallWorld({ w }: { w: WorldDef }) {
  const cols = useMemo(() => [-6, -2, 2, 6], []);
  const colMat = useMemo(
    () => new THREE.MeshStandardMaterial(surface("marble", { tint: w.wall, repeat: [2, 4] })),
    [w.wall],
  );
  return (
    <group>
      <Plane size={[24, 40]} tex="marble" tint={w.floor} repeat={[8, 13]} roughness={0.14} metalness={0.5} />
      <Plane
        size={[24, 40]}
        tex="plaster"
        tint={w.wall}
        position={[0, 7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        repeat={[8, 12]}
      />
      <Surf position={[0, 3.5, -12]} size={[24, 7, 0.4]} tex="marble" tint={w.wall} repeat={[8, 3]} />
      <Surf position={[-11.8, 3.5, 0]} size={[0.4, 7, 40]} tex="marble" tint={w.wall} repeat={[12, 3]} />
      <Surf position={[11.8, 3.5, 0]} size={[0.4, 7, 40]} tex="marble" tint={w.wall} repeat={[12, 3]} />

      {/* واجهة زجاجية على المدينة بدل صورة معلّقة */}
      <CityView size={[15, 5.4]} position={[0, 3.6, -11.72]} intensity={0.8} seed={21} />
      {[-5, 0, 5].map((x) => (
        <Surf key={x} position={[x, 3.6, -11.66]} size={[0.12, 5.6, 0.1]} tex="metal" tint="#1b1f26" repeat={[1, 3]} />
      ))}

      {cols.map((x) =>
        [-6, 0, 6].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 3.5, z]} castShadow material={colMat}>
            <cylinderGeometry args={[0.42, 0.5, 7, 24]} />
          </mesh>
        )),
      )}

      {/* مكتب الاستقبال */}
      <Surf position={[-3, 0.6, -6]} size={[7, 1.2, 1.4]} tex="wood" repeat={[6, 2]} />
      <Surf position={[-3, 1.25, -6]} size={[7.2, 0.1, 1.6]} tex="marble" tint="#20252d" repeat={[6, 2]} roughness={0.12} />

      {/* ثريّات */}
      {[[-4, 4.8, 2], [4, 4.8, -2], [0, 5.2, 6]].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <pointLight color={w.accent} intensity={520} distance={26} decay={2} castShadow />
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

      {/* أرائك ومناضد */}
      {[[6, 0.3, 4], [7.5, 0.3, 1]].map((p, i) => (
        <group key={i}>
          <Surf position={p as [number, number, number]} size={[2.4, 0.6, 1.2]} tex="fabric" repeat={[3, 2]} />
          <Surf
            position={[(p[0] as number) - 0.1, 0.62, p[2] as number]}
            size={[2.3, 0.16, 1.1]}
            tex="fabric"
            tint="#6c7482"
            repeat={[3, 2]}
          />
        </group>
      ))}
      {/* سجادة كبيرة */}
      <Plane size={[9, 7]} tex="carpet" tint="#4a3128" position={[2, 0.012, 3]} repeat={[5, 4]} />
    </group>
  );
}

function TechWorld({ w }: { w: WorldDef }) {
  const screens = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        x: -1.65 + (i % 4) * 1.1,
        y: 1.05 + Math.floor(i / 4) * 0.72,
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
      <Plane size={[8, 10]} tex="tile" tint={w.floor} repeat={[8, 10]} />
      <Plane
        size={[8, 10]}
        tex="concrete"
        tint={w.wall}
        position={[0, 2.7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        repeat={[5, 6]}
      />
      <Surf position={[0, 1.35, -3.6]} size={[8, 2.7, 0.2]} tex="concrete" tint={w.wall} repeat={[6, 2]} />
      <Surf position={[-3.9, 1.35, 0]} size={[0.2, 2.7, 10]} tex="concrete" tint={w.wall} repeat={[7, 2]} />
      <Surf position={[3.9, 1.35, 0]} size={[0.2, 2.7, 10]} tex="concrete" tint={w.wall} repeat={[7, 2]} />

      <group ref={grp}>
        {screens.map((s, i) => (
          <mesh key={i} position={[s.x, s.y, -3.45]}>
            <planeGeometry args={[1, 0.62]} />
            <meshStandardMaterial color="#0a1416" emissive={w.accent} emissiveIntensity={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>
      <rectAreaLight position={[0, 1.5, -3]} intensity={3.5} width={5} height={2} color={w.accent} />

      <Surf position={[0, 0.75, -2.3]} size={[5, 0.1, 1]} tex="metal" tint="#262b32" repeat={[5, 1]} />
      <Surf position={[0, 0.35, -2.3]} size={[4.8, 0.7, 0.9]} tex="metal" tint="#191d23" repeat={[5, 1]} />
      <Surf position={[-1.4, 0.83, -2.3]} size={[0.9, 0.04, 0.35]} tex="metal" tint="#2c3138" repeat={[2, 1]} />
      <Lamp position={[2.6, 2.3, 0]} color={w.accent} intensity={3} size={0.06} />

      <Surf position={[-3.3, 1.2, 1.5]} size={[0.8, 2.4, 3]} tex="rustmetal" tint="#3a4048" repeat={[2, 3]} />
      <Surf position={[3.3, 1.2, 1.5]} size={[0.8, 2.4, 3]} tex="rustmetal" tint="#3a4048" repeat={[2, 3]} />
      {/* كرسي المشغّل */}
      <Surf position={[0, 0.45, -1.1]} size={[0.6, 0.12, 0.6]} tex="leather" repeat={[2, 2]} />
      <Surf position={[0, 0.78, -0.84]} size={[0.58, 0.66, 0.1]} tex="leather" repeat={[2, 2]} />
    </group>
  );
}

function BasementWorld({ w }: { w: WorldDef }) {
  const bulb = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (bulb.current) {
      bulb.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.9) * 0.12;
      const l = bulb.current.children[1] as THREE.PointLight | undefined;
      if (l?.isPointLight) l.intensity = 100 + Math.random() * 22;
    }
  });
  return (
    <group>
      <Plane size={[8, 16]} tex="concrete" tint={w.floor} repeat={[7, 14]} />
      <Plane
        size={[8, 16]}
        tex="concrete"
        tint={w.wall}
        position={[0, 2.4, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        repeat={[5, 10]}
      />
      <Surf position={[-3.9, 1.2, 0]} size={[0.2, 2.4, 16]} tex="concrete" tint={w.wall} repeat={[10, 2]} />
      <Surf position={[3.9, 1.2, 0]} size={[0.2, 2.4, 16]} tex="concrete" tint={w.wall} repeat={[10, 2]} />
      <Surf position={[0, 1.2, -7.9]} size={[8, 2.4, 0.2]} tex="concrete" tint={w.wall} repeat={[6, 2]} />

      {[-6, -3, 0, 3, 6].map((z) => (
        <mesh key={z} position={[0, 2.15, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.12, 0.12, 7.6, 14]} />
          <meshStandardMaterial {...surface("rustmetal", { repeat: [1, 6] })} />
        </mesh>
      ))}

      <group ref={bulb} position={[0, 2.3, 0]}>
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.7, 6]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
        <pointLight position={[0, -0.72, 0]} color={w.accent} intensity={105} distance={11} decay={2} castShadow />
        <mesh position={[0, -0.72, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
        </mesh>
      </group>

      <Surf position={[-2.8, 0.4, -3]} size={[1.2, 0.8, 1.2]} tex="wood" tint="#6a5238" repeat={[2, 2]} />
      <Surf position={[2.6, 0.9, -4.5]} size={[1.4, 1.8, 0.7]} tex="rustmetal" repeat={[2, 3]} />
      <Surf position={[2.2, 0.3, 2]} size={[1, 0.6, 1]} tex="wood" tint="#6a5238" repeat={[2, 2]} />
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
  const towerMat = useMemo(
    () => new THREE.MeshStandardMaterial(surface("concrete", { tint: "#151a21", repeat: [2, 6] })),
    [],
  );
  return (
    <group>
      <Plane size={[26, 26]} tex="concrete" tint={w.floor} repeat={[14, 14]} />
      <Surf position={[0, 0.55, -13]} size={[26, 1.1, 0.4]} tex="concrete" tint={w.wall} repeat={[16, 1]} />
      <Surf position={[-13, 0.55, 0]} size={[0.4, 1.1, 26]} tex="concrete" tint={w.wall} repeat={[16, 1]} />
      <Surf position={[13, 0.55, 0]} size={[0.4, 1.1, 26]} tex="concrete" tint={w.wall} repeat={[16, 1]} />
      <Surf position={[7, 1.6, 8]} size={[5, 3.2, 4]} tex="concrete" tint={w.wall} repeat={[4, 3]} />
      <Lamp position={[7, 3.4, 6]} color="#ffb057" intensity={4} size={0.07} />
      {/* وحدات تكييف */}
      <Surf position={[-6, 0.6, 4]} size={[2.4, 1.2, 2.4]} tex="rustmetal" repeat={[3, 2]} />
      <Surf position={[-2.5, 0.45, 7]} size={[1.6, 0.9, 1.6]} tex="metal" tint="#3a4149" repeat={[2, 2]} />

      <CityView size={[130, 44]} position={[0, 12, -70]} intensity={0.7} seed={33} />

      {city.map((b, i) => (
        <group key={i}>
          <mesh position={[b.x, b.h / 2 - 2, b.z]} material={towerMat}>
            <boxGeometry args={[b.wd, b.h, b.wd]} />
          </mesh>
          <mesh position={[b.x, b.h / 2 - 2, b.z + b.wd / 2 + 0.02]}>
            <planeGeometry args={[b.wd * 0.8, b.h * 0.85]} />
            <meshStandardMaterial
              color="#0b0f14"
              emissive={i % 3 === 0 ? "#ffce8a" : "#7fa8ff"}
              emissiveIntensity={0.24}
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
      <Plane size={[26, 140]} tex="asphalt" tint={w.floor} repeat={[14, 70]} roughness={0.42} metalness={0.3} />
      <group ref={road}>
        {Array.from({ length: 24 }).map((_, i) => (
          <mesh key={i} position={[0, 0.01, -i * 2.5]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.16, 1.4]} />
            <meshStandardMaterial color="#c9c2ae" roughness={0.6} />
          </mesh>
        ))}
      </group>
      <group ref={lights}>
        {Array.from({ length: 12 }).map((_, i) => (
          <group key={i} position={[0, 0, -i * 5]}>
            <Surf position={[4.2, 2.4, 0]} size={[0.14, 4.8, 0.14]} tex="metal" tint="#1b1f26" repeat={[1, 4]} />
            <Lamp position={[3.6, 4.7, 0]} color={w.accent} intensity={7} size={0.11} />
            <Surf position={[-4.2, 2.4, 0]} size={[0.14, 4.8, 0.14]} tex="metal" tint="#1b1f26" repeat={[1, 4]} />
            <Lamp position={[-3.6, 4.7, 0]} color={w.accent} intensity={7} size={0.11} />
          </group>
        ))}
      </group>
      <CityView size={[60, 22]} position={[0, 7, -46]} intensity={0.6} seed={5} />
      {/* داخل السيارة: طبلون جلد */}
      <Surf position={[0, 0.72, 1.3]} size={[3.2, 0.5, 1]} tex="leather" tint="#171a1f" repeat={[4, 1]} />
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
/* موضع الشخصية ولقطات الحوار                                          */
/* ------------------------------------------------------------------ */

type Anchor = { pos: [number, number, number]; face: number };

const anchors: Record<string, Anchor> = {
  room: { pos: [-0.5, 0, -1.2], face: Math.PI },
  corridor: { pos: [0.35, 0, -2.6], face: Math.PI },
  hall: { pos: [-0.6, 0, -4.2], face: Math.PI },
  tech: { pos: [0.4, 0, -1.5], face: Math.PI },
  basement: { pos: [0.2, 0, -2.4], face: Math.PI },
  rooftop: { pos: [-1.2, 0, -4], face: Math.PI },
  drive: { pos: [-0.85, 0.35, 0.6], face: Math.PI * 0.92 },
};

/** لقطات حوارية مؤطّرة على الشخصية: متوسطة / قريبة / كتف */
function talkShots(a: Anchor): Shot[] {
  const [x, y, z] = a.pos;
  const eye = y + 1.52;
  return [
    { pos: [x + 0.35, eye - 0.05, z + 2.1], target: [x, eye - 0.02, z], fov: 40, handheld: 0.5, drift: [0, 0, -0.25] },
    { pos: [x - 0.42, eye + 0.04, z + 1.15], target: [x, eye + 0.02, z], fov: 32, handheld: 0.35, drift: [0.12, 0, -0.12] },
    { pos: [x + 0.9, eye - 0.12, z + 1.6], target: [x - 0.05, eye - 0.05, z], fov: 36, handheld: 0.6, drift: [-0.2, 0, -0.2] },
    { pos: [x - 0.15, eye + 0.12, z + 2.9], target: [x, eye - 0.18, z], fov: 46, handheld: 0.7, drift: [0, -0.05, -0.4] },
  ];
}

const withBody: CharacterId[] = [
  "daniel",
  "claire",
  "victor",
  "maya",
  "elias",
  "noah",
  "receptionist",
];

/* ------------------------------------------------------------------ */
/* المشهد الكامل                                                      */
/* ------------------------------------------------------------------ */

export type Scene3DProps = {
  place: string;
  shotIndex: number;
  /** الشخصية المتحدثة الآن — تظهر مجسّمة وتُؤطّرها الكاميرا */
  speaker?: CharacterId | undefined;
  /** لقطة قريبة (فحص دليل مع شخصية) */
  closeup?: boolean | undefined;
};

export default function Scene3D({ place, shotIndex, speaker, closeup }: Scene3DProps) {
  const w = useMemo(() => getWorld(place), [place]);
  const anchor = anchors[w.kind] ?? anchors["room"]!;
  const showChar = !!speaker && withBody.includes(speaker);

  const shot = useMemo(() => {
    if (showChar) {
      const ts = talkShots(anchor);
      const idx = closeup ? 1 : shotIndex % ts.length;
      return ts[idx]!;
    }
    return w.shots[shotIndex % w.shots.length]!;
  }, [showChar, anchor, closeup, shotIndex, w]);

  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.1 }}
      camera={{ position: shot.pos, fov: shot.fov ?? 44, near: 0.05, far: 300 }}
      className="absolute inset-0"
    >
      <color attach="background" args={[w.fog]} />
      <fog attach="fog" args={[w.fog, w.fogNear * 2.2, w.fogFar * 2.2]} />
      <ambientLight intensity={w.ambient * 3.2} color="#aec1da" />
      <CameraFill color="#d6e0ee" intensity={showChar ? 18 : 32} />
      <hemisphereLight intensity={w.ambient * 2.4} color="#8fa6c8" groundColor="#241d18" />
      <directionalLight position={[3, 6, 5]} intensity={1.3} color="#cddcf2" />

      <CameraRig shot={shot} shotKey={`${place}-${shotIndex}-${speaker ?? ""}-${closeup ? 1 : 0}`} />

      <Suspense fallback={null}>
        <WorldBody w={w} />
        {showChar && (
          <group>
            <Character3D who={speaker!} position={anchor.pos} rotation={anchor.face} />
            {/* إضاءة مفتاحية على الوجه */}
            <pointLight
              position={[anchor.pos[0] + 0.7, anchor.pos[1] + 1.85, anchor.pos[2] + 1.1]}
              intensity={22}
              distance={5}
              decay={2}
              color="#ffe0bd"
            />
            <pointLight
              position={[anchor.pos[0] - 0.9, anchor.pos[1] + 1.5, anchor.pos[2] - 0.6]}
              intensity={10}
              distance={4.5}
              decay={2}
              color="#7fa8ff"
            />
          </group>
        )}
      </Suspense>

      {w.rain && <Rain />}

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.55} luminanceSmoothing={0.5} mipmapBlur />
        <Noise opacity={0.04} />
        <Vignette eskil={false} offset={0.32} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
}
