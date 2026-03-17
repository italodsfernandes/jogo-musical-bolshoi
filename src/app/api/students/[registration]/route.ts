import { NextResponse } from "next/server";

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

  return NextResponse.json({
    found: true,
    registration: student.registration,
    name: student.name,
  });
}
