import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Using relative base "./" makes the built assets fully self-contained.
// This allows the app to load perfectly on GitHub Pages under subfolders,
// custom domains, local development, and AI Studio sandboxes.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  }
});


