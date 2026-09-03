import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { CharacterId } from "@/game/types";

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

export function Stage3D({
  place,
  shotIndex,
  mood,
  speaker,
  closeup,
}: {
  place: string;
  shotIndex: number;
  mood?: string | undefined;
  speaker?: CharacterId | undefined;
  closeup?: boolean | undefined;
}) {
  return (
    <div className="absolute inset-0 bg-black">
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <Scene3D place={place} shotIndex={shotIndex} speaker={speaker} closeup={closeup} />
        </Suspense>
      </ClientOnly>
      <Grade mood={mood} />
    </div>
  );
}
