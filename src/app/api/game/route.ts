import { NextResponse } from "next/server";

import {
  createGameSession,
  createNextRoundForSession,
  markRoundStartedForSession,
  submitAnswerForSession,
} from "@/features/game/session";
import {
  createSessionId,
  normalizeRegistration,
} from "@/features/game/scoring";
import {
  finalizeStudentAttempt,
  getGameSession,
  persistResultSnapshot,
  releaseReservedStudentAttempt,
  reserveStudentAttempt,
  saveGameSession,
} from "@/lib/firebase";
import { isGameClosed } from "@/lib/site";
import { findStudentByRegistration } from "@/lib/students";

const isValidCurrentRound = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1;

const requestErrorMessages = new Set([
  "Matricula de aluno invalida.",
  "Rodada fora de ordem.",
  "A rodada atual ainda nao foi respondida.",
  "Esta rodada ja foi respondida.",
  "Opcao de resposta invalida.",
  "Resposta correta indisponivel.",
  "Rodada atual indisponivel.",
  "Sessao do jogo ja finalizada.",
  "Escute o trecho antes de responder.",
]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: "start" | "play" | "answer" | "next";
      registration?: unknown;
      playerName?: unknown;
      playerType?: unknown;
      sessionId?: unknown;
      currentRound?: unknown;
      selectedOptionId?: unknown;
    };

    if (payload.action === "start") {
      if (isGameClosed()) {
        return NextResponse.json({ error: "game_closed" }, { status: 403 });
      }

      if (payload.playerType !== "student") {
        return NextResponse.json(
          { message: "Apenas alunos podem jogar." },
          { status: 400 },
        );
      }

      const normalizedRegistration = normalizeRegistration(
        typeof payload.registration === "string" ? payload.registration : "",
      );
      const student = findStudentByRegistration(normalizedRegistration);

      if (!normalizedRegistration || !student) {
        return NextResponse.json(
          { message: "Matricula de aluno invalida." },
          { status: 400 },
        );
      }

      const sessionId = createSessionId();
      const reservation = await reserveStudentAttempt({
        registration: student.registration,
        sessionId,
      });

      if (!reservation.reserved || !reservation.attempt) {
        return NextResponse.json(
          {
            message: "Limite de 3 jogadas atingido.",
            ...reservation.summary,
          },
          { status: 409 },
        );
      }

      const { session, payload: startPayload } = createGameSession({
        player: {
          registration: student.registration,
          name: student.name,
          playerType: "student",
        },
        sessionId,
      });

      try {
        await saveGameSession(session);
        return NextResponse.json(startPayload);
      } catch (error) {
        await releaseReservedStudentAttempt({
          registration: student.registration,
          sessionId,
        });
        throw error;
      }
    }

    if (payload.action === "play") {
      if (
        typeof payload.sessionId !== "string" ||
        !payload.sessionId ||
        !isValidCurrentRound(payload.currentRound)
      ) {
        return NextResponse.json(
          { message: "Inicio de rodada invalido." },
          { status: 400 },
        );
      }

      const session = await getGameSession(payload.sessionId);

      if (!session) {
        return NextResponse.json(
          { message: "Sessao de jogo invalida." },
          { status: 404 },
        );
      }

      const { session: updatedSession, roundStartedAt } =
        markRoundStartedForSession({
          session,
          currentRound: payload.currentRound,
        });

      await saveGameSession(updatedSession);
      return NextResponse.json({ roundStartedAt });
    }

    if (payload.action === "answer") {
      if (
        typeof payload.sessionId !== "string" ||
        !payload.sessionId ||
        !isValidCurrentRound(payload.currentRound) ||
        (payload.selectedOptionId !== null &&
          payload.selectedOptionId !== undefined &&
          typeof payload.selectedOptionId !== "string")
      ) {
        return NextResponse.json(
          { message: "Resposta de rodada invalida." },
          { status: 400 },
        );
      }

      const session = await getGameSession(payload.sessionId);

      if (!session) {
        return NextResponse.json(
          { message: "Sessao de jogo invalida." },
          { status: 404 },
        );
      }

      const {
        session: updatedSession,
        payload: answerPayload,
      } = submitAnswerForSession({
        session,
        currentRound: payload.currentRound,
        selectedOptionId:
          typeof payload.selectedOptionId === "string"
            ? payload.selectedOptionId
            : null,
      });

      if (!answerPayload.finished) {
        await saveGameSession(updatedSession);
        return NextResponse.json(answerPayload);
      }

      const origin = new URL(request.url).origin;
      const result = await persistResultSnapshot({
        registration: updatedSession.registration,
        studentName: updatedSession.studentName,
        playerType: updatedSession.playerType,
        score: updatedSession.score,
        sessionId: updatedSession.sessionId,
        origin,
      });
      await finalizeStudentAttempt({
        registration: updatedSession.registration,
        sessionId: updatedSession.sessionId,
        score: updatedSession.score,
        finishedAt: result.finishedAt,
      });

      await saveGameSession({
        ...updatedSession,
        currentRoundState: null,
        resultSessionId: result.sessionId,
      });

      return NextResponse.json({
        ...answerPayload,
        result,
      });
    }

    if (payload.action === "next") {
      if (
        typeof payload.sessionId !== "string" ||
        !payload.sessionId ||
        !isValidCurrentRound(payload.currentRound)
      ) {
        return NextResponse.json(
          { message: "Proxima rodada invalida." },
          { status: 400 },
        );
      }

      const session = await getGameSession(payload.sessionId);

      if (!session) {
        return NextResponse.json(
          { message: "Sessao de jogo invalida." },
          { status: 404 },
        );
      }

      const {
        session: updatedSession,
        payload: nextPayload,
      } = createNextRoundForSession({
        session,
        currentRound: payload.currentRound,
      });

      await saveGameSession(updatedSession);
      return NextResponse.json(nextPayload);
    }

    return NextResponse.json(
      { message: "Acao de jogo invalida." },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel preparar a rodada.";

    return NextResponse.json(
      {
        message,
      },
      { status: requestErrorMessages.has(message) ? 400 : 500 },
    );
  }
}
