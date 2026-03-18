import { NextResponse } from "next/server";

import {
  createNextRoundPayload,
  createStartGamePayload,
} from "@/features/game/rounds";

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: "start" | "next";
      roundCursor?: unknown;
    };

    if (payload.action === "start") {
      return NextResponse.json(createStartGamePayload());
    }

    if (payload.action === "next") {
      if (typeof payload.roundCursor !== "string" || !payload.roundCursor) {
        return NextResponse.json(
          { message: "Cursor da rodada invalido." },
          { status: 400 },
        );
      }

      const nextRoundPayload = createNextRoundPayload(payload.roundCursor);

      if (!nextRoundPayload) {
        return NextResponse.json(
          { message: "Cursor da rodada invalido." },
          { status: 400 },
        );
      }

      return NextResponse.json(nextRoundPayload);
    }

    return NextResponse.json(
      { message: "Acao de jogo invalida." },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel preparar a rodada.",
      },
      { status: 500 },
    );
  }
}
