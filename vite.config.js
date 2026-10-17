import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds everything (code, fonts, QR engine) into ONE offline html file: dist/index.html
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { assetsInlineLimit: 100_000_000 },
});
