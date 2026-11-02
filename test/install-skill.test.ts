// @vitest-environment node

import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));

function tactone(home: string, args: readonly string[]) {
  return new Promise<{ readonly code: number; readonly stdout: string; readonly stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, ["cli/cli.ts", ...args], {
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

describe("tactone skill", () => {
  let home = "";

  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), "tactone-skill-"));
  });

  afterEach(async () => {
    await rm(home, { recursive: true, force: true });
  });

  it("copies the skill into ~/.agents/skills and says where it landed", async () => {
    const result = await tactone(home, ["skill"]);
    const installed = await readFile(join(home, ".agents", "skills", "tactone", "SKILL.md"), "utf8");
    const shipped = await readFile(join(root, "skills", "tactone", "SKILL.md"), "utf8");

    expect(result.stderr).toBe("");
    expect(result.code).toBe(0);
    expect(installed).toBe(shipped);
    expect(result.stdout).toContain(join(home, ".agents", "skills", "tactone"));
  });

  it("explains the failure and exits non-zero when the home directory cannot be written", async () => {
    await writeFile(join(home, ".agents"), "a file where the directory should go");
    const result = await tactone(home, ["skill"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Could not install the Tactone skill");
    expect(result.stderr).toContain("skills/tactone");
    expect(result.stderr).not.toContain("    at ");
  });

  it("leaves the home directory alone unless asked", async () => {
    const result = await tactone(home, ["--help"]);

    expect(result.code).toBe(0);
    await expect(access(join(home, ".agents"))).rejects.toThrow();
  });

  it("keeps a local edit when another command runs", async () => {
    const installed = join(home, ".agents", "skills", "tactone");
    await mkdir(installed, { recursive: true });
    await writeFile(join(installed, "SKILL.md"), "my edit");
    await tactone(home, ["--help"]);

    expect(await readFile(join(installed, "SKILL.md"), "utf8")).toBe("my edit");
  });
});

describe("shipped skill", () => {
  it("has frontmatter a strict YAML parser accepts", async () => {
    const source = await readFile(join(root, "skills", "tactone", "SKILL.md"), "utf8");
    const frontmatter = /^---\nname: tactone\ndescription: (.+)\n---\n/.exec(source);

    expect(frontmatter).not.toBeNull();
    // A plain YAML scalar ends at ": " or " #", and cannot start with an indicator such as ">".
    expect(frontmatter?.[1]).toMatch(/^[A-Za-z]/);
    expect(frontmatter?.[1]).not.toMatch(/: | #/);
  });
});
