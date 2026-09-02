import type { StoryState } from "../types";

/**
 * يحوّل مجموع الحالة إلى إحدى النهايات العشر.
 * لا يرى اللاعب هذه الشروط أبداً.
 */
export function resolveEnding(s: StoryState): string {
  const f = s.flags;

  // النهاية العاشرة تُحسم في مشهدها الخاص (s32b)
  if (f.knowsCircleLeader) return "e10";

  // مساومة الدائرة
  if (f.finalChoice === "blackmail") return "e05";

  // تدمير كل شيء
  if (f.finalChoice === "destroy" || f.destroyedEvidence) return "e08";

  // الأخ قبل كل شيء
  if (f.finalChoice === "elias" && s.alive.elias) return "e06";

  // صفقة فيكتور
  if (f.acceptedVictorDeal || (!f.refusedEveryDeal && s.trust.victor >= 25)) return "e04";

  // كلير
  if (f.finalChoice === "claire") {
    const claireEarned = s.trust.claire >= 45 && f.playerMemoryRecovered;
    return claireEarned ? "e02" : "e07";
  }

  // الشهيد: نشر كل شيء ورفض كل صفقة وعداء مفتوح مع فيكتور
  if (f.finalChoice === "public" && f.refusedEveryDeal && s.trust.victor <= -10) return "e03";

  // الحلقة: استعاد الذاكرة ووجد 310ب لكنه لم يعرف من يقود الدائرة
  if (f.discoveredRoom310B && f.playerMemoryRecovered && !f.knowsCircleLeader) return "e09";

  // الحقيقة: مسار مايا مع دليل سليم
  if (
    (f.finalChoice === "maya" || f.finalChoice === "federal" || f.finalChoice === "public") &&
    s.alive.maya &&
    s.trust.maya >= 40 &&
    !f.destroyedEvidence
  )
    return "e01";

  if (f.finalChoice === "public" || f.finalChoice === "federal") return "e01";

  return "e09";
}
