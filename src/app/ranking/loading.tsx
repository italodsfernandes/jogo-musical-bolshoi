import { PianoFooter } from "@/components/piano-footer";
import { SiteCredit } from "@/components/site-credit";
import { SiteHeader } from "@/components/site-header";

export default function RankingLoading() {
  return (
    <main className="page-frame page-frame--stage page-enter">
      <SiteHeader />

      <div className="flex flex-1 flex-col items-center py-4">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-[rgba(255,248,230,0.14)]" />
        <div className="mt-3 h-4 w-52 animate-pulse rounded-full bg-[rgba(255,248,230,0.1)]" />

        <div className="mt-5 h-12 w-full max-w-sm animate-pulse rounded-2xl bg-[rgba(255,248,230,0.08)]" />
        <div className="mt-5 h-44 w-full max-w-sm animate-pulse rounded-3xl bg-[rgba(255,248,230,0.08)]" />

        <div className="mt-4 w-full max-w-sm space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-xl bg-[rgba(255,248,230,0.06)]"
            />
          ))}
        </div>
      </div>

      <PianoFooter />
      <SiteCredit />
    </main>
  );
}
