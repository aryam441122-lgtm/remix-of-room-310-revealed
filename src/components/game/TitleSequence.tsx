import { useEffect, useState } from "react";

const beats = [
  { t: 400, text: "فندق هالسيون" },
  { t: 2600, text: "2:13 ص" },
  { t: 4600, text: "«إن كنت تسمع هذا…»" },
  { t: 6600, text: "«…فأنا ميتة بالفعل.»" },
];

export function TitleSequence({ onDone }: { onDone: () => void }) {
  const [beat, setBeat] = useState(-1);
  const [showTitle, setShowTitle] = useState(false);
  const [showTag, setShowTag] = useState(false);

  useEffect(() => {
    const timers = beats.map((b, i) => window.setTimeout(() => setBeat(i), b.t));
    const t1 = window.setTimeout(() => setShowTitle(true), 8800);
    const t2 = window.setTimeout(() => setShowTag(true), 11200);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <button
      onClick={onDone}
      aria-label="ابدأ"
      className="film-grain relative flex h-dvh w-full cursor-pointer flex-col items-center justify-center overflow-hidden bg-black text-center"
    >
      <div className="rain-layer pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute inset-0 vignette" />

      <div className="relative z-10 flex min-h-[7rem] items-center justify-center px-6">
        {beats.map((b, i) => (
          <p
            key={b.text}
            className="absolute text-balance text-lg text-muted-foreground transition-all duration-1000 md:text-2xl"
            style={{ opacity: beat === i ? 1 : 0, transform: beat === i ? "none" : "translateY(8px)" }}
          >
            {b.text}
          </p>
        ))}
      </div>

      <h1
        className="relative z-10 font-display text-6xl tracking-[0.2em] text-foreground transition-all duration-[2500ms] md:text-8xl"
        style={{ opacity: showTitle ? 1 : 0, letterSpacing: showTitle ? "0.12em" : "0.5em" }}
      >
        الغرفة ٣١٠
      </h1>

      <p
        className="relative z-10 mt-8 text-sm text-primary transition-opacity duration-[2000ms] md:text-base"
        style={{ opacity: showTag ? 1 : 0 }}
      >
        لا تثق بالغرفة.
      </p>

      <span
        className="absolute bottom-10 z-10 text-xs text-muted-foreground/70 transition-opacity duration-1000"
        style={{ opacity: showTag ? 1 : 0 }}
      >
        اضغط في أي مكان للمتابعة
      </span>
    </button>
  );
}
