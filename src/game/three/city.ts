/**
 * مدينة حقيقية ثلاثية الأبعاد — بلا أي صورة مسطّحة على الجدران.
 * يولّد تكسترات واجهات (Facade) قابلة للتبليط: خرسانة + بلاطات طوابق
 * + نوافذ مضاءة (خريطة انبعاث) + خشونة + نتوءات، ثم يُبنى منها
 * مبنى صندوقي بستّ مواد — لكل اتجاه تكستر خاص وتكرار مطابق لأبعاده
 * حتى تتشابك الطوابق والنوافذ حول المبنى بلا انكسار.
 */
import * as THREE from "three";

export type FacadeStyle = "office" | "residential" | "old";

type FacadeMaps = {
  map: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
};

/** وحدة الواجهة بالأمتار — طابق واحد × فتحة واحدة */
export const MODULE_W = 3.2;
export const MODULE_H = 3.4;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cv(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function tex(c: HTMLCanvasElement, srgb: boolean) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

const cache = new Map<string, FacadeMaps>();

/** تكستر واجهة واحدة (طابق × فتحة) — تتكرر أفقياً ورأسياً بلا حدود مرئية */
function buildFacade(style: FacadeStyle, seed: number): FacadeMaps {
  const S = 256;
  const rnd = rng(seed);
  const base = cv(S, S);
  const emi = cv(S, S);
  const rgh = cv(S, S);
  const hgt = cv(S, S);
  const b = base.getContext("2d")!;
  const e = emi.getContext("2d")!;
  const r = rgh.getContext("2d")!;
  const hh = hgt.getContext("2d")!;

  const wall =
    style === "office" ? "#4a5158" : style === "residential" ? "#5c5449" : "#4b423a";
  const wallDark =
    style === "office" ? "#2f363c" : style === "residential" ? "#3a352e" : "#332c26";

  // جسم الجدار + تحبيب خرساني
  b.fillStyle = wall;
  b.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const v = rnd();
    b.fillStyle = `rgba(${v > 0.5 ? "255,255,255" : "0,0,0"},${0.02 + rnd() * 0.05})`;
    b.fillRect(x, y, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  // بقع رطوبة/تعتيق
  for (let i = 0; i < 14; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const g = b.createRadialGradient(x, y, 1, x, y, 20 + rnd() * 50);
    g.addColorStop(0, `rgba(0,0,0,${style === "old" ? 0.3 : 0.16})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    b.fillStyle = g;
    b.fillRect(x - 70, y - 70, 140, 140);
  }

  r.fillStyle = "#b4b4b4";
  r.fillRect(0, 0, S, S);
  hh.fillStyle = "#808080";
  hh.fillRect(0, 0, S, S);
  e.fillStyle = "#000000";
  e.fillRect(0, 0, S, S);

  // البلاطة تُرسم داخل كل خلية حتى تبقى الشبكة مستمرة رأسياً
  const GRID = 3; // 3×3 وحدات في التكستر — كل نافذة بحالة إضاءة مختلفة
  const CS = S / GRID;
  const slab = Math.round(CS * 0.14);
  const mull = Math.round(CS * 0.09);

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const ox = gx * CS;
      const oy = gy * CS;

      // بلاطة الطابق
      b.fillStyle = wallDark;
      b.fillRect(ox, oy + CS - slab, CS, slab);
      b.fillStyle = "rgba(255,255,255,0.06)";
      b.fillRect(ox, oy + CS - slab, CS, 2);
      hh.fillStyle = "#c8c8c8";
      hh.fillRect(ox, oy + CS - slab, CS, slab);
      r.fillStyle = "#cccccc";
      r.fillRect(ox, oy + CS - slab, CS, slab);

      // عمود عمودي
      b.fillStyle = wallDark;
      b.fillRect(ox + CS - mull, oy, mull, CS);
      hh.fillStyle = "#bbbbbb";
      hh.fillRect(ox + CS - mull, oy, mull, CS);

      // فتحة النافذة
      const wx = ox + Math.round(CS * 0.1);
      const wy = oy + Math.round(CS * 0.12);
      const ww = CS - mull - Math.round(CS * 0.1) * 2;
      const wh = CS - slab - Math.round(CS * 0.12) - Math.round(CS * 0.1);

      b.fillStyle = "rgba(0,0,0,0.35)";
      b.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);

      const lit = rnd() > (style === "office" ? 0.42 : 0.55);
      const warm = rnd() > 0.5;
      b.fillStyle = lit ? (warm ? "#f0c283" : "#9dc6ee") : "#12181f";
      b.fillRect(wx, wy, ww, wh);

      const gg = b.createLinearGradient(0, wy, 0, wy + wh);
      gg.addColorStop(0, "rgba(255,255,255,0.18)");
      gg.addColorStop(0.5, "rgba(0,0,0,0.12)");
      gg.addColorStop(1, "rgba(0,0,0,0.42)");
      b.fillStyle = gg;
      b.fillRect(wx, wy, ww, wh);

      if (lit) {
        e.fillStyle = warm ? "#c98f45" : "#5c86b8";
        e.fillRect(wx, wy, ww, wh);
        // ستارة تقطع الانبعاث بنِسب مختلفة لكل نافذة
        e.fillStyle = "rgba(0,0,0,0.6)";
        e.fillRect(wx, wy, ww, Math.round(wh * (0.1 + rnd() * 0.5)));
        if (rnd() > 0.6) {
          e.fillRect(wx, wy, Math.round(ww * (0.2 + rnd() * 0.4)), wh);
        }
      }

      r.fillStyle = "#3a3a3a";
      r.fillRect(wx, wy, ww, wh);
      hh.fillStyle = "#4a4a4a";
      hh.fillRect(wx, wy, ww, wh);

      b.strokeStyle = "#20262c";
      b.lineWidth = 2;
      b.strokeRect(wx, wy, ww, wh);
      b.beginPath();
      b.moveTo(wx + ww / 2, wy);
      b.lineTo(wx + ww / 2, wy + wh);
      b.stroke();
    }
  }


  // خريطة نتوءات من الارتفاع
  const src = hh.getImageData(0, 0, S, S);
  const nrm = cv(S, S);
  const nctx = nrm.getContext("2d")!;
  const out = nctx.createImageData(S, S);
  const at = (x: number, y: number) =>
    (src.data[(((y + S) % S) * S + ((x + S) % S)) * 4] ?? 128) / 255;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 3;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 3;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * S + x) * 4;
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = (1 / len) * 255;
      out.data[i + 3] = 255;
    }
  }
  nctx.putImageData(out, 0, 0);

  return {
    map: tex(base, true),
    emissiveMap: tex(emi, true),
    roughnessMap: tex(rgh, false),
    normalMap: tex(nrm, false),
  };
}

function facade(style: FacadeStyle, seed: number): FacadeMaps {
  const key = `${style}-${seed}`;
  let m = cache.get(key);
  if (!m) {
    m = buildFacade(style, seed);
    cache.set(key, m);
  }
  return m;
}

function clone(t: THREE.CanvasTexture, rx: number, ry: number, ox = 0, oy = 0) {
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(rx, ry);
  c.offset.set(ox, oy);
  c.needsUpdate = true;
  return c;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();

function faceMaterial(
  m: FacadeMaps,
  key: string,
  rx: number,
  ry: number,
  ox: number,
  oy: number,
  emissive: string,
) {
  const ck = `${key}|${rx}|${ry}|${ox}|${oy}|${emissive}`;
  let mat = matCache.get(ck);
  if (mat) return mat;
  mat = new THREE.MeshStandardMaterial({
    map: clone(m.map, rx, ry, ox, oy),
    emissiveMap: clone(m.emissiveMap, rx, ry, ox, oy),
    emissive: new THREE.Color(emissive),
    emissiveIntensity: 1.15,
    roughnessMap: clone(m.roughnessMap, rx, ry, ox, oy),
    normalMap: clone(m.normalMap, rx, ry, ox, oy),
    normalScale: new THREE.Vector2(1, 1),
    roughness: 0.78,
    metalness: 0.06,
  });
  matCache.set(ck, mat);
  return mat;
}


const roofCache = new Map<FacadeStyle, THREE.MeshStandardMaterial>();

function roofMaterial(style: FacadeStyle): THREE.MeshStandardMaterial {
  let m = roofCache.get(style);
  if (m) return m;
  const S = 128;
  const c = cv(S, S);
  const ctx = c.getContext("2d")!;
  const rnd = rng(style.length * 31 + 7);
  ctx.fillStyle = "#26292c";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 6000; i++) {
    const v = rnd();
    ctx.fillStyle = `rgba(${v > 0.5 ? "190,190,185" : "10,10,12"},${0.05 + rnd() * 0.2})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  m = new THREE.MeshStandardMaterial({
    map: tex(c, true),
    roughness: 0.95,
    metalness: 0.02,
  });
  roofCache.set(style, m);
  return m;
}

/**
 * مواد المبنى الستّ بترتيب BoxGeometry: +X, -X, +Y, -Y, +Z, -Z.
 * لكل جهة تكرار يطابق أبعادها الحقيقية فتُكمل الطوابق حول المبنى.
 */
export function buildingMaterials(
  width: number,
  height: number,
  depth: number,
  style: FacadeStyle,
  seed: number,
  emissive = "#ffb35c",
): THREE.Material[] {
  const m = facade(style, seed);
  const key = `${style}-${seed}`;
  const ry = Math.max(1, Math.round(height / MODULE_H));
  const rxSide = Math.max(1, Math.round(depth / MODULE_W));
  const rxFront = Math.max(1, Math.round(width / MODULE_W));
  const roof = roofMaterial(style);
  return [
    faceMaterial(m, key, rxSide, ry, 0, 0, emissive),
    faceMaterial(m, key, rxSide, ry, 0.5, 0, emissive),
    roof,
    roof,
    faceMaterial(m, key, rxFront, ry, 0.25, 0, emissive),
    faceMaterial(m, key, rxFront, ry, 0.75, 0, emissive),
  ];

}

/** خرسانة رصيف/شارع بسيطة بتفاصيل */
export function pavementMaterial(tint = "#3a3d42"): THREE.MeshStandardMaterial {
  const S = 256;
  const c = cv(S, S);
  const ctx = c.getContext("2d")!;
  const rnd = rng(913);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 12000; i++) {
    const v = rnd();
    ctx.fillStyle = `rgba(${v > 0.5 ? "255,255,255" : "0,0,0"},${0.02 + rnd() * 0.07})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo((i * S) / 4, 0);
    ctx.lineTo((i * S) / 4, S);
    ctx.moveTo(0, (i * S) / 4);
    ctx.lineTo(S, (i * S) / 4);
    ctx.stroke();
  }
  return new THREE.MeshStandardMaterial({ map: tex(c, true), roughness: 0.9 });
}
