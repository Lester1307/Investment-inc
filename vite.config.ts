import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For GitHub Pages, the base path is usually the repository name: /<repo-name>/
// We resolve this dynamically from the GITHUB_REPOSITORY environment variable on GitHub Actions.
// If the repository name is the user's primary github.io pages repository (e.g., username.github.io),
// or if a custom domain is configured, the base path must be "/". We support VITE_BASE_PATH overrides.
const getBasePath = () => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  if (process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split("/")[1];
    if (repoName.toLowerCase().endsWith(".github.io")) {
      return "/";
    }
    return `/${repoName}/`;
  }
  return "./";
};

const base = getBasePath();

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
