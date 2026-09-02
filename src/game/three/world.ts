/**
 * تعريف عوالم اللعبة ثلاثية الأبعاد.
 * كل مكان له نمط هندسي + لوحة ألوان + قائمة "لقطات كاميرا" سينمائية
 * تتغير مع تقدّم الحوار، حتى لا يبقى المشهد صورة مجمّدة.
 */

export type Vec3 = [number, number, number];

export type Shot = {
  /** موضع الكاميرا */
  pos: Vec3;
  /** الهدف الذي تنظر إليه */
  target: Vec3;
  /** مدى الحركة البطيئة (دوللي) خلال اللقطة */
  drift?: Vec3;
  fov?: number;
  /** اهتزاز كاميرا محمولة */
  handheld?: number;
};

export type WorldKind =
  | "room"
  | "corridor"
  | "hall"
  | "tech"
  | "basement"
  | "rooftop"
  | "drive";

export type WorldDef = {
  kind: WorldKind;
  /** لون الجو/الضباب */
  fog: string;
  fogNear: number;
  fogFar: number;
  wall: string;
  floor: string;
  accent: string;
  /** قوة الإضاءة العامة */
  ambient: number;
  /** مفتاح صورة الخلفية المستخدمة للنافذة/الأفق */
  vista?: string;
  rain?: boolean;
  shots: Shot[];
};

const roomShots: Shot[] = [
  { pos: [0.2, 1.6, 3.4], target: [0, 1.35, -3.4], drift: [0, 0, -1.2], fov: 46, handheld: 0.5 },
  { pos: [2.6, 1.5, 1.6], target: [-3.4, 1.4, -2.6], drift: [-0.5, 0, -0.4], fov: 40 },
  { pos: [-1.4, 1.3, 1.2], target: [2.6, 1.1, -3], drift: [0.5, 0, -0.5], fov: 44, handheld: 0.8 },
  { pos: [0.6, 1.8, -0.6], target: [-4.2, 1.55, -1.6], drift: [-0.4, -0.15, 0], fov: 42 },
  { pos: [3.2, 1.15, -1.2], target: [-2.6, 1.25, -3.6], drift: [-0.6, 0, -0.3], fov: 38, handheld: 0.9 },
];


