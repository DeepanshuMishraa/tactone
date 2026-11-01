/**
 * TypeScript 7 leaves `.ts` specifiers in declaration files. Published
 * packages use `.js` there, which every supported TypeScript resolves to
 * the matching `.d.ts`.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const specifier = () => /(from\s+")(\.\/[^"]+)\.ts(")/g;

for (const name of await readdir(dist)) {
  if (!name.endsWith(".d.ts")) continue;
  const file = join(dist, name);
  const source = await readFile(file, "utf8");
  const next = source.replaceAll(specifier(), "$1$2.js$3");
  if (specifier().test(next)) {
    throw new Error(`${name} still has a relative .ts import. The declaration rewrite missed it.`);
  }
  if (next !== source) await writeFile(file, next);
}
