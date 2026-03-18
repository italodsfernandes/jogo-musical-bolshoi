import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createGameSession,
  createNextRoundForSession,
  markRoundStartedForSession,
  submitAnswerForSession,
} from "@/features/game/session";
import {
  normalizeRegistration,
  normalizeStudentName,
} from "@/features/game/scoring";
import { PlayerType } from "@/features/game/types";
import {
  getGameSession,
  persistResultSnapshot,
  saveGameSession,
} from "@/lib/firebase";
import { findStudentByRegistration } from "@/lib/students";

const VISITOR_COOKIE_NAME = "musiquiz-visitor-id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const isPlayerType = (value: unknown): value is PlayerType =>
  value === "student" || value === "visitor";

const isValidCurrentRound = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1;

const createVisitorRegistration = () =>
  `visitor-${randomUUID().replace(/-/g, "").slice(0, 12)}`;

const requestErrorMessages = new Set([
  "Matricula de aluno invalida.",
  "Use pelo menos 2 letras no nome.",
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
      if (!isPlayerType(payload.playerType)) {
        return NextResponse.json(
          { message: "Tipo de jogador invalido." },
          { status: 400 },
        );
      }

      const cookieStore = await cookies();

      if (payload.playerType === "student") {
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

        const { session, payload: startPayload } = createGameSession({
          player: {
            registration: student.registration,
            name: student.name,
            playerType: "student",
          },
        });

        await saveGameSession(session);
        return NextResponse.json(startPayload);
      }

      const visitorName = normalizeStudentName(
        typeof payload.playerName === "string" ? payload.playerName : "",
      );

      if (visitorName.length < 2) {
        return NextResponse.json(
          { message: "Use pelo menos 2 letras no nome." },
          { status: 400 },
        );
      }

      const storedVisitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value ?? "";
      const visitorRegistration = storedVisitorId.startsWith("visitor-")
        ? storedVisitorId
        : createVisitorRegistration();

      const { session, payload: startPayload } = createGameSession({
        player: {
          registration: visitorRegistration,
          name: visitorName,
          playerType: "visitor",
        },
      });

      await saveGameSession(session);

      const response = NextResponse.json(startPayload);
      response.cookies.set({
        name: VISITOR_COOKIE_NAME,
        value: visitorRegistration,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: VISITOR_COOKIE_MAX_AGE,
      });

      return response;
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
