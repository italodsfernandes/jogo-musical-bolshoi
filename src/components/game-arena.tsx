"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { LoaderCircleIcon, PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { SiteCredit } from "@/components/site-credit";
import { Button } from "@/components/ui/button";
import { calculateRoundBreakdown } from "@/features/game/scoring";
import { useHowlerPlayer } from "@/features/game/use-howler-player";
import { useGameSession } from "@/features/game/use-game-session";
import {
  NextRoundPayload,
  PersistedResultResponse,
  QuestionOption,
} from "@/features/game/types";

const REVEAL_DELAY_MS = 2300;

const FLOATING_NOTES = [
  { char: "♪", className: "left-[5%] top-[20%]", delay: 0 },
  { char: "♫", className: "right-[5%] top-[16%]", delay: 0.6 },
  { char: "𝄞", className: "left-[8%] bottom-[36%]", delay: 1.2 },
  { char: "♬", className: "right-[8%] bottom-[30%]", delay: 1.8 },
  { char: "♪", className: "left-[16%] top-[50%]", delay: 0.3 },
  { char: "𝄞", className: "right-[14%] top-[52%]", delay: 1.5 },
];

export const GameArena = () => {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const {
    isHydrated,
    state,
    actions: { submitAnswer, advanceFlow, markSaved, resetGame },
  } = useGameSession();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [roundAdvanceError, setRoundAdvanceError] = useState<string | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [isScoreSparkling, setIsScoreSparkling] = useState(false);
  const [roundStatuses, setRoundStatuses] = useState<
    Array<"correct" | "wrong" | null>
  >([]);
  const prevScoreRef = useRef(0);
  const registeredRevealRoundRef = useRef<number | null>(null);

  const currentQuestion = state.currentRoundData?.currentQuestion ?? null;
  const options = state.currentRoundData?.options ?? [];
  const player = useHowlerPlayer(currentQuestion);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!state.registration || !state.studentName) {
      router.replace("/");
    }
  }, [isHydrated, router, state.registration, state.studentName]);

  useEffect(() => {
    if (state.hasSavedScore && state.resultSessionId) {
      router.replace(`/resultado/${state.resultSessionId}`);
    }
  }, [router, state.hasSavedScore, state.resultSessionId]);

  useEffect(() => {
    if (
      reduceMotion ||
      state.phase !== "revealed" ||
      state.answerResult?.status !== "correct"
    ) {
      return;
    }

    void confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 30,
      ticks: 120,
      origin: { y: 0.7 },
      colors: ["#B0945A", "#D4AF37", "#FFD700", "#0A4A4A"],
    });
  }, [reduceMotion, state.answerResult?.status, state.phase]);

  useEffect(() => {
    if (!state.totalRounds) {
      setRoundStatuses([]);
      registeredRevealRoundRef.current = null;
      return;
    }

    setRoundStatuses((current) => {
      if (current.length === state.totalRounds) {
        return current;
      }

      return Array.from(
        { length: state.totalRounds },
        (_, index) => current[index] ?? null,
      );
    });
  }, [state.totalRounds]);

  useEffect(() => {
    if (state.phase !== "revealed" || !state.answerResult) {
      return;
    }

    const revealStatus = state.answerResult.status;

    if (registeredRevealRoundRef.current === state.currentRound) {
      return;
    }

    registeredRevealRoundRef.current = state.currentRound;

    setRoundStatuses((current) => {
      const next = [...current];
      const currentIndex = Math.max(0, state.currentRound - 1);
      next[currentIndex] = revealStatus;
      return next;
    });
  }, [state.answerResult, state.currentRound, state.phase]);

  useEffect(() => {
    if (reduceMotion || state.phase !== "finished" || state.score <= 4500) {
      return;
    }

    void confetti({
      particleCount: 140,
      spread: 90,
      startVelocity: 42,
      ticks: 150,
      origin: { y: 0.65 },
      colors: ["#B0945A", "#D4AF37", "#FFD700", "#0A4A4A"],
    });
  }, [reduceMotion, state.phase, state.score]);

  useEffect(() => {
    const from = prevScoreRef.current;
    const to = state.score;

    if (from === to) {
      return;
    }

    prevScoreRef.current = to;
    setIsScoreSparkling(true);

    if (reduceMotion) {
      setDisplayScore(to);
      const sparkleTimer = window.setTimeout(() => {
        setIsScoreSparkling(false);
      }, 280);

      return () => window.clearTimeout(sparkleTimer);
    }

    const duration = 420;
    const startTime = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    frame = window.requestAnimationFrame(animate);

    const sparkleTimer = window.setTimeout(() => {
      setIsScoreSparkling(false);
    }, 560);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(sparkleTimer);
    };
  }, [reduceMotion, state.score]);

  useEffect(() => {
    const shouldLockScroll =
      state.phase === "playing" || state.phase === "revealed";

    if (shouldLockScroll) {
      document.body.classList.add("overflow-hidden");
      return () => {
        document.body.classList.remove("overflow-hidden");
      };
    }

    document.body.classList.remove("overflow-hidden");

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "revealed") {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setRoundAdvanceError(null);

        try {
          const response = await fetch("/api/game", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "next",
              roundCursor: state.roundCursor,
            }),
          });

          if (!response.ok) {
            throw new Error("Nao foi possivel carregar a proxima rodada.");
          }

          const payload = (await response.json()) as NextRoundPayload;

          if (!cancelled) {
            advanceFlow(payload);
          }
        } catch {
          if (!cancelled) {
            setRoundAdvanceError("Não conseguimos carregar a próxima rodada.");
          }
        }
      })();
    }, REVEAL_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [advanceFlow, state.phase, state.roundCursor]);

  useEffect(() => {
    if (state.phase === "playing") {
      setRoundAdvanceError(null);
    }
  }, [state.phase]);

  useEffect(() => {
    if (
      state.phase !== "finished" ||
      state.hasSavedScore ||
      !state.registration ||
      !state.studentName ||
      !state.playerType ||
      !state.sessionId
    ) {
      return;
    }

    let cancelled = false;

    const persistResult = async () => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await fetch("/api/results", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            registration: state.registration,
            studentName: state.studentName,
            playerType: state.playerType,
            score: state.score,
            sessionId: state.sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error("Nao foi possivel persistir o resultado.");
        }

        const result = (await response.json()) as PersistedResultResponse;

        if (cancelled) {
          return;
        }

        markSaved(result.sessionId);
        router.replace(`/resultado/${result.sessionId}`);
      } catch {
        if (!cancelled) {
          setSaveError("Não conseguimos salvar. Tente de novo.");
        }
      } finally {
        if (!cancelled) {
          setIsSaving(false);
        }
      }
    };

    void persistResult();

    return () => {
      cancelled = true;
    };
  }, [
    markSaved,
    router,
    state.hasSavedScore,
    state.phase,
    state.playerType,
    state.registration,
    state.score,
    state.sessionId,
    state.studentName,
  ]);

  if (!isHydrated || !currentQuestion) {
    return (
      <main className="page-frame game-surface" aria-busy="true">
        <div className="game-bar">
          <span className="game-pill--light h-11 w-36 animate-pulse rounded-full" />
          <span className="game-pill--light h-11 w-28 animate-pulse rounded-full" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-4">
          <div className="game-card--gold relative z-10 flex min-h-[280px] w-full max-w-sm flex-col items-center px-6 py-8 text-center">
            <div className="mb-4 h-14 w-48 animate-pulse rounded-xl bg-[rgba(176,148,90,0.2)]" />
            <div className="h-28 w-28 animate-pulse rounded-full bg-[rgba(176,148,90,0.2)]" />
            <div className="mt-5 h-3 w-full max-w-[70%] animate-pulse rounded-full bg-[rgba(176,148,90,0.2)]" />
          </div>

          <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[72px] animate-pulse rounded-xl bg-[rgba(176,148,90,0.2)]"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const currentTimePercent =
    player.durationMs > 0
      ? (player.currentTimeMs / player.durationMs) * 100
      : 0;
  const isAudioLoading =
    state.phase === "playing" && !player.isReady && !player.hasLoadError;
  const canToggleAudio = state.phase === "playing" && player.isReady;

  const handleAnswer = (selectedOption: QuestionOption) => {
    if (state.phase !== "playing" || !currentQuestion) {
      return;
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    player.stop();

    const breakdown = calculateRoundBreakdown({
      isCorrect: selectedOption.optionId === currentQuestion.answerKey,
      elapsedMs: player.currentTimeMs,
      hasReplayed: player.playCount > 1,
      currentStreak: state.streak,
    });

    submitAnswer({
      selectedOption,
      breakdown,
    });
  };

  const OPTION_IDLE_CLASSES = [
    "game-btn--opt-a",
    "game-btn--opt-b",
    "game-btn--opt-c",
    "game-btn--opt-d",
  ] as const;

  const getOptionStyle = (option: QuestionOption, index: number) => {
    if (state.phase !== "revealed" || !state.answerResult) {
      return OPTION_IDLE_CLASSES[index % 4] ?? "game-btn--outline";
    }

    if (
      option.composer === state.answerResult.correctComposer &&
      option.music === state.answerResult.correctMusic
    ) {
      return "game-btn--correct";
    }

    if (
      option.composer === state.answerResult.selectedComposer &&
      option.music === state.answerResult.selectedMusic &&
      state.answerResult.status === "wrong"
    ) {
      return "game-btn--wrong";
    }

    return "game-btn--outline opacity-40";
  };

  const progressDots = Array.from({ length: state.totalRounds }, (_, index) => {
    const currentIndex = Math.max(0, state.currentRound - 1);
    const isPast = index < currentIndex;
    const isCurrent = index === currentIndex;
    const status = roundStatuses[index];

    if (isPast) {
      if (status === "wrong") {
        return "bg-[hsl(var(--destructive))]";
      }

      return "bg-[hsl(var(--brass))]";
    }

    if (
      isCurrent &&
      state.phase === "revealed" &&
      state.answerResult?.status === "wrong"
    ) {
      return "bg-[hsl(var(--destructive))]";
    }

    if (isCurrent) {
      return "bg-[hsl(var(--primary))]";
    }

    return "bg-[rgba(4,34,35,0.16)]";
  });

  return (
    <main className="page-frame game-surface page-enter">
      {/* Top bar: round + score */}
      <div className="game-bar gap-3">
        <span className="game-pill--light shrink-0">
          Rodada {state.currentRound}/{state.totalRounds}
        </span>
        <span
          className={`game-pill--light shrink-0 ${isScoreSparkling ? "score-sparkle" : ""}`}
        >
          Pontos: {displayScore}
        </span>
      </div>

      <div className="mb-1 flex w-full gap-1.5" aria-hidden="true">
        {progressDots.map((dotClass, index) => (
          <span
            key={index}
            className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${dotClass} ${
              index === state.currentRound - 1 && state.phase === "playing"
                ? "animate-pulse"
                : ""
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        {/* Question card with play button */}
        <div className="relative w-full max-w-sm">
          {/* Floating notes around the card */}
          <div className="floating-notes" aria-hidden="true">
            {FLOATING_NOTES.map((note, i) => (
              <span
                key={i}
                className={note.className}
                style={{ animationDelay: `${note.delay}s` }}
              >
                {note.char}
              </span>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-card--gold relative z-10 flex min-h-[240px] sm:min-h-[280px] flex-col items-center px-5 py-6 sm:px-6 sm:py-8 text-center"
          >
            {state.phase === "revealed" && !reduceMotion ? (
              <div className="reveal-countdown" aria-hidden="true" />
            ) : null}

            {/* Question text */}
            <AnimatePresence mode="popLayout">
              {state.phase === "revealed" && state.answerResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 min-h-[110px]"
                >
                  <p className="text-3xl">
                    {state.answerResult.status === "correct" ? "🎉" : "😅"}
                  </p>
                  <p className="mt-2 text-lg font-bold text-[hsl(var(--primary))]">
                    {state.answerResult.status === "correct"
                      ? `Bravo! +${state.answerResult.breakdown.total} pts`
                      : `Era ${state.answerResult.correctComposer}`}
                  </p>
                  <p className="mt-1 text-sm text-[rgba(18,33,34,0.7)]">
                    {state.answerResult.correctMusic}
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  key="question"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 min-h-[96px] sm:min-h-[110px] text-base sm:text-lg font-bold text-[hsl(var(--primary))]"
                >
                  Qual é essa
                  <br />
                  música?
                </motion.p>
              )}
            </AnimatePresence>

            {/* Play button */}
            <motion.button
              type="button"
              onClick={() => player.toggle(canToggleAudio)}
              disabled={!canToggleAudio}
              aria-label={
                state.phase !== "playing"
                  ? "Áudio bloqueado até a próxima rodada"
                  : player.hasLoadError
                    ? "Áudio indisponível para esta rodada"
                    : isAudioLoading
                      ? "Carregando áudio"
                      : player.isPlaying
                        ? "Pausar"
                        : "Tocar"
              }
              whileTap={{ scale: 0.93 }}
              className={`relative flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-[hsl(var(--brass))] bg-white shadow-lg ${
                player.isPlaying ? "pulse-ring" : ""
              } ${
                !player.hasStarted && state.phase === "playing"
                  ? "play-aura"
                  : ""
              } ${
                !canToggleAudio
                  ? "cursor-not-allowed opacity-70 saturate-75"
                  : ""
              }`}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-[hsl(40_52%_58%)] to-[hsl(38_52%_46%)] text-white shadow-md">
                {isAudioLoading ? (
                  <LoaderCircleIcon className="h-9 w-9 animate-spin" />
                ) : player.isPlaying ? (
                  <PauseIcon className="h-9 w-9" />
                ) : (
                  <PlayIcon className="ml-1 h-9 w-9" />
                )}
              </div>
            </motion.button>

            {/* Time progress */}
            <div className="mt-5 w-full max-w-[70%]">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(currentTimePercent || 0, 100)}%`,
                  }}
                />
              </div>
            </div>

            <p
              className={`mt-3 min-h-6 text-sm font-bold text-[hsl(var(--accent))] transition-opacity duration-200 ${
                state.streak > 1 ? "opacity-100" : "opacity-0"
              }`}
            >
              {state.streak > 1 ? (
                <>🔥 Combo x{state.streak}</>
              ) : (
                <span aria-hidden="true">&nbsp;</span>
              )}
            </p>
          </motion.div>
        </div>

        <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-3">
          {options.map((option, index) => (
            <motion.button
              key={option.optionId}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.25 }}
              onClick={() => handleAnswer(option)}
              disabled={state.phase !== "playing" || !player.hasStarted}
              tabIndex={
                state.phase !== "playing" || !player.hasStarted ? -1 : 0
              }
              aria-label={`Responder: ${option.music} — ${option.composer}`}
              whileTap={{ scale: 0.95 }}
              className={`game-btn game-btn--small ${getOptionStyle(option, index)}`}
            >
              <span className="block text-sm font-bold leading-tight">
                {option.music}
              </span>
              <span className="mt-0.5 block text-xs font-normal opacity-80 leading-tight">
                {option.composer}
              </span>
            </motion.button>
          ))}
        </div>

        <p
          className={`mt-3 min-h-6 text-base text-[rgba(18,33,34,0.58)] transition-opacity duration-200 ${
            state.phase === "revealed" ||
            (state.phase === "playing" &&
              (player.hasLoadError || !player.isReady || !player.hasStarted))
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          {state.phase === "revealed" ? (
            roundAdvanceError ?? "Próxima..."
          ) : state.phase === "playing" && player.hasLoadError ? (
            "Não foi possível carregar este trecho."
          ) : state.phase === "playing" && !player.isReady ? (
            "Carregando áudio..."
          ) : state.phase === "playing" && !player.hasStarted ? (
            "Ouça antes de responder"
          ) : (
            <span aria-hidden="true">&nbsp;</span>
          )}
        </p>

        {/* Saving/error state */}
        {(isSaving || saveError) && state.phase === "finished" && (
          <div className="fixed inset-x-0 bottom-6 z-20 mx-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white/90 p-4 text-center shadow-lg backdrop-blur-sm">
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <LoaderCircleIcon className="h-5 w-5 animate-spin text-[hsl(var(--accent))]" />
                <span className="text-base font-medium">Salvando...</span>
              </div>
            ) : saveError ? (
              <div>
                <p className="text-base font-medium text-red-600">
                  {saveError}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setSaveError(null);
                    resetGame();
                    router.push("/");
                  }}
                >
                  Voltar ao inicio
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <SiteCredit />
    </main>
  );
};
