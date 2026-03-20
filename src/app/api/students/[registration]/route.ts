import { NextResponse } from "next/server";

import { getStudentAttemptSummary } from "@/lib/firebase";
import { findStudentByRegistration } from "@/lib/students";

interface RouteContext {
  params: Promise<{
    registration: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { registration } = await context.params;
  const student = findStudentByRegistration(registration);

  if (!student) {
    return NextResponse.json({ found: false });
  }

  const summary = await getStudentAttemptSummary(student.registration);

  return NextResponse.json({
    found: true,
    registration: student.registration,
    name: student.name,
    ...summary,
  });
}
