import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      // "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
  plugins: [
    react(),
    // {
    //   name: "configure-server",
    //   configureServer(server) {
    //     server.middlewares.use((req, res, next) => {
    //       if (req.originalUrl?.includes("@sqlite.org/sqlite-wasm")) {
    //         res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    //         res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    //         res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    //       }
    //       next();
    //     });
    //   },
    // },
  ],
});
