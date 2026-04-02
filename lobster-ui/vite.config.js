import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 4174,
    proxy: {
      "/api": {
        target: "http://localhost:3013",
        changeOrigin: true,
      },
    },
  },
});
