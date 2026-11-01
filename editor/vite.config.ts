import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const editorDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Relative URLs so the built editor works on whatever port `foley` binds.
  // Dev stays at `/`, which is what the Vite server expects.
  base: command === "build" ? "./" : "/",
  build: {
    outDir: resolve(editorDir, "../dist/editor"),
    emptyOutDir: true,
  },
}));
