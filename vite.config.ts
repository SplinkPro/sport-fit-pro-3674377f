import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom"],
  },
  build: {
    // Larger inline threshold reduces HTTP requests for tiny assets
    assetsInlineLimit: 4096,
    // Only generate sourcemaps in dev
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        // Manual chunking: split heavy vendor libs so first-paint is fast
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-radix": [
            "@radix-ui/react-tabs",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-sheet",
          ],
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
  },
}));
