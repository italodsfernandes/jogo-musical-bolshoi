import Link from "next/link";

import { PianoFooter } from "@/components/piano-footer";
import { SiteCredit } from "@/components/site-credit";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getLeaderboard } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const MEDALS = ["🥇", "🥈", "🥉"];

interface RankingPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const params = await searchParams;
  const activeTab = params.tab === "alunos" ? "alunos" : "global";
  const leaderboard = await getLeaderboard(
    activeTab === "alunos" ? "student" : "all",
  ).catch(() => []);
  const topTenLeaderboard = leaderboard.slice(0, 10);
  const podium = topTenLeaderboard.slice(0, 3);
  const rest = topTenLeaderboard.slice(3);

  return (
    <main className="page-frame page-frame--stage page-enter">
      <SiteHeader
        rightSlot={
          <Button asChild size="sm" variant="outline">
            <Link href="/">Jogar</Link>
          </Button>
        }
      />

      <div className="flex flex-1 flex-col items-center py-4">
        <h1 className="text-center text-[clamp(2rem,8vw,3rem)] font-bold leading-tight text-[hsl(var(--ivory))]">
          Ranking
        </h1>
        <p className="mt-1 text-center text-sm text-[rgba(255,248,230,0.6)]">
          {activeTab === "alunos" ? "Alunos Bolshoi" : "Todos os participantes"}
        </p>

        <div className="mt-5 flex w-full max-w-sm rounded-2xl border border-[rgba(255,248,230,0.14)] bg-[rgba(255,248,230,0.06)] p-1">
          <Link
            href="/ranking?tab=alunos"
            className={`flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold transition-colors ${
              activeTab === "alunos"
                ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"
                : "text-[rgba(255,248,230,0.78)] hover:bg-[rgba(255,248,230,0.08)]"
            }`}
          >
            Alunos
          </Link>
          <Link
            href="/ranking?tab=global"
            className={`flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold transition-colors ${
              activeTab === "global"
                ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"
                : "text-[rgba(255,248,230,0.78)] hover:bg-[rgba(255,248,230,0.08)]"
            }`}
          >
            Geral
          </Link>
        </div>

        <div className="mt-5 flex w-full max-w-sm items-end justify-center gap-3">
          {[1, 0, 2].map((podiumIndex) => {
            const entry = podium[podiumIndex];
            const rank = podiumIndex + 1;
            const isFirst = podiumIndex === 0;

            return (
              <div
                key={rank}
                className={`flex min-w-0 flex-1 flex-col items-center rounded-2xl border border-[rgba(255,248,230,0.12)] bg-[rgba(255,248,230,0.06)] px-2.5 py-4 text-center ${
                  isFirst
                    ? "z-10 -mt-3 min-h-[180px] border-[rgba(176,148,90,0.45)] pb-6 shadow-[0_0_28px_rgba(176,148,90,0.28)] sm:scale-105"
                    : podiumIndex === 1
                      ? "min-h-[148px]"
                      : "min-h-[120px]"
                }`}
              >
                <span className="text-2xl">{MEDALS[podiumIndex]}</span>
                <p
                  className={`mt-2 w-full whitespace-normal break-words text-center font-bold leading-tight text-[hsl(var(--ivory))] ${isFirst ? "text-base" : "text-sm"}`}
                >
                  {entry ? entry.studentName : "---"}
                </p>
                <p
                  className={`mt-1 [font-family:var(--font-display),serif] font-bold text-[hsl(var(--accent))] ${
                    isFirst ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
                  }`}
                >
                  {entry?.score ?? "--"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 w-full max-w-sm space-y-2">
          {topTenLeaderboard.length === 0 && (
            <div className="rounded-2xl bg-[rgba(255,248,230,0.06)] p-6 text-center">
              <p className="text-sm text-[rgba(255,248,230,0.6)]">
                Ninguém jogou ainda. Seja o primeiro!
              </p>
            </div>
          )}

          {rest.map((entry, index) => (
            <div
              key={entry.sessionId}
              className="flex items-center gap-3 rounded-xl border border-[rgba(255,248,230,0.08)] bg-[rgba(255,248,230,0.04)] px-4 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(176,148,90,0.15)] text-xs font-bold text-[hsl(var(--accent))]">
                {index + 4}
              </span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-normal break-words text-sm font-semibold leading-snug text-[hsl(var(--ivory))]">
                  {entry.studentName}
                </p>
              </div>
              <span className="text-base font-bold text-[hsl(var(--accent))]">
                {entry.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Piano footer */}
      <PianoFooter />

      <SiteCredit />
    </main>
  );
}
