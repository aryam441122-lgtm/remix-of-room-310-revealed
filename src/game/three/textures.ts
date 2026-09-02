/**
 * تكسترات إجرائية (Canvas) لكل أسطح اللعبة — بلا صور خارجية.
 * كل نوع يُنتج: خريطة لون + خريطة خشونة + خريطة نتوءات (normal)
 * وتُخزَّن مؤقتاً حتى لا تُبنى أكثر من مرة.
 */
import * as THREE from "three";

export type TexKind =
  | "plaster"
  | "wallpaper"
  | "carpet"
  | "wood"
  | "darkwood"
  | "concrete"
  | "marble"
  | "fabric"
  | "linen"
  | "metal"
  | "rustmetal"
  | "tile"
  | "asphalt"
  | "skin"
  | "cloth"
  | "hair"
  | "leather";

type Maps = {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughness: number;
  metalness: number;
};

const cache = new Map<string, Maps>();

/* ------------------------- أدوات ضجيج ------------------------- */

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function valueNoise(size: number, cells: number, rnd: () => number) {
  const g: number[] = [];
  for (let i = 0; i < (cells + 1) * (cells + 1); i++) g.push(rnd());
  const at = (x: number, y: number) => g[(y % (cells + 1)) * (cells + 1) + (x % (cells + 1))] ?? 0;
  const sm = (t: number) => t * t * (3 - 2 * t);
  return (px: number, py: number) => {
    const fx = (px / size) * cells;
    const fy = (py / size) * cells;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = sm(fx - x0);
    const ty = sm(fy - y0);
    const a = at(x0, y0);
    const b = at(x0 + 1, y0);
    const c = at(x0, y0 + 1);
    const d = at(x0 + 1, y0 + 1);
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  };
}

function fbm(size: number, seed: number, octaves = 4, base = 4) {
  const layers = Array.from({ length: octaves }).map((_, i) =>
    valueNoise(size, base * 2 ** i, mulberry(seed + i * 7919)),
  );
  return (x: number, y: number) => {
    let v = 0;
    let amp = 0.5;
    let sum = 0;
    for (const l of layers) {
      v += l(x, y) * amp;
      sum += amp;
      amp *= 0.5;
    }
    return v / sum;
  };
}

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return c;
}

function heightToNormal(height: Float32Array, size: number, strength: number) {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const h = (x: number, y: number) =>
    height[((y + size) % size) * size + ((x + size) % size)] ?? 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len) * 0.5 * 255 + 127;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as [
    number,
    number,
    number,
  ];
}

/* ------------------------- مُولِّد ------------------------- */

type Recipe = {
  size: number;
  /** لونان أساسيان */
  a: [number, number, number];
  b: [number, number, number];
  roughA: number;
  roughB: number;
  metalness: number;
  normalStrength: number;
  /** رسم إضافي (خطوط خشب، فواصل بلاط…) */
  pattern?: (
    x: number,
    y: number,
    size: number,
    n: (x: number, y: number) => number,
  ) => { t?: number; h?: number; dark?: number } | undefined;
  seed: number;
};

