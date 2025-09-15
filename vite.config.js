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
        "https://seu-dominio.com/form/seu-webhook-id"
    ),
    __MAX_FILE_SIZE__: JSON.stringify(
      process.env.VITE_MAX_FILE_SIZE || "10485760"
    ),
    __ALLOWED_TYPES__: JSON.stringify(
      process.env.VITE_ALLOWED_TYPES || "image/jpeg,image/jpg,image/png"
    ),
  },
});
