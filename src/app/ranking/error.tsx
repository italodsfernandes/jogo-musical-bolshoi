"use client";

import { PianoFooter } from "@/components/piano-footer";
import { SiteCredit } from "@/components/site-credit";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function RankingError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="page-frame page-frame--stage page-enter">
      <SiteHeader />

      <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        <h1 className="text-[clamp(2rem,8vw,3rem)] font-bold text-[hsl(var(--ivory))]">
          Não foi possível carregar o ranking
        </h1>
        <p className="mt-3 max-w-sm text-base text-[rgba(255,248,230,0.72)]">
          Tente novamente em alguns instantes.
        </p>
        <Button className="mt-6" onClick={() => reset()}>
          Tentar novamente
        </Button>
      </div>

      <PianoFooter />
      <SiteCredit />
    </main>
  );
}