export const worlds: Record<string, WorldDef> = {
  apartment: {
    kind: "room",
    fog: "#0b1016",
    fogNear: 3,
    fogFar: 18,
    wall: "#20242c",
    floor: "#15181d",
    accent: "#c9a227",
    ambient: 0.35,
    vista: "apartment",
    rain: true,
    shots: roomShots,
  },
  room310: {
    kind: "room",
    fog: "#0a0d12",
    fogNear: 2.5,
    fogFar: 16,
    wall: "#262a30",
    floor: "#191b1f",
    accent: "#d8b45a",
    ambient: 0.3,
    vista: "room310",
    rain: true,
    shots: roomShots,
  },
  room310b: {
    kind: "room",
    fog: "#07090c",
    fogNear: 2,
    fogFar: 13,
    wall: "#1b1e22",
    floor: "#121316",
    accent: "#7fd1c0",
    ambient: 0.22,
    vista: "room310b",
    shots: roomShots,
  },
  hallway: {
    kind: "corridor",
    fog: "#0a0c10",
    fogNear: 3,
    fogFar: 26,
    wall: "#2a2620",
    floor: "#3a2a24",
    accent: "#e0b665",
    ambient: 0.25,
    shots: [
      { pos: [0, 1.6, 9], target: [0, 1.5, -8], drift: [0, 0, -3], fov: 50, handheld: 0.7 },
      { pos: [0.9, 1.45, 3], target: [-1.1, 1.5, -6], drift: [0, 0, -2], fov: 42 },
      { pos: [-1.2, 1.55, -1], target: [1.4, 1.4, -7], drift: [0.4, 0, -1.5], handheld: 1 },
      { pos: [0, 1.2, -4], target: [0, 1.6, 8], drift: [0, 0, 1.5], fov: 55 },
    ],
  },
  hallway_red: {
    kind: "corridor",
    fog: "#12070a",
    fogNear: 2,
    fogFar: 20,
    wall: "#2a1c1c",
    floor: "#331f1c",
    accent: "#ff3b30",
    ambient: 0.18,
    shots: [
      { pos: [0, 1.6, 8], target: [0, 1.5, -8], drift: [0, 0, -3.5], handheld: 1.4 },
      { pos: [-1.4, 1.4, 1], target: [1.6, 1.5, -7], drift: [0.6, 0, -2], handheld: 1.6 },
      { pos: [0, 1.1, -3], target: [0, 1.7, 8], drift: [0, 0.2, 2], fov: 58, handheld: 1.2 },
    ],
  },
  lobby: {
    kind: "hall",
    fog: "#0a0d13",
    fogNear: 5,
    fogFar: 40,
    wall: "#242832",
    floor: "#14161b",
    accent: "#e2c178",
    ambient: 0.32,
    rain: true,
    vista: "lobby",
    shots: [
      { pos: [0, 2, 13], target: [0, 2.2, -6], drift: [0, 0, -3], fov: 48, handheld: 0.5 },
      { pos: [-5, 1.7, 4], target: [4, 2, -5], drift: [1.5, 0, 0], fov: 42 },
      { pos: [4.5, 2.2, 2], target: [-3, 2.1, -5], drift: [-1, 0, -0.5], fov: 48 },
      { pos: [0.5, 1.5, -2], target: [-4, 2.4, 9], drift: [0, 0.2, 1.5], handheld: 0.8 },
    ],
  },
  ballroom: {
    kind: "hall",
    fog: "#0c0a10",
    fogNear: 6,
    fogFar: 46,
    wall: "#2b2436",
    floor: "#181420",
    accent: "#f0cf8a",
    ambient: 0.3,
    vista: "ballroom",
    shots: [
      { pos: [0, 2.4, 15], target: [0, 2.6, -8], drift: [0, 0, -4], fov: 50 },
      { pos: [-6, 2, 6], target: [5, 2.4, -6], drift: [2, 0, 0], fov: 44 },
      { pos: [0, 2.6, 3], target: [0, 2.4, -6], drift: [0, 0, -1.5], fov: 52 },
    ],
  },
  security: {
    kind: "tech",
    fog: "#070b0c",
    fogNear: 2,
    fogFar: 14,
    wall: "#191d1f",
    floor: "#101314",
    accent: "#69d7e0",
    ambient: 0.2,
    shots: [
      { pos: [0, 1.5, 4.2], target: [0, 1.5, -3], drift: [0, 0, -1.2], fov: 45, handheld: 0.6 },
      { pos: [-1.8, 1.4, 1.5], target: [1.5, 1.5, -3], drift: [0.6, 0, -0.6], fov: 38 },
      { pos: [1.6, 1.2, 0.6], target: [-1.6, 1.6, -3], drift: [-0.4, 0.2, 0], fov: 40 },
    ],
  },
  archive: {
    kind: "tech",
    fog: "#080a0d",
    fogNear: 2,
    fogFar: 16,
    wall: "#1d2024",
    floor: "#14161a",
    accent: "#8fb7ff",
    ambient: 0.18,
    shots: [
      { pos: [0, 1.6, 4.5], target: [0, 1.4, -3], drift: [0, 0, -1.5], handheld: 0.7 },
      { pos: [2, 1.3, 1.2], target: [-2, 1.5, -3], drift: [-0.8, 0, -0.4], fov: 42 },
      { pos: [-0.8, 2.2, -1], target: [0.6, 0.6, -3], drift: [0, -0.5, 0], fov: 52 },
    ],
  },
  basement: {
    kind: "basement",
    fog: "#060809",
    fogNear: 1.5,
    fogFar: 14,
    wall: "#171a1b",
    floor: "#0f1112",
    accent: "#ffb057",
    ambient: 0.14,
    shots: [
      { pos: [0, 1.5, 5], target: [0, 1.3, -5], drift: [0, 0, -2], handheld: 1.1 },
      { pos: [-1.6, 1.2, 1], target: [1.8, 1.4, -4], drift: [0.5, 0, -1], handheld: 1.3 },
      { pos: [1.2, 2, -2], target: [-1, 0.8, -5], drift: [-0.4, -0.3, -0.8], fov: 50 },
    ],
  },
  rooftop: {
    kind: "rooftop",
    fog: "#0a0f18",
    fogNear: 8,
    fogFar: 70,
    wall: "#1a1f28",
    floor: "#15181d",
    accent: "#7fa8ff",
    ambient: 0.4,
    vista: "rooftop",
    rain: true,
    shots: [
      { pos: [0, 2, 9], target: [0, 2.4, -12], drift: [0, 0.2, -3], fov: 52, handheld: 0.8 },
      { pos: [-5, 1.8, 2], target: [5, 2.2, -10], drift: [1.6, 0, -1], fov: 46 },
      { pos: [2, 4.5, 4], target: [-1, 1, -8], drift: [-0.8, -0.6, -1], fov: 58 },
    ],
  },
  drive: {
    kind: "drive",
    fog: "#070a10",
    fogNear: 4,
    fogFar: 42,
    wall: "#141821",
    floor: "#101318",
    accent: "#ffd27f",
    ambient: 0.25,
    vista: "drive",
    rain: true,
    shots: [
      { pos: [0, 1.25, 2], target: [0, 1.2, -20], drift: [0, 0, -1], fov: 60, handheld: 1.2 },
      { pos: [-1.4, 1.4, 0], target: [1.2, 1.2, -18], drift: [0.4, 0, 0], fov: 48, handheld: 1 },
      { pos: [1.2, 1.1, -1], target: [-1.4, 1.4, -16], drift: [-0.3, 0, 0], fov: 52, handheld: 1.4 },
    ],
  },
};

export function getWorld(bg: string): WorldDef {
  return worlds[bg] ?? worlds["room310"]!;
}
