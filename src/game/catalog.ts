import type { CharacterId } from "./types";

export const characters: Record<CharacterId, { name: string; color: string }> = {
  daniel: { name: "دانيال فيل", color: "var(--ink-daniel)" },
  claire: { name: "كلير ميرسر", color: "var(--ink-claire)" },
  victor: { name: "فيكتور هيل", color: "var(--ink-victor)" },
  maya: { name: "المحققة مايا ريد", color: "var(--ink-maya)" },
  elias: { name: "إيلاياس فيل", color: "var(--ink-elias)" },
  noah: { name: "نواه كين", color: "var(--ink-noah)" },
  receptionist: { name: "موظفة الاستقبال", color: "var(--ink-minor)" },
  unknown: { name: "رقم مجهول", color: "var(--ink-unknown)" },
  narrator: { name: "", color: "var(--ink-narrator)" },
  system: { name: "", color: "var(--ink-system)" },
};

/** 25 دليلاً — عناوينها فقط تُكشف عند الحصول عليها */
export const evidenceCatalog: Record<string, string> = {
  reservation: "حجز باسم دانيال لم يقم به",
  photo_apartment: "صورة لدانيال أمام شقته — 1:32 ص",
  blood_stain: "أثر دماء تحت السرير",
  claire_phone: "هاتف كلير ميرسر المكسور",
  claire_video: "فيديو كلير — 00:47",
  hidden_camera: "كاميرا مخفية داخل كاشف الدخان",
  vent_note: "ورقة مطوية داخل فتحة التهوية",
  mirror_scratch: "خدوش أرقام على ظهر المرآة",
  keycard_log: "سجل بطاقة الغرفة",
  hallway_sighting: "مشاهدة كلير في الممر",
  archive_footage: "تسجيل دخول كلير إلى الغرفة 310",
  maintenance_uniform: "الرجل بزي الصيانة — 3:04 ص",
  no_camera_310: "الغرفة 310 بلا تغذية كاميرا",
  autopsy_report: "تقرير التشريح المعدَّل",
  sedatives: "مهدئات في دم كلير",
  orpheus_folder: "ملف مشروع أورفيوس",
  group_photo: "الصورة الجماعية — قبل خمس سنوات",
  elias_recorder: "مسجّل إيلاياس الصوتي",
  server_index: "فهرس الأقراص الصلبة",
  daniel_file: "ملف دانيال فيل — مُراقَب",
  elias_file: "ملف إيلاياس فيل — مُنتهى",
  police_report: "التقرير الأصلي للحادث",
  eighteen_minutes: "الثماني عشرة دقيقة",
  wall_photos: "جدار الصور في الغرفة 310",
  elias_drive: "القرص الصلب الأخير",
};

/** 12 سراً */
export const secretCatalog: Record<string, string> = {
  claire_alive: "كلير ميرسر لم تمت",
  hotel_is_facility: "الفندق منشأة مراقبة",
  orpheus: "مشروع أورفيوس",
  circle: "الدائرة",
  noah_at_crash: "نواه كان في موقع الحادث",
  elias_alive: "إيلاياس على قيد الحياة",
  room310b: "الغرفة 310ب",
  memory_wiped: "ذاكرة دانيال عُبثت بها",
  daniel_helped_elias: "دانيال ساعد أخاه على الاختفاء",
  seventeen_sites: "سبع عشرة منشأة أخرى",
  victor_is_employee: "فيكتور مجرّد موظف",
  circle_leader: "قائد الدائرة",
};
