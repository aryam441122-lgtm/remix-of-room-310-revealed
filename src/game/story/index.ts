import type { Scene } from "../types";
import { act1 } from "./act1";
import { act2 } from "./act2";
import { act3 } from "./act3";
import { act4 } from "./act4";
import { act5 } from "./act5";
import { act6 } from "./act6";
import { act7 } from "./act7";
import { act8 } from "./act8";
import { endings } from "./endings";

export const allScenes: Scene[] = [
  ...act1,
  ...act2,
  ...act3,
  ...act4,
  ...act5,
  ...act6,
  ...act7,
  ...act8,
  ...endings,
];

const index = new Map(allScenes.map((s) => [s.id, s]));

export function getScene(id: string): Scene {
  const scene = index.get(id);
  if (!scene) throw new Error(`مشهد غير موجود: ${id}`);
  return scene;
}

export const totalEndings = endings.length;
export const endingList = endings.map((e) => ({
  code: e.endingCode!,
  title: e.endingTitle!,
}));
