import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { decryptAudioToken } from "@/features/game/rounds";

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { token } = await context.params;
  const payload = decryptAudioToken(token);

  if (!payload) {
    return NextResponse.json({ message: "Token de audio invalido." }, { status: 400 });
  }

  const normalizedAudioPath = path.posix.normalize(payload.audioSrc);

  if (!normalizedAudioPath.startsWith("/audio/")) {
    return NextResponse.json({ message: "Audio nao autorizado." }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), "public", normalizedAudioPath);

  try {
    const file = await readFile(filePath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel carregar o audio." },
      { status: 404 },
    );
  }
}
