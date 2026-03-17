import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PianoFooter } from "@/components/piano-footer";
import { ResultActions } from "@/components/result-actions";
import { ResultCelebration } from "@/components/result-celebration";
import { ResultOgPreview } from "@/components/result-og-preview";
import { SiteCredit } from "@/components/site-credit";
import { SiteHeader } from "@/components/site-header";
import { getResultSnapshot } from "@/lib/firebase";

export const dynamic = "force-dynamic";

interface ResultPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ResultPageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const result = await getResultSnapshot(sessionId).catch(() => null);

  if (!result) {
    return {
      title: "Resultado nao encontrado | MusiQuiz Piano Day",
    };
  }

  return {
    title: `${result.studentName} | ${result.score} pontos`,
    description: `${result.studentName} terminou o Piano Day MusiQuiz com ${result.score} pontos.`,
    openGraph: {
      images: [`/resultado/${sessionId}/opengraph-image`],
    },
  };
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { sessionId } = await params;
  const result = await getResultSnapshot(sessionId).catch(() => null);

  if (!result) {
    notFound();
  }

  return (
    <main className="page-frame page-frame--stage page-enter">
      <SiteHeader
        rightSlot={
          <Link href="/ranking" className="game-pill">
            Ranking
          </Link>
        }
      />

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        {/* Celebration */}
        <ResultCelebration />

        <h1 className="text-center text-[clamp(2rem,8vw,3.2rem)] font-bold leading-tight text-[hsl(var(--ivory))]">
          Seu resultado
        </h1>

        <p className="mt-2 text-center text-base text-[rgba(255,248,230,0.82)]">
          Parabéns,{" "}
          <span className="font-semibold text-[hsl(var(--accent))]">
            {result.studentName}
          </span>
          !
        </p>

        {result.playerType === "student" ? (
          <p className="mt-1 text-center text-sm font-semibold text-[rgba(255,248,230,0.7)]">
            Aluno Bolshoi
          </p>
        ) : null}

        {/* Score card */}
        <div className="game-card--gold mt-5 w-full max-w-md p-5 text-center">
          <p className="eyebrow text-[rgba(18,33,34,0.64)]">Pontuação</p>
          <p className="score-figure mt-1 score-pop">{result.score}</p>

          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-[rgba(18,33,34,0.58)]">
                Posição
              </p>
              <p className="mt-1 text-2xl font-black text-[hsl(var(--primary))]">
                #{result.position}
              </p>
            </div>
            <div className="h-8 w-px bg-[rgba(176,148,90,0.2)]" />
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-[rgba(18,33,34,0.58)]">
                Conquista
              </p>
              <p className="mt-1 text-sm font-bold text-[hsl(var(--accent))]">
                {result.title}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-[rgba(18,33,34,0.58)]">
            {result.isPersonalBest
              ? "Novo recorde pessoal!"
              : "Continue tentando!"}
          </p>
        </div>

        <div className="mt-5 w-full max-w-md rounded-2xl border border-[rgba(255,248,230,0.14)] bg-[rgba(255,248,230,0.06)] p-4 sm:p-5">
          {/* OG Image preview */}
          <ResultOgPreview
            sessionId={sessionId}
            studentName={result.studentName}
          />

          {/* Share actions */}
          <div className="mt-5">
            <p className="mb-3 text-center text-sm font-medium text-[rgba(255,248,230,0.78)]">
              Compartilha aí 👇
            </p>
            <ResultActions
              sessionId={sessionId}
              registration={result.registration}
              playerType={result.playerType}
              studentName={result.studentName}
              score={result.score}
              shareUrl={result.shareUrl}
            />
          </div>
        </div>
      </div>

      {/* Piano footer */}
      <PianoFooter />

      <SiteCredit />
    </main>
  );
}
