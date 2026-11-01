/**
 * Copies the Foley skill into ~/.agents/skills.
 * A failure to write the home directory must not fail the package install.
 *
 * npm hides successful install-script output, so a postinstall also writes
 * the notice to the terminal. `--if-changed` is for the CLI, which fills in
 * when a package manager skipped this script.
 */

import { closeSync, openSync, writeSync } from "node:fs";
import { cp, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../skills/foley/", import.meta.url));
const destination = join(homedir(), ".agents", "skills", "foley");
const ifChanged = process.argv.includes("--if-changed");

const previous = await readFile(join(destination, "SKILL.md"), "utf8").catch(() => undefined);

try {
  await mkdir(join(homedir(), ".agents", "skills"), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
} catch (error) {
  const reason = error instanceof Error ? error.message : "The reason was not reported.";
  console.error(`Foley could not install its agent skill at ${destination}.`);
  console.error(reason);
  console.error("The package itself is installed. Copy skills/foley to ~/.agents/skills/foley when you want agents to use it.");
  process.exit(0);
}

const next = await readFile(join(destination, "SKILL.md"), "utf8").catch(() => undefined);
if (ifChanged && previous === next) process.exit(0);

const message = ["", "Foley installed an agent skill.", `  ${destination}`, "Agents that load skills from ~/.agents/skills can use it to navigate this package.", ""].join("\n");
console.log(message);

// npm and pnpm swallow install-script stdout unless the script fails.
if (!process.stdout.isTTY && process.env.npm_lifecycle_event !== undefined) {
  try {
    const terminal = openSync(process.platform === "win32" ? "CON" : "/dev/tty", "w");
    writeSync(terminal, `${message}\n`);
    closeSync(terminal);
  } catch {
    // No terminal, for example CI. The console message is enough there.
  }
}
