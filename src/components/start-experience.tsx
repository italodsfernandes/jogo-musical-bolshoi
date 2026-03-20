"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircleIcon, TrophyIcon } from "lucide-react";
import Image from "next/image";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PianoFooter } from "@/components/piano-footer";
import { SiteCredit } from "@/components/site-credit";
import { Input } from "@/components/ui/input";
import { useGameSession } from "@/features/game/use-game-session";
import { normalizeRegistration } from "@/features/game/scoring";
import {
  PlayerRecord,
  StartBlockedResponse,
  StartGamePayload,
  StudentAttemptSummary,
  StudentLookupResponse,
} from "@/features/game/types";
import { BOLSHOI_LOGO_URL } from "@/lib/site";

const formatAttemptDate = (value: number | null) => {
  if (!value) {
    return "Nao concluida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
};

const FLOATING_NOTES = [
  { char: "♪", className: "left-[8%] top-[18%]", delay: 0 },
  { char: "♫", className: "right-[6%] top-[14%]", delay: 0.8 },
  { char: "𝄞", className: "left-[4%] top-[42%]", delay: 1.6 },
  { char: "♬", className: "right-[10%] top-[48%]", delay: 0.4 },
  { char: "♪", className: "left-[12%] bottom-[28%]", delay: 1.2 },
  { char: "♫", className: "right-[8%] bottom-[32%]", delay: 2.0 },
];

const createEmptySummary = (): StudentAttemptSummary => ({
  attemptsUsed: 0,
  attemptsRemaining: 3,
  maxAttempts: 3,
  isBlocked: false,
  bestScore: null,
  rankingPosition: null,
  attemptHistory: [],
});

const extractSummary = (
  payload: StudentAttemptSummary,
): StudentAttemptSummary => ({
  attemptsUsed: payload.attemptsUsed,
  attemptsRemaining: payload.attemptsRemaining,
  maxAttempts: payload.maxAttempts,
  isBlocked: payload.isBlocked,
  bestScore: payload.bestScore,
  rankingPosition: payload.rankingPosition,
  attemptHistory: payload.attemptHistory,
});

export const StartExperience = ({
  initialRegistration,
}: {
  initialRegistration: string;
}) => {
  const router = useRouter();
  const {
    state,
    actions: { beginGame, resetGame, clearPlayer },
  } = useGameSession();
  const [playerInput, setPlayerInput] = useState(
    initialRegistration || state.registration,
  );
  const [player, setResolvedPlayer] = useState<PlayerRecord | null>(
    state.registration && state.studentName && state.playerType === "student"
      ? {
          registration: state.registration,
          name: state.studentName,
          playerType: "student",
        }
      : null,
  );
  const [attemptSummary, setAttemptSummary] = useState<StudentAttemptSummary>(
    createEmptySummary(),
  );
  const [summaryRegistration, setSummaryRegistration] = useState<string | null>(
    null,
  );
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [errorShake, setErrorShake] = useState(0);

  useEffect(() => {
    if (!initialRegistration || player) {
      return;
    }

    const normalized = normalizeRegistration(initialRegistration);

    if (!normalized) {
      return;
    }

    void lookupRegistration(normalized);
  }, [initialRegistration, player]);

  useEffect(() => {
    if (!state.registration || state.playerType !== "student" || player) {
      return;
    }

    setPlayerInput(state.registration);
    setResolvedPlayer({
      registration: state.registration,
      name: state.studentName,
      playerType: "student",
    });
  }, [player, state.playerType, state.registration, state.studentName]);

  useEffect(() => {
    if (!player || summaryRegistration === player.registration) {
      return;
    }

    void lookupRegistration(player.registration);
  }, [player, summaryRegistration]);

  const lookupRegistration = async (value: string) => {
    const normalized = normalizeRegistration(value);

    if (!normalized) {
      setLookupError("Matrícula inválida.");
      setResolvedPlayer(null);
      setAttemptSummary(createEmptySummary());
      setSummaryRegistration(null);
      setErrorShake((currentValue) => currentValue + 1);
      return;
    }

    setIsSearching(true);
    setLookupError(null);

    try {
      const response = await fetch(`/api/students/${normalized}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as StudentLookupResponse;

      if (!data.found || !data.registration || !data.name) {
        setLookupError("Matrícula não encontrada.");
        setResolvedPlayer(null);
        setAttemptSummary(createEmptySummary());
        setSummaryRegistration(null);
        setErrorShake((currentValue) => currentValue + 1);
        return;
      }

      setResolvedPlayer({
        registration: data.registration,
        name: data.name,
        playerType: "student",
      });
      setAttemptSummary(extractSummary(data));
      setSummaryRegistration(data.registration);
    } catch {
      setLookupError("Algo deu errado. Tenta de novo.");
      setResolvedPlayer(null);
      setAttemptSummary(createEmptySummary());
      setSummaryRegistration(null);
      setErrorShake((currentValue) => currentValue + 1);
    } finally {
      setIsSearching(false);
    }
  };

  const normalizedRegistration = normalizeRegistration(playerInput);
  const canLookup = normalizedRegistration.length > 0;
  const hasAttemptsLeft = attemptSummary.attemptsRemaining > 0;

  const instantHint = !playerInput.trim()
    ? "Digite sua matrícula para validar."
    : canLookup
      ? "Aperta Enter para validar."
      : "Digite apenas os números da matrícula.";

  const handleLookup = () => {
    if (!canLookup) {
      setLookupError("Digite uma matrícula válida.");
      setErrorShake((currentValue) => currentValue + 1);
      return;
    }

    startTransition(() => {
      void lookupRegistration(playerInput);
    });
  };

  const handleStartGame = () => {
    if (!player || attemptSummary.isBlocked) {
      return;
    }

    void (async () => {
      resetGame();
      setLookupError(null);
      setIsStartingGame(true);

      try {
        const response = await fetch("/api/game", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "start",
            registration: player.registration,
            playerType: "student",
          }),
        });

        if (response.status === 409) {
          const blockedPayload =
            (await response.json()) as StartBlockedResponse;

          setAttemptSummary(extractSummary(blockedPayload));
          setSummaryRegistration(player.registration);
          setLookupError(blockedPayload.message);
          setErrorShake((currentValue) => currentValue + 1);
          return;
        }

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string }
            | null;

          throw new Error(
            errorPayload?.message ?? "Nao foi possivel iniciar o jogo.",
          );
        }

        const payload = (await response.json()) as StartGamePayload;
        beginGame(payload);
        setAttemptSummary((currentSummary) => ({
          ...currentSummary,
          attemptsUsed: Math.min(
            currentSummary.maxAttempts,
            currentSummary.attemptsUsed + 1,
          ),
          attemptsRemaining: Math.max(0, currentSummary.attemptsRemaining - 1),
          isBlocked: currentSummary.attemptsUsed + 1 >= currentSummary.maxAttempts,
        }));
        router.push("/game");
      } catch (error) {
        setLookupError(
          error instanceof Error
            ? error.message
            : "Não foi possível iniciar agora. Tente de novo.",
        );
        setErrorShake((currentValue) => currentValue + 1);
      } finally {
        setIsStartingGame(false);
      }
    })();
  };

  return (
    <main className="page-frame page-frame--stage game-surface page-enter">
      <div className="floating-notes floating-notes--bright" aria-hidden="true">
        {FLOATING_NOTES.map((note, index) => (
          <span
            key={index}
            className={note.className}
            style={{ animationDelay: `${note.delay}s` }}
          >
            {note.char}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex flex-col items-center"
        >
          <div className="rounded-2xl border border-[rgba(176,148,90,0.3)] bg-white/90 p-3 shadow-lg">
            <Image
              alt="Escola do Teatro Bolshoi no Brasil"
              src={BOLSHOI_LOGO_URL}
              width={64}
              height={64}
              className="h-14 w-14 object-contain"
              priority
            />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,248,230,0.55)]">
            Escola do Teatro Bolshoi no Brasil
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-6 text-center"
        >
          <h1 className="text-[clamp(2.8rem,12vw,4.5rem)] font-bold leading-[0.95] tracking-tight text-[hsl(var(--ivory))]">
            MusiQuiz:
            <br />
            <span className="text-[hsl(var(--accent))]">Piano Day</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-sm space-y-3"
        >
          <motion.div
            key={errorShake}
            animate={lookupError ? { x: [0, -8, 8, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.38 }}
            className="min-h-[140px]"
          >
            {player ? (
              attemptSummary.isBlocked ? (
                <div className="game-card space-y-4 text-left">
                  <div className="text-center">
                    <p className="text-base font-medium text-[rgba(18,33,34,0.55)]">
                      Limite atingido
                    </p>
                    <p className="mt-1 text-xl font-bold text-[hsl(var(--primary))]">
                      {player.name}
                    </p>
                    <p className="mt-0.5 text-base text-[rgba(18,33,34,0.5)]">
                      Aluno · {player.registration}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[rgba(18,33,34,0.06)] px-4 py-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(18,33,34,0.5)]">
                      Tentativas
                    </p>
                    <p className="mt-1 text-3xl font-black text-[hsl(var(--primary))]">
                      {attemptSummary.attemptsUsed}/{attemptSummary.maxAttempts}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[rgba(18,33,34,0.06)] px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(18,33,34,0.5)]">
                        Melhor score
                      </p>
                      <p className="mt-1 text-2xl font-black text-[hsl(var(--accent))]">
                        {attemptSummary.bestScore ?? "--"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[rgba(18,33,34,0.06)] px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(18,33,34,0.5)]">
                        Posição
                      </p>
                      <p className="mt-1 text-2xl font-black text-[hsl(var(--accent))]">
                        {attemptSummary.rankingPosition
                          ? `#${attemptSummary.rankingPosition}`
                          : "--"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(18,33,34,0.5)]">
                      Suas 3 jogadas
                    </p>
                    {attemptSummary.attemptHistory.map((attempt) => (
                      <div
                        key={attempt.sessionId}
                        className="rounded-2xl border border-[rgba(18,33,34,0.08)] bg-white/60 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[hsl(var(--primary))]">
                            Tentativa {attempt.attemptNumber}
                          </p>
                          <p className="text-sm font-bold text-[hsl(var(--accent))]">
                            {attempt.score ?? "Nao concluida"}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-[rgba(18,33,34,0.55)]">
                          Iniciada em {formatAttemptDate(attempt.startedAt)}
                        </p>
                        <p className="mt-1 text-xs text-[rgba(18,33,34,0.55)]">
                          Finalizada em {formatAttemptDate(attempt.finishedAt)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/ranking")}
                      className="game-pill flex flex-1 items-center justify-center gap-2"
                    >
                      <TrophyIcon className="h-4 w-4" />
                      Ver ranking
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearPlayer();
                        setLookupError(null);
                        setResolvedPlayer(null);
                        setAttemptSummary(createEmptySummary());
                        setSummaryRegistration(null);
                        setPlayerInput(player.registration);
                      }}
                      className="text-sm font-semibold text-[hsl(var(--accent))] underline underline-offset-2 transition-opacity hover:opacity-80"
                    >
                      Trocar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="game-card text-center">
                  <p className="text-base font-medium text-[rgba(18,33,34,0.55)]">
                    Pronto!
                  </p>
                  <p className="mt-1 text-xl font-bold text-[hsl(var(--primary))]">
                    {player.name}
                  </p>
                  <p className="mt-0.5 text-base text-[rgba(18,33,34,0.5)]">
                    Aluno · {player.registration}
                  </p>
                  <p className="mt-3 rounded-xl bg-[rgba(18,33,34,0.06)] px-4 py-2 text-sm font-medium text-[hsl(var(--primary))]">
                    {hasAttemptsLeft
                      ? `${attemptSummary.attemptsRemaining} de ${attemptSummary.maxAttempts} jogadas restantes`
                      : "Sem jogadas restantes"}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      clearPlayer();
                      setLookupError(null);
                      setResolvedPlayer(null);
                      setAttemptSummary(createEmptySummary());
                      setSummaryRegistration(null);
                      setPlayerInput(player.registration);
                    }}
                    className="mt-3 text-sm font-semibold text-[hsl(var(--accent))] underline underline-offset-2 transition-opacity hover:opacity-80"
                  >
                    Trocar
                  </button>
                </div>
              )
            ) : (
              <>
                <p className="mb-2 text-center text-sm font-semibold text-[rgba(255,248,230,0.72)]">
                  Aluno
                </p>
                <Input
                  id="registration"
                  inputMode="numeric"
                  placeholder="Digite sua matrícula"
                  value={playerInput}
                  onChange={(event) => {
                    setLookupError(null);
                    setPlayerInput(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleLookup();
                    }
                  }}
                  className="border-[rgba(176,148,90,0.4)] bg-[rgba(255,252,244,0.98)] text-center text-lg"
                />

                <div className="mt-3 min-h-11">
                  {lookupError ? (
                    <p className="rounded-xl bg-red-500/15 px-4 py-2.5 text-center text-base font-medium text-red-300">
                      {lookupError}
                    </p>
                  ) : (
                    <p className="rounded-xl border border-[rgba(255,248,230,0.14)] bg-[rgba(4,34,35,0.24)] px-4 py-2.5 text-center text-sm font-medium text-[rgba(255,248,230,0.78)]">
                      {instantHint}
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>

          {!player || !attemptSummary.isBlocked ? (
            <motion.button
              type="button"
              onClick={player ? handleStartGame : handleLookup}
              disabled={
                isSearching ||
                isStartingGame ||
                (!player && !canLookup) ||
                (player !== null && attemptSummary.isBlocked)
              }
              whileTap={{ scale: 0.97 }}
              className="game-btn flex min-h-14 w-full items-center justify-center py-4 text-xl"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={
                    isSearching
                      ? "searching"
                      : isStartingGame
                        ? "starting"
                        : player
                          ? "start"
                          : "enter"
                  }
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <LoaderCircleIcon className="h-5 w-5 animate-spin" />
                      Buscando...
                    </>
                  ) : isStartingGame ? (
                    <>
                      <LoaderCircleIcon className="h-5 w-5 animate-spin" />
                      Preparando...
                    </>
                  ) : player ? (
                    "Começar Jogo"
                  ) : (
                    "Entrar"
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          ) : null}
        </motion.div>
      </div>

      <PianoFooter />

      <SiteCredit />
    </main>
  );
};
