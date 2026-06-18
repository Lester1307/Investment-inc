import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For GitHub Pages, the base path is usually the repository name: /<repo-name>/
// We resolve this dynamically from the GITHUB_REPOSITORY environment variable on GitHub Actions.
// For local dev development, we fall back to relative path "./".
const base = process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
  : "./";

export default defineConfig({
  plugins: [react()],
  base: base,
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  }
});
