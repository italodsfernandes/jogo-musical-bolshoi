import { buildQuestionOrder, createRoundState, toPublicRoundData } from "@/features/game/rounds";
import {
  calculateRoundBreakdown,
  createSessionId,
} from "@/features/game/scoring";
import {
  GameSessionRecord,
  NextRoundPayload,
  PlayerRecord,
  StartGamePayload,
  SubmitAnswerPayload,
} from "@/features/game/types";

const toFiniteNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const assertActiveSession = (session: GameSessionRecord) => {
  if (session.status !== "active") {
    throw new Error("Sessao do jogo ja finalizada.");
  }

  if (!session.currentRoundState) {
    throw new Error("Rodada atual indisponivel.");
  }
};

export const createGameSession = ({
  player,
  sessionId = createSessionId(),
  now = Date.now(),
}: {
  player: PlayerRecord;
  sessionId?: string;
  now?: number;
}): {
  session: GameSessionRecord;
  payload: StartGamePayload;
} => {
  void now;
  const questionOrder = buildQuestionOrder();
  const currentRound = 1;
  const roundState = createRoundState(questionOrder, currentRound);

  if (!roundState) {
    throw new Error("Nao foi possivel montar a primeira rodada.");
  }

  const session: GameSessionRecord = {
    sessionId,
    registration: player.registration,
    studentName: player.name,
    playerType: player.playerType,
    questionOrder,
    totalRounds: questionOrder.length,
    currentRound,
    currentRoundState: roundState,
    score: 0,
    streak: 0,
    status: "active",
    finishedAt: null,
    resultSessionId: null,
  };

  return {
    session,
    payload: {
      sessionId,
      totalRounds: questionOrder.length,
      currentRound,
      roundData: toPublicRoundData(roundState),
      player,
    },
  };
};

export const createNextRoundForSession = ({
  session,
  currentRound,
}: {
  session: GameSessionRecord;
  currentRound: number;
}): {
  session: GameSessionRecord;
  payload: NextRoundPayload;
} => {
  assertActiveSession(session);

  if (session.currentRound !== currentRound) {
    throw new Error("Rodada fora de ordem.");
  }

  if (!session.currentRoundState?.answeredAt) {
    throw new Error("A rodada atual ainda nao foi respondida.");
  }

  const nextRound = session.currentRound + 1;
  const nextRoundState = createRoundState(session.questionOrder, nextRound);

  if (!nextRoundState) {
    return {
      session,
      payload: {
        currentRound: nextRound,
        roundData: null,
        finished: true,
      },
    };
  }

  return {
    session: {
      ...session,
      currentRound: nextRound,
      currentRoundState: nextRoundState,
    },
    payload: {
      currentRound: nextRound,
      roundData: toPublicRoundData(nextRoundState),
      finished: false,
    },
  };
};

export const markRoundStartedForSession = ({
  session,
  currentRound,
  now = Date.now(),
}: {
  session: GameSessionRecord;
  currentRound: number;
  now?: number;
}) => {
  assertActiveSession(session);

  if (session.currentRound !== currentRound) {
    throw new Error("Rodada fora de ordem.");
  }

  const roundState = session.currentRoundState;

  if (!roundState) {
    throw new Error("Rodada atual indisponivel.");
  }

  if (roundState.answeredAt) {
    throw new Error("Esta rodada ja foi respondida.");
  }

  if (roundState.roundStartedAt !== null) {
    return {
      session,
      roundStartedAt: roundState.roundStartedAt,
    };
  }

  return {
    session: {
      ...session,
      currentRoundState: {
        ...roundState,
        roundStartedAt: now,
      },
    },
    roundStartedAt: now,
  };
};

export const submitAnswerForSession = ({
  session,
  currentRound,
  selectedOptionId,
  now = Date.now(),
}: {
  session: GameSessionRecord;
  currentRound: number;
  selectedOptionId: string | null;
  now?: number;
}): {
  session: GameSessionRecord;
  payload: SubmitAnswerPayload;
} => {
  assertActiveSession(session);

  if (session.currentRound !== currentRound) {
    throw new Error("Rodada fora de ordem.");
  }

  const roundState = session.currentRoundState;

  if (!roundState) {
    throw new Error("Rodada atual indisponivel.");
  }

  if (roundState.answeredAt) {
    throw new Error("Esta rodada ja foi respondida.");
  }

  const correctOption = roundState.options.find(
    (option) => option.optionId === roundState.answerKey,
  );

  if (!correctOption) {
    throw new Error("Resposta correta indisponivel.");
  }

  const selectedOption =
    selectedOptionId === null
      ? null
      : roundState.options.find((option) => option.optionId === selectedOptionId) ??
        null;

  if (selectedOptionId !== null && !selectedOption) {
    throw new Error("Opcao de resposta invalida.");
  }

  const isCorrect = selectedOptionId !== null && selectedOptionId === roundState.answerKey;
  if (selectedOptionId !== null && roundState.roundStartedAt === null) {
    throw new Error("Escute o trecho antes de responder.");
  }

  const elapsedMs =
    roundState.roundStartedAt === null
      ? 0
      : Math.max(0, now - roundState.roundStartedAt);
  const currentScore = toFiniteNumber(session.score, 0);
  const currentStreak = toFiniteNumber(session.streak, 0);
  const currentSessionRound = toFiniteNumber(session.currentRound, currentRound);
  const totalRounds = toFiniteNumber(session.totalRounds, currentSessionRound);
  const breakdown = calculateRoundBreakdown({
    isCorrect,
    elapsedMs,
    currentStreak,
  });
  const nextScore = currentScore + breakdown.total;
  const nextStreak = isCorrect ? currentStreak + 1 : 0;
  const finished = currentSessionRound >= totalRounds;
  const status =
    selectedOptionId === null ? "skipped" : isCorrect ? "correct" : "wrong";

  return {
    session: {
      ...session,
      score: nextScore,
      streak: nextStreak,
      status: finished ? "finished" : "active",
      finishedAt: finished ? now : null,
      currentRoundState: {
        ...roundState,
        answeredAt: now,
        selectedOptionId,
      },
    },
    payload: {
      currentRound: currentSessionRound,
      score: nextScore,
      answerResult: {
        status,
        correctComposer: correctOption.composer,
        correctMusic: correctOption.music,
        selectedComposer: selectedOption?.composer ?? null,
        selectedMusic: selectedOption?.music ?? null,
        breakdown,
        streak: nextStreak,
      },
      finished,
      result: null,
    },
  };
};
