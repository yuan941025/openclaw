import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = 4284;
  const previewPort = 4285;

  return {
    define: {
      __SUMMARY_AGENT_MODE__: JSON.stringify(env.VITE_SUMMARY_AGENT_MODE?.trim() || "local"),
    },
    server: {
      host: "0.0.0.0",
      port,
    },
    preview: {
      host: "0.0.0.0",
      port: previewPort,
    },
  };
});
