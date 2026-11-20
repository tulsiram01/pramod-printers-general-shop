import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/pramod-printers-general-shop/react-preview-live/",
  build: { outDir: "dist", sourcemap: false },
});