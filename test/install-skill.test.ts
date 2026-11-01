// @vitest-environment node

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));

function installInto(home: string, args: readonly string[] = []) {
  return new Promise<{ readonly code: number; readonly stdout: string; readonly stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/install-skill.mjs", ...args], {
      cwd: root,
      env: { ...process.env, HOME: home, USERPROFILE: home },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

describe("postinstall skill", () => {
  let home = "";

  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), "foley-skill-"));
  });

  afterEach(async () => {
    await rm(home, { recursive: true, force: true });
  });

  it("copies the skill into ~/.agents/skills and says where it landed", async () => {
    const result = await installInto(home);
    const installed = await readFile(join(home, ".agents", "skills", "foley", "SKILL.md"), "utf8");
    const shipped = await readFile(join(root, "skills", "foley", "SKILL.md"), "utf8");

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(installed).toBe(shipped);
    expect(result.stdout).toContain(join(home, ".agents", "skills", "foley"));
    expect(result.stdout).toContain("navigate this package");
  });

  it("stays quiet when the installed skill is already current", async () => {
    await installInto(home);
    const again = await installInto(home, ["--if-changed"]);
    expect(again.code).toBe(0);
    expect(again.stdout).toBe("");
  });
});
