import { describe, expect, it } from "vitest";

import students from "@/data/students.json";
import { findStudentByRegistration } from "@/lib/students";

describe("student lookup", () => {
  it("finds a test student by normalized registration", () => {
    expect(findStudentByRegistration("001")).toEqual({
      registration: "001",
      name: "Aluno Teste 001",
      active: true,
    });
  });

  it("finds an imported student by registration", () => {
    expect(findStudentByRegistration("5131")?.name).toBe(
      "Angelo Rafael Bernardino Nunes",
    );
  });

  it("returns null for missing registrations", () => {
    expect(findStudentByRegistration("9999999")).toBeNull();
  });

  it("loads a student base without duplicate registrations", () => {
    const registrations = students.map((student) => student.registration);

    expect(new Set(registrations).size).toBe(registrations.length);
  });
});
