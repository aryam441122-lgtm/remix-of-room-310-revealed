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
            ? "radial-gradient(circle at 50% 40%, rgba(255,60,45,0.16), rgba(12,4,5,0.4) 92%)"
            : mood === "warm"
              ? "radial-gradient(circle at 50% 45%, rgba(255,206,140,0.12), rgba(14,10,7,0.3) 94%)"
              : "radial-gradient(circle at 50% 45%, rgba(140,180,225,0.10), rgba(5,8,13,0.3) 94%)",
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