const recipes: Record<TexKind, Recipe> = {
  plaster: {
    size: 256,
    a: [214, 208, 196],
    b: [176, 168, 154],
    roughA: 0.82,
    roughB: 0.96,
    metalness: 0,
    normalStrength: 3.2,
    seed: 11,
  },
  wallpaper: {
    size: 256,
    a: [206, 194, 172],
    b: [162, 148, 126],
    roughA: 0.7,
    roughB: 0.88,
    metalness: 0,
    normalStrength: 2.4,
    seed: 23,
    pattern: (x, y, size) => {
      const stripe = Math.sin((x / size) * Math.PI * 26) * 0.5 + 0.5;
      return { t: stripe * 0.35, h: stripe * 0.25 };
    },
  },
  carpet: {
    size: 256,
    a: [96, 62, 52],
    b: [58, 36, 32],
    roughA: 0.96,
    roughB: 1,
    metalness: 0,
    normalStrength: 5,
    seed: 37,
    pattern: (x, y, size, n) => {
      const fleck = n(x * 3.1, y * 3.1);
      const diamond =
        Math.abs(Math.sin((x / size) * Math.PI * 8) + Math.sin((y / size) * Math.PI * 8)) * 0.3;
      return { t: fleck * 0.6 + diamond, h: fleck };
    },
  },
  wood: {
    size: 256,
    a: [150, 104, 62],
    b: [92, 58, 32],
    roughA: 0.42,
    roughB: 0.68,
    metalness: 0.04,
    normalStrength: 2.6,
    seed: 53,
    pattern: (x, y, size, n) => {
      const rings = Math.abs(
        Math.sin((y / size) * Math.PI * 9 + n(x, y) * 9 + n(x * 0.4, y * 0.4) * 5),
      );
      return { t: rings, h: rings * 0.8 };
    },
  },
  darkwood: {
    size: 256,
    a: [76, 50, 34],
    b: [38, 24, 16],
    roughA: 0.38,
    roughB: 0.6,
    metalness: 0.06,
    normalStrength: 2.4,
    seed: 59,
    pattern: (x, y, size, n) => {
      const rings = Math.abs(Math.sin((y / size) * Math.PI * 11 + n(x, y) * 10));
      return { t: rings, h: rings * 0.7 };
    },
  },
  concrete: {
    size: 256,
    a: [136, 136, 132],
    b: [86, 86, 84],
    roughA: 0.88,
    roughB: 1,
    metalness: 0,
    normalStrength: 4.4,
    seed: 71,
    pattern: (x, y, _s, n) => {
      const pit = n(x * 5, y * 5) > 0.78 ? 1 : 0;
      return { t: pit * 0.5, h: -pit * 0.7, dark: pit * 0.25 };
    },
  },
  marble: {
    size: 512,
    a: [222, 216, 206],
    b: [104, 100, 98],
    roughA: 0.12,
    roughB: 0.3,
    metalness: 0.25,
    normalStrength: 1.2,
    seed: 83,
    pattern: (x, y, size, n) => {
      const vein = Math.pow(
        Math.abs(Math.sin((x + y) * 0.02 + n(x, y) * 7 + n(x * 2, y * 2) * 3)),
        7,
      );
      const tileLine =
        (x % (size / 2) < 2 || y % (size / 2) < 2) ? 1 : 0;
      return { t: vein * 0.85 + tileLine, h: vein * 0.2 - tileLine * 0.8 };
    },
  },
  fabric: {
    size: 256,
    a: [92, 96, 108],
    b: [50, 54, 64],
    roughA: 0.9,
    roughB: 1,
    metalness: 0,
    normalStrength: 4,
    seed: 97,
    pattern: (x, y) => {
      const weave =
        (Math.sin(x * 1.6) * 0.5 + 0.5) * (Math.sin(y * 1.6) * 0.5 + 0.5);
      return { t: weave * 0.5, h: weave };
    },
  },
  linen: {
    size: 256,
    a: [232, 228, 216],
    b: [190, 184, 170],
    roughA: 0.9,
    roughB: 1,
    metalness: 0,
    normalStrength: 3,
    seed: 101,
    pattern: (x, y) => {
      const weave = (Math.sin(x * 2.1) * 0.5 + 0.5) * (Math.sin(y * 2.1) * 0.5 + 0.5);
      return { t: weave * 0.35, h: weave * 0.8 };
    },
  },
  metal: {
    size: 256,
    a: [172, 178, 188],
    b: [96, 102, 112],
    roughA: 0.18,
    roughB: 0.4,
    metalness: 0.9,
    normalStrength: 1.6,
    seed: 113,
    pattern: (x, y, _s, n) => {
      const brush = n(x * 0.15, y * 6);
      return { t: brush, h: brush * 0.5 };
    },
  },
  rustmetal: {
    size: 256,
    a: [120, 88, 62],
    b: [58, 46, 40],
    roughA: 0.55,
    roughB: 0.95,
    metalness: 0.55,
    normalStrength: 4,
    seed: 127,
    pattern: (x, y, _s, n) => {
      const rust = n(x * 2.4, y * 2.4);
      return { t: rust, h: rust * 0.9, dark: rust > 0.7 ? 0.2 : 0 };
    },
  },
  tile: {
    size: 256,
    a: [178, 180, 178],
    b: [120, 122, 122],
    roughA: 0.24,
    roughB: 0.5,
    metalness: 0.1,
    normalStrength: 3.6,
    seed: 131,
    pattern: (x, y, size) => {
      const g = 64;
      const line = x % g < 3 || y % g < 3 ? 1 : 0;
      void size;
      return { t: line, h: -line, dark: line * 0.35 };
    },
  },
  asphalt: {
    size: 256,
    a: [72, 74, 80],
    b: [34, 36, 40],
    roughA: 0.5,
    roughB: 0.85,
    metalness: 0.2,
    normalStrength: 4.8,
    seed: 137,
    pattern: (x, y, _s, n) => {
      const grit = n(x * 6, y * 6);
      return { t: grit, h: grit };
    },
  },
  skin: {
    size: 256,
    a: [226, 186, 158],
    b: [190, 146, 118],
    roughA: 0.52,
    roughB: 0.72,
    metalness: 0,
    normalStrength: 1.6,
    seed: 149,
    pattern: (x, y, _s, n) => {
      const pores = n(x * 8, y * 8);
      return { t: pores * 0.5, h: pores * 0.4 };
    },
  },
  cloth: {
    size: 256,
    a: [70, 76, 88],
    b: [34, 38, 46],
    roughA: 0.78,
    roughB: 0.95,
    metalness: 0,
    normalStrength: 3.2,
    seed: 151,
    pattern: (x, y, _s, n) => {
      const weave = (Math.sin(x * 1.9) * 0.5 + 0.5) * (Math.sin(y * 1.9) * 0.5 + 0.5);
      const wrinkle = n(x * 0.7, y * 0.7);
      return { t: weave * 0.4 + wrinkle * 0.4, h: weave * 0.6 + wrinkle };
    },
  },
  hair: {
    size: 256,
    a: [64, 48, 38],
    b: [22, 16, 14],
    roughA: 0.34,
    roughB: 0.6,
    metalness: 0.1,
    normalStrength: 3.4,
    seed: 157,
    pattern: (x, y, _s, n) => {
      const strand = Math.abs(Math.sin(x * 0.9 + n(x * 0.2, y * 0.2) * 6));
      return { t: strand, h: strand };
    },
  },
  leather: {
    size: 256,
    a: [78, 58, 46],
    b: [38, 28, 22],
    roughA: 0.45,
    roughB: 0.7,
    metalness: 0.05,
    normalStrength: 3.8,
    seed: 163,
    pattern: (x, y, _s, n) => {
      const cell = n(x * 4.5, y * 4.5);
      return { t: cell, h: cell > 0.55 ? cell : -cell * 0.5 };
    },
  },
};

