import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const serverTarget = process.env.MMBT_SERVER_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": serverTarget,
      "/socket.io": {
        target: serverTarget,
        ws: true
      }
    }
  },
  preview: {
    port: 4174
  },
  test: {
    globals: true
  }
});
