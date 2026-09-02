/**
 * شخصيات ثلاثية الأبعاد مبنية بالكامل داخل المشروع (بلا نماذج جاهزة).
 * كل شخصية: رأس بملامح (عيون، حواجب، أنف، شفاه)، شعر، رقبة، جسم بمعطف،
 * أذرع بمرافق وكفوف وأصابع، ساقان وحذاء — مع تنفّس ورمش وحركة رأس نحو الكاميرا.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { CharacterId } from "@/game/types";
import { surface } from "./textures";

type Look = {
  skin: string;
  hair: string;
  /** طول الشعر: 0 قصير جداً، 1 طويل */
  hairLength: number;
  coat: string;
  shirt: string;
  pants: string;
  height: number;
  build: number;
  female?: boolean;
  beard?: boolean;
  glasses?: boolean;
  age?: number;
};

const looks: Partial<Record<CharacterId, Look>> = {
  daniel: {
    skin: "#d9ac8b",
    hair: "#2b2320",
    hairLength: 0.15,
    coat: "#2b3038",
    shirt: "#b9bec6",
    pants: "#22262c",
    height: 1.0,
    build: 1.0,
    beard: true,
  },
  claire: {
    skin: "#e6c1a6",
    hair: "#3b2a22",
    hairLength: 0.85,
    coat: "#5b2732",
    shirt: "#e3d8cc",
    pants: "#1e2126",
    height: 0.94,
    build: 0.86,
    female: true,
  },
  victor: {
    skin: "#cfa287",
    hair: "#8d8b86",
    hairLength: 0.1,
    coat: "#171a20",
    shirt: "#d8c98f",
    pants: "#14171c",
    height: 1.02,
    build: 1.12,
    age: 0.8,
  },
  maya: {
    skin: "#8c5e42",
    hair: "#1d1613",
    hairLength: 0.4,
    coat: "#22303a",
    shirt: "#cdd6da",
    pants: "#1b1f24",
    height: 0.96,
    build: 0.92,
    female: true,
  },
  elias: {
    skin: "#c99b7c",
    hair: "#3a2f28",
    hairLength: 0.35,
    coat: "#3a3226",
    shirt: "#9aa19a",
    pants: "#232620",
    height: 0.99,
    build: 0.96,
    beard: true,
  },
  noah: {
    skin: "#b9835d",
    hair: "#171310",
    hairLength: 0.12,
    coat: "#2a2622",
    shirt: "#7d848c",
    pants: "#1c1e22",
    height: 1.01,
    build: 1.05,
  },
  receptionist: {
    skin: "#dcb694",
    hair: "#2a211c",
    hairLength: 0.5,
    coat: "#2c3448",
    shirt: "#e9e2d6",
    pants: "#1f232a",
    height: 0.95,
    build: 0.88,
    female: true,
  },
};

function useMat(kind: Parameters<typeof surface>[0], tint: string, repeat: [number, number], extra?: { roughness?: number; metalness?: number }) {
  return useMemo(
    () => new THREE.MeshStandardMaterial(surface(kind, { tint, repeat, ...extra })),
    [kind, tint, repeat[0], repeat[1], extra?.roughness, extra?.metalness],
  );
}