function build(kind: TexKind): Maps {
  const r = recipes[kind];
  const size = r.size;
  const n = fbm(size, r.seed, 4, 4);
  const nFine = fbm(size, r.seed + 999, 3, 16);

  const colC = canvas(size);
  const roughC = canvas(size);
  const cctx = colC.getContext("2d")!;
  const rctx = roughC.getContext("2d")!;
  const cimg = cctx.createImageData(size, size);
  const rimg = rctx.createImageData(size, size);
  const height = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let t = n(x, y) * 0.7 + nFine(x, y) * 0.3;
      let h = t;
      let dark = 0;
      const p = r.pattern?.(x, y, size, nFine);
      if (p) {
        if (p.t !== undefined) t = Math.min(1, Math.max(0, t * 0.55 + p.t * 0.55));
        if (p.h !== undefined) h = h * 0.5 + p.h * 0.6;
        dark = p.dark ?? 0;
      }
      const c = mix(r.a, r.b, Math.min(1, Math.max(0, t)));
      const i = (y * size + x) * 4;
      cimg.data[i] = c[0] * (1 - dark);
      cimg.data[i + 1] = c[1] * (1 - dark);
      cimg.data[i + 2] = c[2] * (1 - dark);
      cimg.data[i + 3] = 255;
      const rough = (r.roughA + (r.roughB - r.roughA) * t) * 255;
      rimg.data[i] = rough;
      rimg.data[i + 1] = rough;
      rimg.data[i + 2] = rough;
      rimg.data[i + 3] = 255;
      height[y * size + x] = h;
    }
  }
  cctx.putImageData(cimg, 0, 0);
  rctx.putImageData(rimg, 0, 0);

  const normC = heightToNormal(height, size, r.normalStrength);

  const mk = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };

  return {
    map: mk(colC, true),
    roughnessMap: mk(roughC, false),
    normalMap: mk(normC, false),
    roughness: (r.roughA + r.roughB) / 2,
    metalness: r.metalness,
  };
}

