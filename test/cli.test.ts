// @vitest-environment node

import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fileInRoot, parseArgs, serveEditor, serveFailure } from "../cli/cli.ts";

type PackageJson = {
  readonly bin: { readonly foley: string };
  readonly files: readonly string[];
  readonly exports: {
    readonly ".": { readonly types: string; readonly import: string };
    readonly "./react": { readonly types: string; readonly import: string };
    readonly "./presets": { readonly types: string; readonly import: string };
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function readString(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`package.json ${label} should be a string.`);
  return value;
}

function readPackage(value: unknown): PackageJson {
  if (!isRecord(value) || !isRecord(value.bin) || !isStringList(value.files) || !isRecord(value.exports)) {
    throw new Error("package.json is missing bin, files, or exports.");
  }
  const { files } = value;
  const exports = value.exports;
  const entry = (name: "." | "./react" | "./presets") => {
    const item = exports[name];
    if (!isRecord(item)) throw new Error(`package.json exports["${name}"] should be an object.`);
    return { types: readString(item.types, `exports["${name}"].types`), import: readString(item.import, `exports["${name}"].import`) };
  };
  return {
    bin: { foley: readString(value.bin.foley, "bin.foley") },
    files,
    exports: { ".": entry("."), "./react": entry("./react"), "./presets": entry("./presets") },
  };
}

const pkg = readPackage(JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")));

describe("package entry points", () => {
  it("publishes the typed entries and the foley command", () => {
    expect(pkg.files).toEqual(["dist", "skills"]);
    expect(pkg.bin.foley).toBe("./dist/cli.js");
    expect(pkg.exports["."]).toMatchObject({ types: "./dist/index.d.ts", import: "./dist/index.js" });
    expect(pkg.exports["./react"]).toMatchObject({ types: "./dist/react.d.ts", import: "./dist/react.js" });
    expect(pkg.exports["./presets"]).toMatchObject({ types: "./dist/presets.d.ts", import: "./dist/presets.js" });
  });

  it("runs nothing at install time", async () => {
    const manifest = await readFile(new URL("../package.json", import.meta.url), "utf8");
    expect(manifest).not.toMatch(/"(preinstall|install|postinstall)":/);
  });

  it("marks the React entry as client code", async () => {
    const source = await readFile(new URL("../src/react.tsx", import.meta.url), "utf8");
    expect(source.startsWith('"use client";\n')).toBe(true);
  });
});

describe("parseArgs", () => {
  it("treats foley and foley editor as the same command", () => {
    expect(parseArgs(["node", "foley"])).toMatchObject({ help: false, open: true, error: undefined });
    expect(parseArgs(["node", "foley", "editor"])).toMatchObject({ help: false, open: true, port: undefined, error: undefined });
  });

  it("reads a port and --no-open", () => {
    expect(parseArgs(["node", "foley", "editor", "--port", "4321", "--no-open"])).toMatchObject({ open: false, port: 4321, error: undefined });
    expect(parseArgs(["node", "foley", "--port=0"])).toMatchObject({ port: 0, error: undefined });
  });

  it("rejects a bad port and unknown arguments", () => {
    expect(parseArgs(["node", "foley", "--port", "nope"]).error).toMatch(/port/);
    expect(parseArgs(["node", "foley", "build"]).error).toMatch(/Unknown argument/);
  });

  it("reads the skill command and defaults to the editor", () => {
    expect(parseArgs(["node", "foley", "skill"])).toMatchObject({ command: "skill", error: undefined });
    expect(parseArgs(["node", "foley"])).toMatchObject({ command: "editor" });
    expect(parseArgs(["node", "foley", "editor"])).toMatchObject({ command: "editor" });
  });
});

describe("serveFailure", () => {
  it("names a busy port and how to recover", async () => {
    const root = await mkdtemp(join(tmpdir(), "foley-busy-"));
    const first = await serveEditor({ root, port: 0 });
    const port = Number(new URL(first.url).port);
    try {
      const error = await serveEditor({ root, port }).catch((reason: unknown) => reason);
      const message = serveFailure(error, port);
      expect(message).toContain(`Port ${port} is already in use`);
      expect(message).toContain("--port");
    } finally {
      await first.close();
      await rm(root, { recursive: true, force: true });
    }
  });

  it("passes on the reason for any other failure", () => {
    expect(serveFailure(new Error("permission denied"), 80)).toContain("permission denied");
    expect(serveFailure("odd", undefined)).toContain("The reason was not reported");
  });
});

describe("serveEditor", () => {
  let root = "";

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "foley-editor-"));
    await mkdir(join(root, "assets"));
    await writeFile(join(root, "index.html"), "<p>foley</p>");
    await writeFile(join(root, "assets", "app.js"), "export const ok = true;\n");
    await writeFile(join(root, "..", "outside.txt"), "secret");
    await symlink(join(root, "..", "outside.txt"), join(root, "leak.txt"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
    await rm(join(root, "..", "outside.txt"), { force: true });
  });

  it("serves files inside the editor directory and refuses paths that leave it", async () => {
    const real = await realpath(root);
    expect(await fileInRoot(root, "/")).toBe(join(real, "index.html"));
    expect(await fileInRoot(root, "/assets/app.js?v=1")).toBe(join(real, "assets", "app.js"));
    expect(await fileInRoot(root, "/%2e%2e/outside.txt")).toBeNull();
    expect(await fileInRoot(root, "/leak.txt")).toBeNull();
    expect(await fileInRoot(root, "/missing.js")).toBeNull();

    const server = await serveEditor({ root, port: 0 });
    try {
      const page = await fetch(server.url);
      expect(await page.text()).toBe("<p>foley</p>");
      expect(page.headers.get("content-type")).toMatch(/text\/html/);

      const script = await fetch(new URL("assets/app.js", server.url));
      expect(script.status).toBe(200);
      expect(script.headers.get("content-type")).toMatch(/javascript/);

      const missing = await fetch(new URL("nope.html", server.url));
      expect(missing.status).toBe(404);
    } finally {
      await server.close();
    }
  });
});
