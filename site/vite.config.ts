import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const siteDir = dirname(fileURLToPath(import.meta.url));

// The site is its own build. Its output lands in site/dist, which the npm package never ships.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(siteDir, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(siteDir, "index.html"),
        docs: resolve(siteDir, "docs/index.html"),
      },
    },
  },
});
