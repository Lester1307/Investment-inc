import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-assets-to-android",
      closeBundle() {
        try {
          const srcDir = path.resolve(__dirname, "dist");
          const destDir = path.resolve(__dirname, "app/src/main/assets/dist");
          if (fs.existsSync(srcDir)) {
            if (fs.existsSync(destDir)) {
              fs.rmSync(destDir, { recursive: true, force: true });
            }
            copyDir(srcDir, destDir);
            console.log("Successfully mirrored build assets to Android main asset pipeline!");
          }
        } catch (e) {
          console.error("Failed mirroring assets to Android directory:", e);
        }
      }
    }
  ],
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
