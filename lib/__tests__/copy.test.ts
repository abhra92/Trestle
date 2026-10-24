import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = ["app", "components", "lib"].map((folder) => new URL(`../../${folder}/`, import.meta.url));
const TEXT_FILE = /\.(ts|tsx|css)$/;
const SKIP = /__tests__|[\\/]node_modules[\\/]/;
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function walk(folder: URL): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(folder, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const path = join(entry.parentPath, entry.name);
    if (!TEXT_FILE.test(path) || SKIP.test(path)) continue;
    files.push(path);
  }
  return files;
}

const files = ROOTS.flatMap((folder) => walk(folder));

describe("written copy", () => {
  it("finds source files to check", () => {
    expect(files.length).toBeGreaterThan(15);
  });

  it("uses no em dash in any source file", () => {
    const offenders = files.filter((file) => readFileSync(file, "utf8").includes("\u2014"));
    expect(offenders).toEqual([]);
  });

  it("uses no decorative emoji in any source file", () => {
    const offenders = files.filter((file) => EMOJI.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
