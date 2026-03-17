import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const inputFile = process.argv[2] ?? path.resolve(process.cwd(), "students.csv");
const outputFile =
  process.argv[3] ?? path.resolve(process.cwd(), "src/data/students.json");

const csv = readFileSync(inputFile, "utf8").trim();
const [headerLine, ...lines] = csv.split(/\r?\n/);
const headers = headerLine.split(",").map((header) => header.trim());

const entries = lines
  .filter(Boolean)
  .map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const record = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );

    return {
      registration: record.registration,
      name: record.name,
      active: record.active !== "false",
    };
  });

writeFileSync(outputFile, `${JSON.stringify(entries, null, 2)}\n`);

console.log(`Imported ${entries.length} students into ${outputFile}`);
