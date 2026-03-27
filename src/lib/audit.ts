import {
  BestScoreEntry,
  StudentAttemptEntry,
  StudentStatsRecord,
} from "@/features/game/types";
import { MAX_STUDENT_ATTEMPTS, getAllStudentStats, getLeaderboard } from "@/lib/firebase";
import { getAllStudents } from "@/lib/students";

export interface AuditStudentRow {
  registration: string;
  name: string;
  active: boolean | null;
  attemptsUsed: number;
  maxAttempts: number;
  bestScore: number | null;
  rankingPosition: number | null;
  attemptHistory: StudentAttemptEntry[];
}

const sortAttemptHistory = (stats: StudentStatsRecord | undefined) =>
  stats
    ? Object.values(stats.attemptsBySessionId).sort(
        (first, second) =>
          first.attemptNumber - second.attemptNumber ||
          first.startedAt - second.startedAt,
      )
    : [];

const compareAuditRows = (first: AuditStudentRow, second: AuditStudentRow) => {
  if (first.rankingPosition !== null && second.rankingPosition !== null) {
    return first.rankingPosition - second.rankingPosition;
  }

  if (first.rankingPosition !== null) {
    return -1;
  }

  if (second.rankingPosition !== null) {
    return 1;
  }

  if (first.attemptsUsed !== second.attemptsUsed) {
    return second.attemptsUsed - first.attemptsUsed;
  }

  return first.name.localeCompare(second.name, "pt-BR", {
    sensitivity: "base",
  });
};

export const getAuditRows = async (): Promise<AuditStudentRow[]> => {
  const [students, statsByRegistration, leaderboard] = await Promise.all([
    getAllStudents(),
    getAllStudentStats(),
    getLeaderboard("student"),
  ]);

  const studentsByRegistration = new Map(
    students.map((student) => [student.registration, student]),
  );
  const bestScoresByRegistration = new Map(
    leaderboard.map((entry, index) => [
      entry.registration,
      {
        entry,
        rankingPosition: index + 1,
      },
    ]),
  );
  const registrations = new Set<string>([
    ...studentsByRegistration.keys(),
    ...Object.keys(statsByRegistration),
    ...bestScoresByRegistration.keys(),
  ]);

  return Array.from(registrations)
    .map((registration) => {
      const student = studentsByRegistration.get(registration) ?? null;
      const stats = statsByRegistration[registration];
      const bestScore = bestScoresByRegistration.get(registration) as
        | {
            entry: BestScoreEntry;
            rankingPosition: number;
          }
        | undefined;

      return {
        registration,
        name:
          student?.name ??
          bestScore?.entry.studentName ??
          `Aluno ${registration}`,
        active: student?.active ?? null,
        attemptsUsed: stats?.attemptsUsed ?? 0,
        maxAttempts: stats?.maxAttempts ?? MAX_STUDENT_ATTEMPTS,
        bestScore: bestScore?.entry.score ?? null,
        rankingPosition: bestScore?.rankingPosition ?? null,
        attemptHistory: sortAttemptHistory(stats),
      };
    })
    .sort(compareAuditRows);
};
