import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { backgrounds } from "@/game/assets";

const Scene3D = lazy(() => import("@/game/three/Scene3D"));

function Grade({ mood }: { mood?: string | undefined }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          mood === "red"
            ? "radial-gradient(circle at 50% 40%, rgba(255,40,30,0.14), rgba(4,2,3,0.75) 80%)"
            : mood === "warm"
              ? "radial-gradient(circle at 50% 45%, rgba(255,196,120,0.10), rgba(6,5,4,0.7) 82%)"
              : "radial-gradient(circle at 50% 45%, rgba(120,160,210,0.07), rgba(2,4,7,0.72) 82%)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

/** لوحة ثابتة تظهر لحظة التحميل فقط، ثم يحلّ محلها العالم ثلاثي الأبعاد */
function StillFallback({ place }: { place: string }) {
  const src = backgrounds[place] ?? backgrounds["room310"];
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className="absolute inset-0 h-full w-full scale-105 object-cover"
      style={{ filter: "saturate(0.7) contrast(1.08) brightness(0.6)" }}
    />
  );
}

export function Stage3D({
  place,
  shotIndex,
  mood,
}: {
  place: string;
  shotIndex: number;
  mood?: string | undefined;
}) {
  return (
    <div className="absolute inset-0">
      <StillFallback place={place} />
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <Scene3D place={place} shotIndex={shotIndex} />
        </Suspense>
      </ClientOnly>
      <Grade mood={mood} />
    </div>
  );
}
