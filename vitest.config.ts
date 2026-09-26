import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirror the "@/*" path alias from tsconfig.json
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Unit tests cover server actions and utilities only, so .tsx components are excluded
    include: ["src/**/*.test.ts"],
    // Each test starts with fresh mocks and the real environment variables
    mockReset: true,
    unstubEnvs: true,
  },
});
