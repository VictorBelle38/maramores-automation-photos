import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
  },
  define: {
    // Expor variáveis de ambiente para o cliente
    __WEBHOOK_URL__: JSON.stringify(
      process.env.VITE_WEBHOOK_URL ||
        "https://n8nmaramores.bdntech.com.br/webhook/envio-fotos"
    ),
    __MAX_FILE_SIZE__: JSON.stringify(
      process.env.VITE_MAX_FILE_SIZE || "10485760"
    ),
    __ALLOWED_TYPES__: JSON.stringify(
      process.env.VITE_ALLOWED_TYPES || "image/jpeg,image/jpg,image/png"
    ),
    __MOBILE_MAX_DIMENSION__: JSON.stringify(
      process.env.VITE_MOBILE_MAX_DIMENSION || "2048"
    ),
    __MOBILE_JPEG_QUALITY__: JSON.stringify(
      process.env.VITE_MOBILE_JPEG_QUALITY || "0.78"
    ),
    __MOBILE_BATCH_MAX_MB__: JSON.stringify(
      process.env.VITE_MOBILE_BATCH_MAX_MB || "8"
    ),
    __MOBILE_BATCH_MAX_FILES__: JSON.stringify(
      process.env.VITE_MOBILE_BATCH_MAX_FILES || "3"
    ),
  },
});
