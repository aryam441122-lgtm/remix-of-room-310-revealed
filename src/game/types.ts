export type CharacterId =
  | "daniel"
  | "claire"
  | "victor"
  | "maya"
  | "elias"
  | "noah"
  | "receptionist"
  | "unknown"
  | "narrator"
  | "system";

export type TrustKey = "claire" | "maya" | "noah" | "victor";

export type StoryFlags = {
  ignoredCall: boolean;
  calledHotel: boolean;
  calledPolice: boolean;
  wentImmediately: boolean;
  foundHiddenCamera: boolean;
  answeredSender: "who" | "claire" | "come" | "none";
  sawClaireInHallway: boolean;
  enteredSecurityRoom: boolean;
  sawArchiveFootage: boolean;
  liedToMaya: boolean;
  discoveredOrpheus: boolean;
  discoveredArchive: boolean;
  discoveredRoom310B: boolean;
  discoveredCircle: boolean;
  playerMemoryRecovered: boolean;
  foundEliasRecorder: boolean;
  foundEliasFinalVideo: boolean;
  knowsCircleLeader: boolean;
  stoleNoahKey: boolean;
  victorGaveKey: boolean;
  foundClaireKey: boolean;
  destroyedEvidence: boolean;
  refusedEveryDeal: boolean;
  acceptedVictorDeal: boolean;
  noahConfessed: boolean;
  trustedAt23: "claire" | "maya" | "noah" | "victor" | "none";
  finalChoice:
    | "public"
    | "federal"
    | "destroy"
    | "blackmail"
    | "claire"
    | "maya"
    | "elias"
    | "none";
  loopCount: number;
};

export type Alive = {
  claire: boolean;
  maya: boolean;
  noah: boolean;
  elias: boolean;
  victor: boolean;
};

export type StoryState = {
  trust: Record<TrustKey, number>;
  alive: Alive;
  flags: StoryFlags;
  evidence: string[];
  secrets: string[];
};

export type Effect = {
  trust?: Partial<Record<TrustKey, number>>;
  set?: Partial<StoryFlags>;
  kill?: (keyof Alive)[];
  revive?: (keyof Alive)[];
  evidence?: string[];
  secrets?: string[];
};

export type Condition = (s: StoryState) => boolean;

export type Line = {
  who: CharacterId;
  text: string;
  /** ملاحظة مسرحية تظهر بخط مائل باهت */
  stage?: boolean;
  shake?: boolean;
  requires?: Condition;
};

export type Choice = {
  id: string;
  text: string;
  hint?: string;
  effect?: Effect;
  goto?: string;
  requires?: Condition;
};

export type Inspectable = {
  id: string;
  label: string;
  /** موضع النقطة داخل المشهد بالنسبة المئوية */
  x: number;
  y: number;
  lines: Line[];
  effect?: Effect;
};

export type SceneKind = "scene" | "ending";

export type Scene = {
  id: string;
  kind?: SceneKind;
  chapter: string;
  title: string;
  time?: string;
  place: string;
  bg: string;
  mood?: "rain" | "red" | "cold" | "warm" | "dark";
  lines: Line[];
  inspect?: Inspectable[];
  /** أقل عدد نقاط يجب فحصها قبل إتاحة المتابعة */
  minInspect?: number;
  inspectPrompt?: string;
  /** سطور تُقال بعد انتهاء مرحلة الفحص */
  afterInspect?: Line[];
  choices?: Choice[];
  choicePrompt?: string;
  next?: string | ((s: StoryState) => string);
  onEnter?: Effect;
  endingTitle?: string;
  endingCode?: string;
};
