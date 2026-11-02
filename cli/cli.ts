#!/usr/bin/env node

/**
 * `npx tactone` and `npx tactone editor` serve the built editor and open it.
 * The assets live next to this file, at dist/editor, after `pnpm build`.
 * `npx tactone skill` copies the agent skill to ~/.agents/skills/tactone.
 */

import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import { cp, mkdir, readFile, realpath, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { homedir } from "node:os";
import { dirname, extname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".map": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

export type CliArgs = {
  readonly command: "editor" | "skill";
  readonly help: boolean;
  readonly open: boolean;
  readonly port: number | undefined;
  readonly error: string | undefined;
};

export type EditorServer = {
  readonly url: string;
  readonly close: () => Promise<void>;
};

/** Directory of the built editor, beside the compiled CLI. */
export function editorDirectory(): string {
  return fileURLToPath(new URL("./editor/", import.meta.url));
}

export function parseArgs(argv: readonly string[]): CliArgs {
  let command: CliArgs["command"] = "editor";
  let help = false;
  let open = true;
  let port: number | undefined;
  const args = argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (arg === "editor") continue;
    if (arg === "skill") {
      command = "skill";
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (arg === "--no-open") {
      open = false;
      continue;
    }
    if (arg === "--port" || arg.startsWith("--port=")) {
      const raw = arg === "--port" ? args[index + 1] : arg.slice("--port=".length);
      if (arg === "--port") index += 1;
      const value = Number(raw);
      if (raw === undefined || !Number.isInteger(value) || value < 0 || value > 65535) {
        return { command, help: false, open: true, port: undefined, error: `Expected a port from 0 to 65535, got ${raw ?? "(missing)"}.` };
      }
      port = value;
      continue;
    }
    return { command, help: false, open: true, port: undefined, error: `Unknown argument "${arg}". Run \`tactone --help\` for usage.` };
  }

  return { command, help, open, port, error: undefined };
}

/** Resolves a request path to a file inside `root`. Rejects paths that leave the directory, including through symlinks. */
export async function fileInRoot(root: string, urlPath: string): Promise<string | null> {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(urlPath, "http://127.0.0.1").pathname);
  } catch {
    return null;
  }
  if (pathname.includes("\0")) return null;

  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let rootReal: string;
  try {
    rootReal = await realpath(root);
  } catch {
    return null;
  }

  const candidate = join(rootReal, relative);
  try {
    const fileReal = await realpath(candidate);
    const rootPrefix = rootReal.endsWith(sep) ? rootReal : rootReal + sep;
    if (fileReal !== rootReal && !fileReal.startsWith(rootPrefix)) return null;
    const info = await stat(fileReal);
    return info.isFile() ? fileReal : null;
  } catch {
    return null;
  }
}

export function serveEditor(options: { readonly root: string; readonly port?: number; readonly hostname?: string }): Promise<EditorServer> {
  const hostname = options.hostname ?? "127.0.0.1";
  const server = createServer((request, response) => {
    void fileInRoot(options.root, request.url ?? "/")
      .then(async (file) => {
        if (file === null) {
          response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
          response.end("Not found.");
          return;
        }
        const body = await readFile(file);
        response.writeHead(200, {
          "content-type": TYPES[extname(file)] ?? "application/octet-stream",
          "cache-control": "no-cache",
        });
        response.end(body);
      })
      .catch((error: unknown) => {
        response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
        response.end(error instanceof Error ? error.message : "The editor failed to read a file.");
      });
  });

  const port = options.port ?? 0;
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, hostname, () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("The Tactone editor server did not bind to a TCP port."));
        return;
      }
      resolve({
        url: `http://${hostname}:${address.port}/`,
        close: () => closeServer(server),
      });
    });
  });
}

/** What to tell someone when the editor server could not start. */
export function serveFailure(error: unknown, port: number | undefined): string {
  if (error instanceof Error && "code" in error && error.code === "EADDRINUSE") {
    return `Port ${port} is already in use, so the Tactone editor did not start. Pass another with --port <n>, or leave out --port to use a free one.`;
  }
  const reason = error instanceof Error ? error.message : "The reason was not reported.";
  return `The Tactone editor did not start. ${reason}`;
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error !== undefined) reject(error);
      else resolve();
    });
  });
}

function openBrowser(url: string) {
  const child =
    process.platform === "win32"
      ? spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true, windowsHide: true })
      : spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], { stdio: "ignore", detached: true });
  child.on("error", () => {
    console.log(`Open ${url} in your browser.`);
  });
  child.unref();
}

const HELP = `Usage: tactone [editor] [--port <n>] [--no-open]
       tactone skill

Serves the Tactone editor on localhost and opens it in your browser.
\`tactone\` and \`tactone editor\` do the same thing.

\`tactone skill\` copies the agent skill to ~/.agents/skills/tactone, replacing any copy already there.`;

async function installSkill() {
  const source = fileURLToPath(new URL("../skills/tactone/", import.meta.url));
  const destination = join(homedir(), ".agents", "skills", "tactone");
  try {
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true, force: true });
    console.log(`Tactone installed its agent skill at ${destination}.`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "The reason was not reported.";
    console.error(`Could not install the Tactone skill at ${destination}. ${reason}`);
    console.error("The package itself still works. To install the skill by hand, copy skills/tactone from the package to that path.");
    process.exitCode = 1;
  }
}

async function main() {
  const parsed = parseArgs(process.argv);
  if (parsed.error !== undefined) {
    console.error(parsed.error);
    process.exitCode = 1;
    return;
  }
  if (parsed.help) {
    console.log(HELP);
    return;
  }
  if (parsed.command === "skill") {
    await installSkill();
    return;
  }

  const root = editorDirectory();
  try {
    await stat(join(root, "index.html"));
  } catch {
    console.error(`Could not find the Tactone editor at ${root}.`);
    console.error("From the tactone repo, run `pnpm build`. If you installed the package, reinstall it so the build is included.");
    process.exitCode = 1;
    return;
  }

  try {
    const server = await serveEditor({ root, ...(parsed.port === undefined ? {} : { port: parsed.port }) });
    console.log(`Tactone editor at ${server.url}`);
    if (parsed.open) openBrowser(server.url);
  } catch (error) {
    console.error(serveFailure(error, parsed.port));
    process.exitCode = 1;
  }
}

function invokedDirectly(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(entry);
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  void main();
}
