"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircleIcon } from "lucide-react";
import Image from "next/image";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PianoFooter } from "@/components/piano-footer";
import { SiteCredit } from "@/components/site-credit";
import { Input } from "@/components/ui/input";
import { useGameSession } from "@/features/game/use-game-session";
import {
  normalizeRegistration,
  normalizeStudentName,
} from "@/features/game/scoring";
import { PlayerRecord, StartGamePayload } from "@/features/game/types";
import { BOLSHOI_LOGO_URL } from "@/lib/site";

const VISITOR_STORAGE_KEY = "musiquiz-visitor";

const isDigitsOnly = (value: string) => /^\d+$/.test(value.trim());

const getStoredVisitor = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { name?: string };

    if (!parsed.name) {
      return null;
    }

    return normalizeStudentName(parsed.name);
  } catch {
    return null;
  }
};

const FLOATING_NOTES = [
  { char: "♪", className: "left-[8%] top-[18%]", delay: 0 },
  { char: "♫", className: "right-[6%] top-[14%]", delay: 0.8 },
  { char: "𝄞", className: "left-[4%] top-[42%]", delay: 1.6 },
  { char: "♬", className: "right-[10%] top-[48%]", delay: 0.4 },
  { char: "♪", className: "left-[12%] bottom-[28%]", delay: 1.2 },
  { char: "♫", className: "right-[8%] bottom-[32%]", delay: 2.0 },
];

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
    state.registration && state.studentName && state.playerType
      ? {
          registration: state.registration,
          name: state.studentName,
          playerType: state.playerType,
        }
      : null,
  );
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [errorShake, setErrorShake] = useState(0);
  const [storedVisitorName, setStoredVisitorName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!initialRegistration || player) {
      return;
    }

    if (!isDigitsOnly(initialRegistration)) {
      return;
    }

    const normalized = normalizeRegistration(initialRegistration);

    if (!normalized) {
      return;
    }

    void lookupRegistration(normalized);
  }, [initialRegistration, player]);

  useEffect(() => {
    if (!state.registration || !state.playerType || player) {
      return;
    }

    setPlayerInput(
      state.playerType === "visitor" ? state.studentName : state.registration,
    );
    setResolvedPlayer({
      registration: state.registration,
      name: state.studentName,
      playerType: state.playerType,
    });
  }, [player, state.playerType, state.registration, state.studentName]);

  useEffect(() => {
    const storedVisitor = getStoredVisitor();
    setStoredVisitorName(storedVisitor ?? null);
  }, []);

  const lookupRegistration = async (value: string) => {
    const normalized = normalizeRegistration(value);

    if (!normalized) {
      setLookupError("Matrícula inválida.");
      setResolvedPlayer(null);
      setErrorShake((value) => value + 1);
      return;
    }

    setIsSearching(true);
    setLookupError(null);

    try {
      const response = await fetch(`/api/students/${normalized}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        found: boolean;
        registration?: string;
        name?: string;
      };

      if (!data.found || !data.registration || !data.name) {
        setLookupError("Matrícula não encontrada.");
        setResolvedPlayer(null);
        setErrorShake((value) => value + 1);
        return;
      }

      setResolvedPlayer({
        registration: data.registration,
        name: data.name,
        playerType: "student",
      });
    } catch {
      setLookupError("Algo deu errado. Tenta de novo.");
      setResolvedPlayer(null);
      setErrorShake((value) => value + 1);
    } finally {
      setIsSearching(false);
    }
  };

  const resolveVisitor = (value: string) => {
    const visitorName = normalizeStudentName(value);

    if (visitorName.length < 2) {
      setLookupError("Use pelo menos 2 letras no nome.");
      setResolvedPlayer(null);
      setErrorShake((stateValue) => stateValue + 1);
      return;
    }

    window.localStorage.setItem(
      VISITOR_STORAGE_KEY,
      JSON.stringify({
        name: visitorName,
      }),
    );
    setStoredVisitorName(visitorName);

    setLookupError(null);
    setResolvedPlayer({
      registration: "",
      name: visitorName,
      playerType: "visitor",
    });
  };

  const inputMode = playerInput.trim()
    ? isDigitsOnly(playerInput)
      ? "student"
      : "visitor"
    : "neutral";

  const normalizedRegistration = normalizeRegistration(playerInput);
  const normalizedVisitorName = normalizeStudentName(playerInput);
  const isStudentInputValid = normalizedRegistration.length > 0;
  const isVisitorInputValid = normalizedVisitorName.length >= 2;
  const canLookup =
    inputMode === "student"
      ? isStudentInputValid
      : inputMode === "visitor"
        ? isVisitorInputValid
        : false;

  const instantHint =
    inputMode === "neutral"
      ? "Digite matrícula ou seu nome."
      : inputMode === "student"
        ? isStudentInputValid
          ? "Aperta Enter pra validar."
          : "Digita o número da matrícula."
        : isVisitorInputValid
          ? "Bora! Você entra no ranking global."
          : "Use pelo menos 2 letras no nome.";

  const lookupActionLabel = "Entrar";

  const handleLookup = () => {
    if (inputMode === "neutral") {
      setLookupError("Digite matrícula ou seu nome.");
      setErrorShake((value) => value + 1);
      return;
    }

    startTransition(() => {
      if (inputMode === "student") {
        void lookupRegistration(playerInput);
        return;
      }

      resolveVisitor(playerInput);
    });
  };

  const handleStartGame = () => {
    if (!player) {
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
            playerName: player.name,
            playerType: player.playerType,
          }),
        });

        if (!response.ok) {
          throw new Error("Nao foi possivel iniciar o jogo.");
        }

        const payload = (await response.json()) as StartGamePayload;
        beginGame(payload);
        router.push("/game");
      } catch {
        setLookupError("Não foi possível iniciar agora. Tente de novo.");
        setErrorShake((value) => value + 1);
      } finally {
        setIsStartingGame(false);
      }
    })();
  };

  return (
    <main className="page-frame page-frame--stage game-surface page-enter">
      {/* Floating musical notes decoration */}
      <div className="floating-notes floating-notes--bright" aria-hidden="true">
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

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-6">
        {/* Logo */}
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

        {/* Title */}
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

        {/* Registration input or confirmed state */}
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
              <div className="game-card text-center">
                <p className="text-base font-medium text-[rgba(18,33,34,0.55)]">
                  Pronto!
                </p>
                <p className="mt-1 text-xl font-bold text-[hsl(var(--primary))]">
                  {player.name}
                </p>
                <p className="mt-0.5 text-base text-[rgba(18,33,34,0.5)]">
                  {player.playerType === "student"
                    ? `Aluno · ${player.registration}`
                    : "Visitante"}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    clearPlayer();
                    setLookupError(null);
                    setResolvedPlayer(null);
                    setPlayerInput(
                      player.playerType === "student"
                        ? player.registration
                        : player.name,
                    );
                  }}
                  className="mt-3 text-sm font-semibold text-[hsl(var(--accent))] underline underline-offset-2 transition-opacity hover:opacity-80"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <>
                <p className="mb-2 text-center text-sm font-semibold text-[rgba(255,248,230,0.72)]">
                  {inputMode === "student"
                    ? "Aluno"
                    : inputMode === "visitor"
                      ? "Visitante"
                      : "Como quer jogar?"}
                </p>
                <Input
                  id="registration"
                  inputMode="text"
                  placeholder="Matrícula ou seu nome"
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
                  className={`text-center text-lg ${
                    inputMode === "student"
                      ? "border-[rgba(176,148,90,0.4)] bg-[rgba(255,252,244,0.98)]"
                      : inputMode === "visitor"
                        ? "border-[rgba(255,248,230,0.3)] bg-[rgba(255,248,230,0.15)] text-[hsl(var(--ivory))] placeholder:text-[rgba(255,248,230,0.5)]"
                        : ""
                  }`}
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

                {!playerInput.trim() && storedVisitorName ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerInput(storedVisitorName);
                    }}
                    className="mt-2 w-full rounded-xl border border-[rgba(255,248,230,0.2)] bg-[rgba(255,248,230,0.08)] px-4 py-2 text-sm font-semibold text-[hsl(var(--ivory))] transition-colors hover:bg-[rgba(255,248,230,0.14)]"
                  >
                    Continuar como {storedVisitorName}
                  </button>
                ) : null}
              </>
            )}
          </motion.div>

          {/* Main CTA */}
          <motion.button
            type="button"
            onClick={player ? handleStartGame : handleLookup}
            disabled={isSearching || isStartingGame || (!player && !canLookup)}
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
                  lookupActionLabel
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </div>

      {/* Piano keys footer decoration */}
      <PianoFooter />

      <SiteCredit />
    </main>
  );
};