export function getTexture(kind: TexKind): Maps {
  let m = cache.get(kind);
  if (!m) {
    m = build(kind);
    cache.set(kind, m);
  }
  return m;
}

export type SurfaceOpts = {
  /** تكرار التكستر */
  repeat?: [number, number];
  /** لون تلوين فوق التكستر (يمزج جو المكان) */
  tint?: string;
  roughness?: number;
  metalness?: number;
};

/**
 * خصائص جاهزة تُنشر على <meshStandardMaterial> لأي سطح.
 * التكرار يُنسخ لكل استخدام حتى لا تتعارض الأسطح.
 */
export function surface(kind: TexKind, opts: SurfaceOpts = {}) {
  const base = getTexture(kind);
  const [rx, ry] = opts.repeat ?? [1, 1];
  const clone = (t: THREE.CanvasTexture) => {
    const c = t.clone();
    c.wrapS = c.wrapT = THREE.RepeatWrapping;
    c.repeat.set(rx, ry);
    c.needsUpdate = true;
    return c;
  };
  return {
    map: clone(base.map),
    roughnessMap: clone(base.roughnessMap),
    normalMap: clone(base.normalMap),
    normalScale: new THREE.Vector2(0.9, 0.9),
    color: new THREE.Color(opts.tint ?? "#ffffff"),
    roughness: opts.roughness ?? base.roughness,
    metalness: opts.metalness ?? base.metalness,
  };
}

/** لوح نافذة/أفق مدينة إجرائي — بدل الصور المسطّحة على الجدران */
export function cityNightTexture(seed = 7, w = 512, h = 256): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const rnd = mulberry(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#050a12");
  sky.addColorStop(0.55, "#0d1826");
  sky.addColorStop(1, "#131f2c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // ضوء المدينة المنعكس على السحاب
  const glow = ctx.createRadialGradient(w * 0.6, h * 0.72, 10, w * 0.6, h * 0.72, h * 0.9);
  glow.addColorStop(0, "rgba(120,160,210,0.22)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // أبراج
  for (let layer = 0; layer < 3; layer++) {
    const baseY = h * (0.62 + layer * 0.1);
    const shade = ["#0a1119", "#070d14", "#04080d"][layer]!;
    let x = -20;
    while (x < w + 20) {
      const bw = 14 + rnd() * 46;
      const bh = (24 + rnd() * 92) * (1 - layer * 0.18);
      ctx.fillStyle = shade;
      ctx.fillRect(x, baseY - bh, bw, bh + h);
      // نوافذ
      const lit = 0.5 - layer * 0.12;
      for (let wy = baseY - bh + 5; wy < baseY - 4; wy += 7) {
        for (let wx = x + 3; wx < x + bw - 4; wx += 6) {
          if (rnd() > lit) continue;
          ctx.fillStyle = rnd() > 0.75 ? "rgba(255,206,140,0.85)" : "rgba(150,190,235,0.7)";
          ctx.fillRect(wx, wy, 2.5, 3.2);
        }
      }
      x += bw + 3 + rnd() * 8;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
