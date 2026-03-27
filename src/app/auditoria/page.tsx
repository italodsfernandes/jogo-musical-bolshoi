import Link from "next/link";
import { CheckCircle2Icon, Clock3Icon, TrophyIcon } from "lucide-react";

import { PianoFooter } from "@/components/piano-footer";
import { SiteCredit } from "@/components/site-credit";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getAuditRows } from "@/lib/audit";

export const dynamic = "force-dynamic";

const formatAttemptDate = (value: number | null) => {
  if (!value) {
    return "Nao concluida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(value);
};

const formatScore = (value: number | null) => {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("pt-BR").format(value);
};

export default async function AuditPage() {
  const rows = await getAuditRows().catch(() => []);
  const attemptedRows = rows.filter((row) => row.attemptsUsed > 0);

  return (
    <main className="page-frame page-frame--stage page-frame--wide page-enter">
      <SiteHeader
        rightSlot={
          <Button asChild size="sm" variant="outline">
            <Link href="/">Jogar</Link>
          </Button>
        }
      />

      <div className="relative flex flex-1 flex-col py-4">
        <section className="rounded-[1.8rem] border border-[rgba(255,248,230,0.1)] bg-[rgba(5,28,29,0.62)] px-5 py-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[rgba(255,248,230,0.5)]">
                Auditoria
              </p>
              <h1 className="mt-2 text-[clamp(2rem,5vw,3rem)] font-bold leading-tight text-[hsl(var(--ivory))]">
                Lista de jogadas
              </h1>
              <p className="mt-2 text-sm text-[rgba(255,248,230,0.68)]">
                Ordenado por ranking. Quem nao entrou no ranking fica depois.
              </p>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="rounded-[1.2rem] border border-[rgba(255,248,230,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[rgba(255,248,230,0.48)]">
                  Alunos
                </p>
                <p className="mt-1 text-2xl font-bold text-[hsl(var(--ivory))]">
                  {rows.length}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[rgba(255,248,230,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[rgba(255,248,230,0.48)]">
                  Tentaram
                </p>
                <p className="mt-1 text-2xl font-bold text-[hsl(var(--ivory))]">
                  {attemptedRows.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[1.8rem] border border-[rgba(255,248,230,0.1)] bg-[rgba(5,28,29,0.66)] shadow-[0_24px_64px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          <div className="border-b border-[rgba(255,248,230,0.08)] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[hsl(var(--ivory))]">
                  Lista de auditoria
                </h2>
                <p className="text-sm text-[rgba(255,248,230,0.62)]">
                  Abra um aluno para ver o histórico.
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-[rgba(255,248,230,0.46)]">
                {rows.length} registros
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {rows.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-[rgba(255,248,230,0.12)] bg-[rgba(255,255,255,0.03)] px-6 py-12 text-center">
                <p className="text-base font-semibold text-[hsl(var(--ivory))]">
                  Nenhum dado de auditoria encontrado.
                </p>
                <p className="mt-2 text-sm text-[rgba(255,248,230,0.62)]">
                  Assim que houver partidas registradas, elas aparecem aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((row) => {
                  const finishedAttempts = row.attemptHistory.filter(
                    (attempt) => attempt.finishedAt !== null,
                  ).length;

                  return (
                    <details
                      key={row.registration}
                      className="group overflow-hidden rounded-[1.5rem] border border-[rgba(255,248,230,0.08)] bg-[rgba(255,255,255,0.02)]"
                    >
                      <summary className="cursor-pointer list-none p-4 transition-colors duration-200 hover:bg-[rgba(255,255,255,0.025)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-inset sm:p-5">
                        <div className="grid gap-4 md:grid-cols-[88px_minmax(0,1.7fr)_132px] md:items-start xl:grid-cols-[88px_minmax(0,1.8fr)_140px_132px_150px] xl:items-center">
                          <div>
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[rgba(255,248,230,0.48)]">
                              Ranking
                            </p>
                            <p className="mt-1 text-2xl font-bold text-[hsl(var(--accent))]">
                              {row.rankingPosition
                                ? `#${row.rankingPosition}`
                                : "--"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[rgba(255,248,230,0.48)]">
                              Aluno
                            </p>
                            <p className="max-w-xl text-base font-semibold leading-6 text-[hsl(var(--ivory))] break-words">
                              {row.name}
                            </p>
                            <p className="mt-1 font-mono text-sm text-[rgba(255,248,230,0.54)]">
                              {row.registration}
                            </p>
                          </div>

                          <div>
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[rgba(255,248,230,0.48)]">
                              Melhor score
                            </p>
                            <p className="text-2xl font-bold text-[hsl(var(--accent))]">
                              {formatScore(row.bestScore)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[rgba(255,248,230,0.48)]">
                              Tentativas
                            </p>
                            <p className="text-2xl font-bold text-[hsl(var(--ivory))]">
                              {row.attemptsUsed}
                              <span className="text-base text-[rgba(255,248,230,0.46)]">
                                /{row.maxAttempts}
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-[rgba(255,248,230,0.58)]">
                              {finishedAttempts} concluídas
                            </p>
                          </div>

                          <div className="flex items-end justify-between gap-3 md:col-span-3 xl:col-span-1 xl:justify-end">
                            <div className="text-sm text-[rgba(255,248,230,0.68)] xl:text-right">
                              {row.attemptHistory.length === 0
                                ? "Sem tentativas"
                                : `${row.attemptHistory.length} registro${row.attemptHistory.length > 1 ? "s" : ""}`}
                            </div>
                            <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[rgba(176,148,90,0.22)] bg-[rgba(176,148,90,0.08)] px-4 text-sm font-semibold text-[hsl(var(--accent))] whitespace-nowrap">
                              <TrophyIcon className="h-4 w-4" />
                              Histórico
                            </span>
                          </div>
                        </div>
                      </summary>

                      <div className="border-t border-[rgba(255,248,230,0.08)] bg-[rgba(1,15,16,0.3)] px-4 py-4 sm:px-5 sm:py-5">
                        {row.attemptHistory.length === 0 ? (
                          <div className="rounded-[1.4rem] border border-dashed border-[rgba(255,248,230,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[rgba(255,248,230,0.62)]">
                            Nenhuma tentativa registrada para este aluno até o
                            momento.
                          </div>
                        ) : (
                          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                            {row.attemptHistory.map((attempt) => {
                              const isFinished = attempt.finishedAt !== null;

                              return (
                                <article
                                  key={attempt.sessionId}
                                  className="rounded-[1.5rem] border border-[rgba(255,248,230,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[rgba(255,248,230,0.48)]">
                                        Tentativa {attempt.attemptNumber}
                                      </p>
                                      <p className="mt-2 font-mono text-2xl font-semibold text-[hsl(var(--accent))]">
                                        {formatScore(attempt.score)}
                                      </p>
                                    </div>
                                    <span
                                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${
                                        isFinished
                                          ? "border border-[rgba(110,207,151,0.22)] bg-[rgba(110,207,151,0.12)] text-[rgb(185,245,207)]"
                                          : "border border-[rgba(255,248,230,0.1)] bg-[rgba(255,255,255,0.05)] text-[rgba(255,248,230,0.74)]"
                                      }`}
                                    >
                                      {isFinished ? (
                                        <CheckCircle2Icon className="h-3.5 w-3.5" />
                                      ) : (
                                        <Clock3Icon className="h-3.5 w-3.5" />
                                      )}
                                      {isFinished ? "Concluída" : "Em aberto"}
                                    </span>
                                  </div>

                                  <dl className="mt-4 space-y-3 text-sm text-[rgba(255,248,230,0.72)]">
                                    <div>
                                      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[rgba(255,248,230,0.46)]">
                                        Início
                                      </dt>
                                      <dd className="mt-1 leading-5">
                                        {formatAttemptDate(attempt.startedAt)}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[rgba(255,248,230,0.46)]">
                                        Finalização
                                      </dt>
                                      <dd className="mt-1 leading-5">
                                        {formatAttemptDate(attempt.finishedAt)}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[rgba(255,248,230,0.46)]">
                                        Sessão
                                      </dt>
                                      <dd className="mt-1 break-all font-mono text-xs leading-5 text-[rgba(255,248,230,0.58)]">
                                        {attempt.sessionId}
                                      </dd>
                                    </div>
                                  </dl>
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <PianoFooter />
      <SiteCredit />
    </main>
  );
}
