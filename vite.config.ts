import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: {
        "micro-machines": resolve(__dirname, "src/lib/state-machine.ts"),
        "react/micro-machines": resolve(
          __dirname,
          "src/lib/react-micromachines.ts",
        ),
      },
      name: "React Micromachines",
    },
    rollupOptions: {
      external: ["react"],
    },
  },
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      tsconfigPath: "tsconfig.lib.json",
    }),
  ],
});
