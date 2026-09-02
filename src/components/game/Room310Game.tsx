import { useCallback, useEffect, useMemo, useState } from "react";
import { backgrounds, portraits } from "@/game/assets";
import { characters } from "@/game/catalog";
import { useGame } from "@/game/store";
import { getScene } from "@/game/story";
import type { Choice, Line, Scene, StoryState } from "@/game/types";
import { CaseFile } from "./CaseFile";
import { Stage3D } from "./Stage3D";
import { TitleSequence } from "./TitleSequence";

type Stage = "lines" | "inspect" | "afterInspect" | "choices" | "done";

function visibleLines(lines: Line[], story: StoryState) {
  return lines.filter((l) => !l.requires || l.requires(story));
}

function Portrait({ who }: { who: string }) {
  const src = portraits[who as keyof typeof portraits];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-0 h-[68%] max-w-none object-contain opacity-95 drop-shadow-[0_0_40px_rgba(0,0,0,0.9)] md:h-[80%]"
    />
  );
}

export function Room310Game() {
  const {
    phase,
    sceneId,
    story,
    inspected,
    begin,
    goTo,
    apply,
    markInspected,
    openCaseFile,
    closeCaseFile,
    recordEnding,
    restartLoop,
    hardReset,
    runs,
  } = useGame();

  const scene: Scene = useMemo(() => getScene(sceneId), [sceneId]);
  const [stage, setStage] = useState<Stage>("lines");
  const [lineIdx, setLineIdx] = useState(0);
  const [detail, setDetail] = useState<{ lines: Line[]; idx: number } | null>(null);
  const [flash, setFlash] = useState(false);
  const [enteredScene, setEnteredScene] = useState<string | null>(null);

  const lines = useMemo(() => visibleLines(scene.lines, story), [scene, story]);
  const afterLines = useMemo(
    () => (scene.afterInspect ? visibleLines(scene.afterInspect, story) : []),
    [scene, story],
  );
  const availableChoices = useMemo(
    () => (scene.choices ?? []).filter((c) => !c.requires || c.requires(story)),
    [scene, story],
  );

  // دخول مشهد جديد
  useEffect(() => {
    if (enteredScene === scene.id) return;
    setEnteredScene(scene.id);
    setStage("lines");
    setLineIdx(0);
    setDetail(null);
    if (scene.onEnter) apply(scene.onEnter);
    if (scene.kind === "ending" && scene.endingCode) recordEnding(scene.endingCode);
  }, [scene, enteredScene, apply, recordEnding]);

  const sceneInspectDone = useMemo(() => {
    if (!scene.inspect) return true;
    const need = scene.minInspect ?? scene.inspect.length;
    const count = scene.inspect.filter((i) => inspected.includes(`${scene.id}:${i.id}`)).length;
    return count >= need;
  }, [scene, inspected]);

  const finishScene = useCallback(() => {
    if (scene.kind === "ending") {
      setStage("done");
      return;
    }
    const nxt = typeof scene.next === "function" ? scene.next(story) : scene.next;
    if (nxt) {
      setFlash(true);
      window.setTimeout(() => {
        setFlash(false);
        goTo(nxt);
      }, 320);
    } else {
      setStage("done");
    }
  }, [scene, story, goTo]);

  const advance = useCallback(() => {
    if (detail) {
      if (detail.idx < detail.lines.length - 1) setDetail({ ...detail, idx: detail.idx + 1 });
      else setDetail(null);
      return;
    }
    if (stage === "lines") {
      if (lineIdx < lines.length - 1) {
        setLineIdx(lineIdx + 1);
        return;
      }
      if (scene.inspect?.length) {
        setStage("inspect");
        return;
      }
      if (availableChoices.length) {
        setStage("choices");
        return;
      }
      finishScene();
      return;
    }
    if (stage === "afterInspect") {
      if (lineIdx < afterLines.length - 1) {
        setLineIdx(lineIdx + 1);
        return;
      }
      if (availableChoices.length) {
        setStage("choices");
        return;
      }
      finishScene();
    }
  }, [detail, stage, lineIdx, lines, afterLines, scene, availableChoices, finishScene]);

  const leaveInspect = useCallback(() => {
    if (!sceneInspectDone) return;
    if (afterLines.length) {
      setLineIdx(0);
      setStage("afterInspect");
      return;
    }
    if (availableChoices.length) {
      setStage("choices");
      return;
    }
    finishScene();
  }, [sceneInspectDone, afterLines, availableChoices, finishScene]);

  const pick = useCallback(
    (c: Choice) => {
      if (c.effect) apply(c.effect);
      if (c.goto) {
        setFlash(true);
        window.setTimeout(() => {
          setFlash(false);
          goTo(c.goto!);
        }, 320);
      } else {
        finishScene();
      }
    },
    [apply, goTo, finishScene],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (stage === "lines" || stage === "afterInspect" || detail) {
          e.preventDefault();
          advance();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, stage, detail]);

  if (phase === "title") {
    return <TitleSequence onDone={() => begin()} />;
  }

  if (phase === "casefile") {
    return <CaseFile mode="inline" onClose={closeCaseFile} />;
  }

  if (stage === "done" && scene.kind === "ending") {
    return (
      <EndingCard
        scene={scene}
        onOpen={() => setStage("casefile-open" as Stage)}
        onRestart={hardReset}
        onLoop={restartLoop}
      />
    );
  }
  if ((stage as string) === "casefile-open") {
    return (
      <CaseFile
        mode="ending"
        {...(scene.endingCode ? { endingCode: scene.endingCode } : {})}
        onRestart={hardReset}
        onLoop={restartLoop}
      />
    );
  }

  const current: Line | undefined = detail
    ? detail.lines[detail.idx]
    : stage === "afterInspect"
      ? afterLines[lineIdx]
      : lines[lineIdx];

  const red = scene.mood === "red";
  const canTapAdvance = !!current && (stage === "lines" || stage === "afterInspect" || !!detail);
  const showDialogue = !!current && stage !== "choices";
  // كل سطر حوار = لقطة كاميرا جديدة، فتتحرك الأحداث أمام اللاعب بدل صورة مجمّدة
  const shotIndex =
    lineIdx +
    (detail ? 2 : 0) +
    (stage === "afterInspect" ? 3 : 0) +
    (stage === "inspect" ? 1 : 0) +
    (stage === "choices" ? 4 : 0);

  return (
    <div
      className="film-grain relative h-dvh w-full overflow-hidden bg-black select-none"
      data-mood={scene.mood ?? "dark"}
    >
      <Stage3D place={scene.bg} shotIndex={shotIndex} mood={scene.mood} />
      <div className="pointer-events-none absolute inset-0 vignette" />
      {(scene.mood === "rain" || scene.mood === "cold") && (
        <div className="rain-layer pointer-events-none absolute inset-0 opacity-20" />
      )}
      {red && <div className="pointer-events-none absolute inset-0 emergency-pulse" />}
      {flash && <div className="pointer-events-none absolute inset-0 z-50 bg-black" />}

      {showDialogue && current && <Portrait who={current.who} />}


      {/* شريط علوي */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-4 md:p-6">
        <div>
          <p className="text-[0.65rem] tracking-[0.35em] text-primary/90">{scene.chapter}</p>
          <p className="mt-1 text-sm text-foreground/90 md:text-base">
            {scene.place}
            {scene.time ? <span className="text-muted-foreground"> — {scene.time}</span> : null}
          </p>
        </div>
        <button onClick={openCaseFile} className="btn-ghost text-xs">
          ملف القضية
          {story.evidence.length > 0 && (
            <span className="ms-2 font-mono text-primary">{story.evidence.length}</span>
          )}
        </button>
      </header>

      {/* نقاط الفحص */}
      {stage === "inspect" && !detail && (
        <>
          <div className="absolute inset-x-0 top-24 z-20 px-6 text-center">
            <p className="mx-auto max-w-md text-sm text-foreground/85">
              {scene.inspectPrompt ?? "افحص المكان."}
            </p>
          </div>
          {scene.inspect?.map((pt) => {
            const key = `${scene.id}:${pt.id}`;
            const seen = inspected.includes(key);
            return (
              <button
                key={pt.id}
                onClick={() => {
                  markInspected(key);
                  if (!seen && pt.effect) apply(pt.effect);
                  setDetail({ lines: visibleLines(pt.lines, story), idx: 0 });
                }}
                className={`hotspot ${seen ? "hotspot-seen" : ""}`}
                style={{ right: `${pt.x}%`, top: `${pt.y}%` }}
              >
                <span className="hotspot-label">{pt.label}</span>
              </button>
            );
          })}
          <div className="absolute inset-x-0 bottom-8 z-30 flex justify-center">
            <button onClick={leaveInspect} disabled={!sceneInspectDone} className="btn-primary disabled:opacity-30">
              {sceneInspectDone ? "اكتفيتُ بهذا" : "ما زال هناك ما لم تره"}
            </button>
          </div>
        </>
      )}

      {/* الحوار */}
      {showDialogue && current && (
        <button
          onClick={canTapAdvance ? advance : undefined}
          className="absolute inset-x-0 bottom-0 z-30 w-full cursor-pointer p-4 text-right md:p-8"
        >
          <div
            key={`${scene.id}-${stage}-${detail ? detail.idx : lineIdx}`}
            className={`dialogue mx-auto max-w-3xl ${current.shake ? "shake" : ""}`}
          >
            {characters[current.who]?.name && (
              <p
                className="mb-2 text-sm tracking-[0.2em]"
                style={{ color: characters[current.who].color }}
              >
                {characters[current.who].name}
              </p>
            )}
            <p
              className={
                current.who === "system"
                  ? "whitespace-pre-line font-mono text-base leading-relaxed text-primary md:text-lg"
                  : current.stage
                    ? "text-base leading-loose text-muted-foreground italic md:text-lg"
                    : "text-lg leading-loose text-foreground md:text-2xl"
              }
            >
              {current.text}
            </p>
            {canTapAdvance && (
              <span className="mt-3 block text-[0.7rem] text-muted-foreground/60">
                اضغط للمتابعة
              </span>
            )}
          </div>
        </button>
      )}

      {/* الاختيارات — لوحة مستقلة لا تتداخل مع صندوق الحوار */}
      {stage === "choices" && !detail && (
        <div className="absolute inset-0 z-40 flex items-end justify-center overflow-y-auto bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 pb-6 md:items-center md:p-8">
          <div className="mx-auto w-full max-w-2xl">
            <p className="mb-5 text-center text-sm text-foreground/80">
              {scene.choicePrompt ?? "ماذا تفعل؟"}
            </p>
            <div className="grid gap-3">
              {availableChoices.map((c) => (
                <button key={c.id} onClick={() => pick(c)} className="choice">
                  <span>{c.text}</span>
                  {c.hint && <span className="text-[0.7rem] text-primary/80">{c.hint}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      {runs > 1 && story.flags.loopCount > 0 && stage === "lines" && lineIdx === 0 && (
        <p className="absolute bottom-2 left-3 z-40 font-mono text-[0.65rem] text-primary/50">
          الجلسة {story.flags.loopCount + 1}
        </p>
      )}
    </div>
  );
}

function EndingCard({
  scene,
  onOpen,
  onRestart,
  onLoop,
}: {
  scene: Scene;
  onOpen: () => void;
  onRestart: () => void;
  onLoop: () => void;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="film-grain relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
      <div className="pointer-events-none absolute inset-0 vignette" />
      <p className="text-xs tracking-[0.5em] text-primary">النهاية</p>
      <h2 className="mt-4 font-display text-5xl text-foreground md:text-7xl">{scene.endingTitle}</h2>
      <p className="mt-8 max-w-md text-sm leading-loose text-muted-foreground">
        لكل غرفة سِرّ.
      </p>
      <div
        className="mt-12 flex flex-wrap justify-center gap-3 transition-opacity duration-1000"
        style={{ opacity: show ? 1 : 0 }}
      >
        <button onClick={onOpen} className="btn-primary">
          افتح ملف القضية
        </button>
        {scene.endingCode === "e09" ? (
          <button onClick={onLoop} className="btn-ghost">
            1:47 ص — مرة أخرى
          </button>
        ) : (
          <button onClick={onRestart} className="btn-ghost">
            ليلة جديدة
          </button>
        )}
      </div>
    </div>
  );
}
