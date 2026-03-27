import students from "@/data/students.json";
import {
  normalizeRegistration,
  normalizeStudentName,
} from "@/features/game/scoring";
import { StudentRecord } from "@/features/game/types";

const STUDENT_MAP = new Map(
  (students as StudentRecord[]).map((student) => [
    normalizeRegistration(student.registration),
    {
      ...student,
      registration: normalizeRegistration(student.registration),
      name: normalizeStudentName(student.name),
    },
  ])
);

export const findStudentByRegistration = (registration: string) => {
  const normalized = normalizeRegistration(registration);
  const student = STUDENT_MAP.get(normalized);

  if (!student || !student.active) {
    return null;
  }

  return student;
};

export const getAllStudents = () => Array.from(STUDENT_MAP.values());
