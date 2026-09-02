import { evidenceCatalog, secretCatalog } from "@/game/catalog";
import { useGame } from "@/game/store";
import { endingList } from "@/game/story";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}

export function CaseFile({
  mode,
  onClose,
  onRestart,
  onLoop,
  endingCode,
}: {
  mode: "inline" | "ending";
  onClose?: () => void;
  onRestart?: () => void;
  onLoop?: () => void;
  endingCode?: string;
}) {
  const { story, endingsFound } = useGame();
  const saved = (["claire", "maya", "noah", "elias", "victor"] as const).filter(
    (k) => k !== "victor" && story.alive[k],
  ).length;

  const locked = "مجهول";

  return (
    <div className="film-grain min-h-dvh w-full overflow-y-auto bg-background px-5 py-10 md:px-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs tracking-[0.4em] text-primary">ملف القضية</p>
        <h2 className="mt-2 font-display text-3xl text-foreground md:text-4xl">فندق هالسيون — الغرفة ٣١٠</h2>

        <div className="mt-8 rounded-lg border border-border/60 bg-card/50 p-5">
          <Row label="الأدلة المكتشفة" value={`${story.evidence.length} / ${Object.keys(evidenceCatalog).length}`} />
          <Row label="الشخصيات الناجية" value={`${saved} / 4`} />
          <Row label="الأسرار المكتشفة" value={`${story.secrets.length} / ${Object.keys(secretCatalog).length}`} />
          <Row label="النهايات المكتشفة" value={`${endingsFound.length} / ${endingList.length}`} />
          <Row label="الغرفة ٣١٠ب" value={story.flags.discoveredRoom310B ? "مكشوفة" : "مقفلة"} />
          <Row label="الدائرة" value={story.flags.discoveredCircle ? "معروفة" : locked} />
          <Row label="حقيقة إيلاياس" value={story.flags.knowsCircleLeader ? "معروفة" : locked} />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm tracking-[0.25em] text-primary">الأدلة</h3>
            <ul className="space-y-1.5 text-sm">
              {Object.entries(evidenceCatalog).map(([id, label]) => (
                <li
                  key={id}
                  className={story.evidence.includes(id) ? "text-foreground" : "text-muted-foreground/35"}
                >
                  {story.evidence.includes(id) ? label : "— — —"}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm tracking-[0.25em] text-primary">الأسرار</h3>
            <ul className="space-y-1.5 text-sm">
              {Object.entries(secretCatalog).map(([id, label]) => (
                <li
                  key={id}
                  className={story.secrets.includes(id) ? "text-foreground" : "text-muted-foreground/35"}
                >
                  {story.secrets.includes(id) ? label : "— — —"}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-3 text-sm tracking-[0.25em] text-primary">النهايات</h3>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {endingList.map((e, i) => (
              <li
                key={e.code}
                className={endingsFound.includes(e.code) ? "text-foreground" : "text-muted-foreground/35"}
              >
                {String(i + 1).padStart(2, "0")} —{" "}
                {endingsFound.includes(e.code) ? e.title : "غير مكتشفة"}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {mode === "inline" && onClose && (
            <button onClick={onClose} className="btn-ghost">
              عُد إلى الليلة
            </button>
          )}
          {mode === "ending" && endingCode === "e09" && onLoop && (
            <button onClick={onLoop} className="btn-primary">
              1:47 ص — مرة أخرى
            </button>
          )}
          {mode === "ending" && onRestart && (
            <button onClick={onRestart} className="btn-ghost">
              ابدأ ليلة جديدة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
