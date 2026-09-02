import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { Room310Game } from "@/components/game/Room310Game";

const title = "الغرفة ٣١٠ — لغز سينمائي تفاعلي";
const description =
  "الغرفة ٣١٠: لعبة غموض نفسية تفاعلية بالعربية داخل فندق هالسيون. حقّق، لاحظ، اختر — وعشر نهايات مختلفة تنتظرك.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main dir="rtl" lang="ar">
      <h1 className="sr-only">الغرفة ٣١٠ — لغز سينمائي تفاعلي</h1>
      <ClientOnly fallback={<div className="h-dvh w-full bg-black" />}>
        <Room310Game />
      </ClientOnly>
    </main>
  );
}
