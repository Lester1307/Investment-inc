import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For GitHub Pages, using a relative base path "./" is the most robust and bulletproof approach.
// It allows the bundle to be served from any custom subdirectory (like /repository-name/)
// or from root-level custom domains (like domain.com) without causing 404 script assets or white screens,
// since our app does not use server-side / sub-folder routing.
const base = "./";

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
