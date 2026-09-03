import { createFileRoute } from "@tanstack/react-router";
import { Stage3D } from "@/components/game/Stage3D";

export const Route = createFileRoute("/devscene")({
  ssr: false,
  component: Dev,
  head: () => ({
    meta: [
      { title: "معاينة المشاهد — الغرفة 310" },
      { name: "description", content: "صفحة معاينة داخلية لمشاهد اللعبة ثلاثية الأبعاد." },
      { property: "og:title", content: "معاينة المشاهد — الغرفة 310" },
      { property: "og:description", content: "معاينة مشاهد ثلاثية الأبعاد داخل اللعبة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Dev() {
  const place =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("p") ?? "drive"
      : "drive";
  const shot = Number(
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("s") ?? "0"
      : 0,
  );
  return (
    <main className="relative h-screen w-screen">
      <Stage3D place={place} shotIndex={shot} />
    </main>
  );
}
