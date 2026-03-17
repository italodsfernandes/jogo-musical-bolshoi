import { NextResponse } from "next/server";

import { normalizeRegistration } from "@/features/game/scoring";
import { PlayerType } from "@/features/game/types";
import { persistResultSnapshot } from "@/lib/firebase";
import { findStudentByRegistration } from "@/lib/students";

const isPlayerType = (value: unknown): value is PlayerType =>
  value === "student" || value === "visitor";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      registration: string;
      studentName: string;
      playerType: PlayerType;
      score: number;
      sessionId: string;
    };

    if (!isPlayerType(payload.playerType)) {
      return NextResponse.json(
        { message: "Tipo de jogador invalido." },
        { status: 400 },
      );
    }

    if (payload.playerType === "student") {
      const normalizedRegistration = normalizeRegistration(payload.registration);
      const student = findStudentByRegistration(normalizedRegistration);

      if (!normalizedRegistration || !student) {
        return NextResponse.json(
          { message: "Matricula de aluno invalida." },
          { status: 400 },
        );
      }
    }

    if (
      payload.playerType === "visitor" &&
      !payload.registration.trim().toLowerCase().startsWith("visitor-")
    ) {
      return NextResponse.json(
        { message: "Identificador de visitante invalido." },
        { status: 400 },
      );
    }

    const origin = new URL(request.url).origin;
    const result = await persistResultSnapshot({
      registration: payload.registration,
      studentName: payload.studentName,
      playerType: payload.playerType,
      score: payload.score,
      sessionId: payload.sessionId,
      origin,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel salvar o resultado.",
      },
      { status: 500 }
    );
  }
}
