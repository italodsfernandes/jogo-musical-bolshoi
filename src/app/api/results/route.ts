import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Persistencia direta de resultado desativada. Use o fluxo validado em /api/game.",
    },
    { status: 410 },
  );
}
