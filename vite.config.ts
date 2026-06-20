import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For GitHub Pages, the base path must match the repository subfolder name: /<repo-name>/
// We resolve this dynamically from the GITHUB_REPOSITORY environment variable on GitHub Actions.
// If not built on GHA (e.g. built locally and pushed), we default to "/investment-inc/" to match the GitHub deployment.
const getBasePath = () => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  if (process.env.GITHUB_REPOSITORY) {
    const parts = process.env.GITHUB_REPOSITORY.split("/");
    if (parts.length > 1) {
      const repoName = parts[1];
      if (repoName.toLowerCase().endsWith(".github.io")) {
        return "/";
      }
      return `/${repoName}/`;
    }
  }
  return "/investment-inc/";
};

export default defineConfig(({ command }) => {
  const isDev = command === "serve";
  const base = isDev ? "/" : getBasePath();

  return {
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
  };
});

