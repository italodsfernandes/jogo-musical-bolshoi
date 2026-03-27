"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { GameArena } from "@/components/game-arena";
import { GAME_CUTOFF } from "@/lib/site";
import { useGameSession } from "@/features/game/use-game-session";

export const GamePageGate = ({
  initialClosed,
}: {
  initialClosed: boolean;
}) => {
  const router = useRouter();
  const {
    state: { sessionId },
  } = useGameSession();
  const [isClosed, setIsClosed] = useState(initialClosed);

  useEffect(() => {
    if (isClosed) {
      return;
    }

    const remainingMs = GAME_CUTOFF - Date.now();

    if (remainingMs <= 0) {
      setIsClosed(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsClosed(true);
    }, remainingMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isClosed]);

  useEffect(() => {
    if (isClosed && !sessionId) {
      router.replace("/");
    }
  }, [isClosed, router, sessionId]);

  if (isClosed && !sessionId) {
    return null;
  }

  return <GameArena />;
};
