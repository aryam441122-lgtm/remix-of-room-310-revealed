import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Effect, StoryState } from "./types";

export const TOTAL_EVIDENCE = 25;
export const TOTAL_SECRETS = 12;

export const initialStory: StoryState = {
  trust: { claire: 10, maya: 10, noah: 0, victor: 0 },
  alive: { claire: true, maya: true, noah: true, elias: true, victor: true },
  flags: {
    ignoredCall: false,
    calledHotel: false,
    calledPolice: false,
    wentImmediately: false,
    foundHiddenCamera: false,
    answeredSender: "none",
    sawClaireInHallway: false,
    enteredSecurityRoom: false,
    sawArchiveFootage: false,
    liedToMaya: false,
    discoveredOrpheus: false,
    discoveredArchive: false,
    discoveredRoom310B: false,
    discoveredCircle: false,
    playerMemoryRecovered: false,
    foundEliasRecorder: false,
    foundEliasFinalVideo: false,
    knowsCircleLeader: false,
    stoleNoahKey: false,
    victorGaveKey: false,
    foundClaireKey: false,
    destroyedEvidence: false,
    refusedEveryDeal: true,
    acceptedVictorDeal: false,
    noahConfessed: false,
    trustedAt23: "none",
    finalChoice: "none",
    loopCount: 0,
  },
  evidence: [],
  secrets: [],
};

export type Phase = "title" | "menu" | "scene" | "casefile";

type GameStore = {
  phase: Phase;
  sceneId: string;
  story: StoryState;
  inspected: string[];
  visited: string[];
  /** أرشيف عبر مرات اللعب */
  endingsFound: string[];
  runs: number;
  loopVariant: number;

  begin: () => void;
  openMenu: () => void;
  openCaseFile: () => void;
  closeCaseFile: () => void;
  goTo: (sceneId: string) => void;
  apply: (e?: Effect) => void;
  markInspected: (id: string) => void;
  recordEnding: (code: string) => void;
  restartLoop: () => void;
  hardReset: () => void;
};

function applyEffect(story: StoryState, e: Effect): StoryState {
  const next: StoryState = {
    trust: { ...story.trust },
    alive: { ...story.alive },
    flags: { ...story.flags },
    evidence: [...story.evidence],
    secrets: [...story.secrets],
  };
  if (e.trust) {
    for (const k of Object.keys(e.trust) as (keyof typeof next.trust)[]) {
      next.trust[k] = Math.max(-100, Math.min(100, next.trust[k] + (e.trust[k] ?? 0)));
    }
  }
  if (e.set) next.flags = { ...next.flags, ...e.set };
  if (e.kill) for (const k of e.kill) next.alive[k] = false;
  if (e.revive) for (const k of e.revive) next.alive[k] = true;
  if (e.evidence)
    for (const id of e.evidence) if (!next.evidence.includes(id)) next.evidence.push(id);
  if (e.secrets) for (const id of e.secrets) if (!next.secrets.includes(id)) next.secrets.push(id);
  return next;
}

export const useGame = create<GameStore>()(
  persist(
    (set) => ({
      phase: "title",
      sceneId: "s01",
      story: initialStory,
      inspected: [],
      visited: [],
      endingsFound: [],
      runs: 0,
      loopVariant: 0,

      begin: () =>
        set((s) => ({
          phase: "scene",
          sceneId: "s01",
          story: { ...initialStory, flags: { ...initialStory.flags, loopCount: s.loopVariant } },
          inspected: [],
          visited: ["s01"],
          runs: s.runs + 1,
        })),
      openMenu: () => set({ phase: "menu" }),
      openCaseFile: () => set({ phase: "casefile" }),
      closeCaseFile: () => set({ phase: "scene" }),
      goTo: (sceneId) =>
        set((s) => ({
          phase: "scene",
          sceneId,
          visited: s.visited.includes(sceneId) ? s.visited : [...s.visited, sceneId],
        })),
      apply: (e) => set((s) => (e ? { story: applyEffect(s.story, e) } : {})),
      markInspected: (id) =>
        set((s) => (s.inspected.includes(id) ? {} : { inspected: [...s.inspected, id] })),
      recordEnding: (code) =>
        set((s) => ({
          endingsFound: s.endingsFound.includes(code) ? s.endingsFound : [...s.endingsFound, code],
        })),
      restartLoop: () =>
        set((s) => ({
          phase: "scene",
          sceneId: "s01",
          loopVariant: s.loopVariant + 1,
          story: {
            ...initialStory,
            flags: { ...initialStory.flags, loopCount: s.loopVariant + 1 },
          },
          inspected: [],
          visited: ["s01"],
        })),
      hardReset: () =>
        set({
          phase: "title",
          sceneId: "s01",
          story: initialStory,
          inspected: [],
          visited: [],
        }),
    }),
    {
      name: "room310-save-v1",
      partialize: (s) => ({
        phase: s.phase,
        sceneId: s.sceneId,
        story: s.story,
        inspected: s.inspected,
        visited: s.visited,
        endingsFound: s.endingsFound,
        runs: s.runs,
        loopVariant: s.loopVariant,
      }),
    },
  ),
);
