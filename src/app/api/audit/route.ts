import { NextResponse } from "next/server";

import { getAuditRows } from "@/lib/audit";

export async function GET() {
  const rows = await getAuditRows();

  return NextResponse.json(rows, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
