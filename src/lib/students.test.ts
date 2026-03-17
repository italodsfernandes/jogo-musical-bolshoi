import { describe, expect, it } from "vitest";

import { findStudentByRegistration } from "@/lib/students";

describe("student lookup", () => {
  it("finds a student by normalized registration", () => {
    expect(findStudentByRegistration("001")?.name).toBe("Jogador 1");
  });

  it("returns null for missing registrations", () => {
    expect(findStudentByRegistration("9999999")).toBeNull();
  });
});