export function Character3D({
  who,
  position,
  rotation = 0,
  /** 0 = واقف بعيد، 1 = قريب في مواجهة الكاميرا */
  attention = 1,
}: {
  who: CharacterId;
  position: [number, number, number];
  rotation?: number;
  attention?: number;
}) {
  const look = looks[who];
  const root = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const lidL = useRef<THREE.Mesh>(null);
  const lidR = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const blink = useRef(0);

  const skinMat = useMat("skin", look?.skin ?? "#d9ac8b", [1, 1], { roughness: 0.62 });
  const hairMat = useMat("hair", look?.hair ?? "#241c18", [2, 2]);
  const coatMat = useMat("cloth", look?.coat ?? "#2b3038", [2, 2]);
  const shirtMat = useMat("linen", look?.shirt ?? "#cfd3d8", [2, 2]);
  const pantsMat = useMat("cloth", look?.pants ?? "#20242a", [2, 3]);
  const shoeMat = useMat("leather", "#2a221e", [1, 1]);

  useFrame((s, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = s.clock.elapsedTime;
    if (chest.current) {
      const breathe = Math.sin(t * 1.25) * 0.012;
      chest.current.scale.set(1 + breathe, 1 + breathe * 0.6, 1 + breathe);
      chest.current.rotation.z = Math.sin(t * 0.42) * 0.012;
    }
    if (armL.current) armL.current.rotation.x = Math.sin(t * 0.6) * 0.05 - 0.06;
    if (armR.current) armR.current.rotation.x = Math.sin(t * 0.6 + 1.9) * 0.05 - 0.04;
    if (root.current) root.current.position.y = position[1] + Math.sin(t * 1.25) * 0.006;

    // الرأس يلتفت نحو الكاميرا بمقدار الانتباه
    if (head.current) {
      const local = head.current.worldToLocal(camera.position.clone());
      const yaw = Math.atan2(local.x, local.z) * 0.55 * attention;
      const pitch = -Math.atan2(local.y, Math.hypot(local.x, local.z)) * 0.35 * attention;
      const k = 1 - Math.exp(-3 * dt);
      head.current.rotation.y += (THREE.MathUtils.clamp(yaw, -0.7, 0.7) - head.current.rotation.y) * k;
      head.current.rotation.x += (THREE.MathUtils.clamp(pitch, -0.3, 0.3) - head.current.rotation.x) * k;
    }

    // رمش
    blink.current -= dt;
    if (blink.current < -0.12) blink.current = 2.4 + Math.random() * 3.2;
    const closed = blink.current < 0 ? 1 : 0;
    [lidL.current, lidR.current].forEach((l) => {
      if (l) l.scale.y += (closed ? 1 : 0.06) - l.scale.y === 0 ? 0 : ((closed ? 1 : 0.06) - l.scale.y) * (1 - Math.exp(-18 * dt));
    });
  });

  if (!look) return null;

  const H = look.height;
  const B = look.build;
  const eyeW = 0.028;

  return (
    <group ref={root} position={position} rotation-y={rotation}>
      {/* ساقان */}
      {[-0.085 * B, 0.085 * B].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.24 * H, 0]} castShadow material={pantsMat}>
            <capsuleGeometry args={[0.075 * B, 0.4 * H, 4, 12]} />
          </mesh>
          <mesh position={[0, 0.62 * H, 0]} castShadow material={pantsMat}>
            <capsuleGeometry args={[0.085 * B, 0.34 * H, 4, 12]} />
          </mesh>
          <mesh position={[0, 0.03, 0.045]} castShadow material={shoeMat}>
            <boxGeometry args={[0.1 * B, 0.06, 0.24]} />
          </mesh>
        </group>
      ))}

      {/* حوض */}
      <mesh position={[0, 0.86 * H, 0]} castShadow material={pantsMat}>
        <capsuleGeometry args={[0.13 * B, 0.12, 4, 16]} />
      </mesh>

      <group ref={chest} position={[0, 0.86 * H, 0]}>
        {/* قميص */}
        <mesh position={[0, 0.22 * H, 0.008]} castShadow material={shirtMat}>
          <capsuleGeometry args={[0.145 * B, 0.3 * H, 4, 16]} />
        </mesh>
        {/* معطف / سترة */}
        <mesh position={[0, 0.22 * H, -0.012]} castShadow material={coatMat}>
          <capsuleGeometry args={[0.168 * B, 0.31 * H, 4, 18]} />
        </mesh>
        {/* كتفان */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.16 * B, 0.4 * H, 0]} castShadow material={coatMat}>
            <sphereGeometry args={[0.072 * B, 14, 14]} />
          </mesh>
        ))}

        {/* أذرع */}
        {[-1, 1].map((s) => (
          <group
            key={s}
            ref={s === -1 ? armL : armR}
            position={[s * 0.175 * B, 0.38 * H, 0]}
            rotation-z={s * 0.09}
          >
            <mesh position={[0, -0.16 * H, 0]} castShadow material={coatMat}>
              <capsuleGeometry args={[0.052 * B, 0.24 * H, 4, 12]} />
            </mesh>
            <group position={[0, -0.32 * H, 0]} rotation-x={-0.28}>
              <mesh position={[0, -0.14 * H, 0]} castShadow material={coatMat}>
                <capsuleGeometry args={[0.045 * B, 0.2 * H, 4, 12]} />
              </mesh>
              {/* كف + أصابع */}
              <group position={[0, -0.28 * H, 0.01]}>
                <mesh castShadow material={skinMat}>
                  <boxGeometry args={[0.065, 0.09, 0.038]} />
                </mesh>
                {[-0.021, -0.007, 0.007, 0.021].map((fx, k) => (
                  <mesh key={k} position={[fx, -0.062, 0.004]} rotation-x={0.18} material={skinMat}>
                    <capsuleGeometry args={[0.0085, 0.05, 3, 6]} />
                  </mesh>
                ))}
                <mesh position={[0.036, -0.014, 0.012]} rotation-z={0.7} material={skinMat}>
                  <capsuleGeometry args={[0.0095, 0.032, 3, 6]} />
                </mesh>
              </group>
            </group>
          </group>
        ))}

        {/* رقبة */}
        <mesh position={[0, 0.45 * H, 0]} material={skinMat}>
          <capsuleGeometry args={[0.042, 0.06, 3, 12]} />
        </mesh>

        {/* رأس */}
        <group ref={head} position={[0, 0.56 * H, 0]}>
          <mesh castShadow material={skinMat}>
            <sphereGeometry args={[0.105, 28, 28]} />
          </mesh>
          {/* فك وذقن */}
          <mesh position={[0, -0.055, 0.012]} scale={[0.92, 0.72, 0.94]} material={skinMat}>
            <sphereGeometry args={[0.088, 20, 20]} />
          </mesh>
          {/* أنف */}
          <mesh position={[0, -0.012, 0.098]} rotation-x={0.2} material={skinMat}>
            <coneGeometry args={[0.022, 0.055, 10]} />
          </mesh>
          {/* شفاه */}
          <mesh position={[0, -0.056, 0.088]} scale={[1, 0.42, 0.5]}>
            <sphereGeometry args={[0.03, 14, 14]} />
            <meshStandardMaterial color={look.female ? "#a4544f" : "#94605a"} roughness={0.45} />
          </mesh>
          {/* أذنان */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.101, -0.008, 0.004]} scale={[0.4, 1, 0.7]} material={skinMat}>
              <sphereGeometry args={[0.03, 12, 12]} />
            </mesh>
          ))}
          {/* عينان */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.042, 0.014, 0.086]}>
              <mesh scale={[1, 0.78, 0.7]}>
                <sphereGeometry args={[eyeW, 16, 16]} />
                <meshStandardMaterial color="#f2eee6" roughness={0.18} />
              </mesh>
              <mesh position={[0, 0, eyeW * 0.62]}>
                <sphereGeometry args={[eyeW * 0.5, 14, 14]} />
                <meshStandardMaterial color="#3c2f26" roughness={0.1} />
              </mesh>
              <mesh position={[0, 0, eyeW * 0.82]}>
                <sphereGeometry args={[eyeW * 0.22, 10, 10]} />
                <meshBasicMaterial color="#07070a" />
              </mesh>
              {/* جفن */}
              <mesh
                ref={s === -1 ? lidL : lidR}
                position={[0, eyeW * 0.55, eyeW * 0.3]}
                scale={[1, 0.06, 1]}
                material={skinMat}
              >
                <boxGeometry args={[eyeW * 2.3, eyeW * 1.6, eyeW * 0.6]} />
              </mesh>
              {/* حاجب */}
              <mesh position={[0, eyeW * 1.5, eyeW * 0.4]} rotation-z={s * -0.1} material={hairMat}>
                <boxGeometry args={[eyeW * 2.2, eyeW * 0.45, eyeW * 0.5]} />
              </mesh>
            </group>
          ))}
          {/* شعر */}
          <mesh position={[0, 0.028, -0.006]} scale={[1.06, 1.02, 1.06]} material={hairMat}>
            <sphereGeometry args={[0.104, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          </mesh>
          {look.hairLength > 0.3 && (
            <mesh
              position={[0, -0.03 - look.hairLength * 0.09, -0.045]}
              scale={[1.05, 1, 0.75]}
              material={hairMat}
            >
              <capsuleGeometry args={[0.088, look.hairLength * 0.22, 4, 16]} />
            </mesh>
          )}
          {look.beard && (
            <mesh position={[0, -0.058, 0.045]} scale={[0.95, 0.8, 0.85]} material={hairMat}>
              <sphereGeometry args={[0.072, 18, 18, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.48]} />
            </mesh>
          )}
          {look.glasses && (
            <group position={[0, 0.014, 0.098]}>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.042, 0, 0]} rotation-x={Math.PI / 2}>
                  <torusGeometry args={[0.032, 0.004, 8, 20]} />
                  <meshStandardMaterial color="#1a1d22" metalness={0.7} roughness={0.3} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      </group>
    </group>
  );
}

export default Character3D;
