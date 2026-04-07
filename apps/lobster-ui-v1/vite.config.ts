import { defineConfig, loadEnv } from "vite";

const defaultBridgeBaseUrl = "http://127.0.0.1:8787";

function createBridgeProxy(target: string) {
  return {
    "/__lobster_bridge": {
      target,
      changeOrigin: true,
      secure: false,
      rewrite: (path: string) => path.replace(/^\/__lobster_bridge/, ""),
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const bridgeBaseUrl = env.VITE_BRIDGE_BASE_URL?.trim() || defaultBridgeBaseUrl;

  return {
    server: {
      host: "0.0.0.0",
      port: 4174,
      proxy: createBridgeProxy(bridgeBaseUrl),
    },
    preview: {
      host: "0.0.0.0",
      port: 4175,
      proxy: createBridgeProxy(bridgeBaseUrl),
    },
  };
});