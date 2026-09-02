import type { Scene } from "../types";
import { resolveEnding } from "./resolve";

export const act8: Scene[] = [
  {
    id: "s31",
    chapter: "الفصل الثامن — الليلة الأخيرة",
    title: "السطح",
    time: "9:31 ص",
    place: "سطح فندق هالسيون",
    bg: "rooftop",
    mood: "rain",
    lines: [
      { who: "narrator", text: "مطر. مروحيات بعيدة. المدينة تحت الضباب.", stage: true },
      { who: "claire", text: "لا مكان بعد هذا السطح.", requires: (s) => s.alive.claire },
      { who: "maya", text: "لديّ نسخة. إن مات أحدنا، تُنشر تلقائياً.", requires: (s) => s.alive.maya },
      { who: "noah", text: "خلفكم باب واحد. وأنا أحرسه.", requires: (s) => s.alive.noah },
      { who: "victor", text: "أربعة أطراف. وحقيقة واحدة." },
      { who: "daniel", text: "قُلها." },
      { who: "victor", text: "إيلاياس فيل حيّ." },
      { who: "victor", text: "احتُفظ به لأنه الشخص الوحيد الذي يعرف الدائرة كاملة." },
    ],
    onEnter: { secrets: ["elias_alive", "circle"] },
    next: "s32",
  },
  {
    id: "s32",
    chapter: "الفصل الثامن — الليلة الأخيرة",
    title: "إيلاياس",
    time: "9:44 ص",
    place: "سطح فندق هالسيون",
    bg: "rooftop",
    mood: "rain",
    lines: [
      { who: "narrator", text: "باب معدني يُفتح. رجل يخرج تحت المطر.", stage: true, shake: true },
      { who: "narrator", text: "أكبر. أنحل. أثر حرق على العنق. حيّ.", stage: true },
      { who: "narrator", text: "دانيال لا يستطيع الكلام.", stage: true },
      { who: "elias", text: "تأخرت." },
      { who: "daniel", text: "أنت حيّ." },
      { who: "elias", text: "ليس لوقت طويل." },
      { who: "narrator", text: "يمد يده. قرص صلب واحد.", stage: true },
      { who: "elias", text: "كل شيء هنا. كل اسم. كل دفعة. كل تسجيل. كل جريمة. كل تغطية." },
    ],
    onEnter: { evidence: ["elias_drive"], secrets: ["elias_alive"] },
    next: (s) =>
      s.flags.discoveredRoom310B &&
      s.flags.playerMemoryRecovered &&
      s.flags.foundEliasFinalVideo &&
      s.flags.refusedEveryDeal &&
      s.alive.claire &&
      s.alive.maya &&
      s.alive.elias
        ? "s32b"
        : "s33",
  },
  {
    id: "s32b",
    chapter: "الفصل الثامن — الليلة الأخيرة",
    title: "الاسم",
    place: "سطح فندق هالسيون",
    bg: "rooftop",
    mood: "rain",
    lines: [
      { who: "daniel", text: "قبل أن آخذه. من يقود الدائرة؟" },
      { who: "narrator", text: "إيلاياس ينظر إلى المطر. لا إلى أخيه.", stage: true },
      { who: "elias", text: "أنت لا تسأل عن اسم. أنت تسأل عن سبب." },
      { who: "daniel", text: "أسأل عن اسم." },
      { who: "narrator", text: "فيكتور يخطو خطوة للخلف. هذه أول مرة يخاف فيها الليلة.", stage: true, shake: true },
      { who: "elias", text: "أنا." },
      { who: "narrator", text: "المطر يستمر كأن شيئاً لم يُقَل.", stage: true },
      { who: "elias", text: "أنا أنشأت مشروع أورفيوس. الحادث كان مُرتّباً. كلير جُنِّدت." },
      { who: "elias", text: "وأنت… أنت كنت الشاهد الذي يجب أن ينسى." },
      { who: "daniel", text: "لماذا؟" },
      { who: "elias", text: "لأن الناس لا يخافون الحقيقة." },
      { who: "narrator", text: "صمت.", stage: true },
      { who: "elias", text: "يخافون أن يعرفها أحد." },
    ],
    onEnter: {
      secrets: ["circle_leader", "circle"],
      set: { knowsCircleLeader: true, discoveredCircle: true },
    },
    choicePrompt: "دانيال يرفع السلاح. خياران فقط.",
    choices: [
      {
        id: "kill",
        text: "اقتل إيلاياس.",
        effect: { kill: ["elias"], set: { finalChoice: "public" } },
        goto: "e10",
      },
      {
        id: "walk",
        text: "اخرج ولا تنظر خلفك.",
        effect: { set: { finalChoice: "none" } },
        goto: "e10",
      },
    ],
  },
  {
    id: "s33",
    chapter: "الفصل الثامن — الليلة الأخيرة",
    title: "الاختيار الأخير",
    time: "9:58 ص",
    place: "سطح فندق هالسيون",
    bg: "rooftop",
    mood: "rain",
    lines: [
      { who: "narrator", text: "القرص في يده. المطر يزيد. الجميع ينتظر.", stage: true },
      { who: "daniel", text: "كل شيء اتخذته الليلة يقودني إلى هذه اللحظة." },
    ],
    choicePrompt: "ماذا تفعل بالدليل؟",
    choices: [
      {
        id: "public",
        text: "انشره للعالم كله.",
        effect: { set: { finalChoice: "public" } },
        goto: "resolve",
      },
      {
        id: "federal",
        text: "سلّمه لجهة تحقيق فيدرالية.",
        effect: { set: { finalChoice: "federal" } },
        goto: "resolve",
      },
      {
        id: "destroy",
        text: "دمّره.",
        effect: { set: { finalChoice: "destroy", destroyedEvidence: true } },
        goto: "resolve",
      },
      {
        id: "blackmail",
        text: "استخدمه لتساوم الدائرة.",
        effect: { set: { finalChoice: "blackmail", refusedEveryDeal: false } },
        goto: "resolve",
      },
      {
        id: "claire",
        text: "أعطه لكلير.",
        requires: (s) => s.alive.claire,
        effect: { set: { finalChoice: "claire" } },
        goto: "resolve",
      },
      {
        id: "maya",
        text: "أعطه لمايا.",
        requires: (s) => s.alive.maya,
        effect: { set: { finalChoice: "maya" } },
        goto: "resolve",
      },
      {
        id: "elias",
        text: "أعطه لإيلاياس واهرب معه.",
        requires: (s) => s.alive.elias,
        effect: { set: { finalChoice: "elias" } },
        goto: "resolve",
      },
    ],
  },
  {
    id: "resolve",
    chapter: "الفصل الثامن — الليلة الأخيرة",
    title: "…",
    place: "سطح فندق هالسيون",
    bg: "rooftop",
    mood: "rain",
    lines: [{ who: "narrator", text: "الفجر يبدأ. المدينة لا تعرف شيئاً بعد.", stage: true }],
    next: (s) => resolveEnding(s),
  },
];
