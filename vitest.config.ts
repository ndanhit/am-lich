import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: [
      "node_modules/**",
      "tests/adapters/supabase/**",
      "tests/application/performance.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: [
        "src/core/**/*.ts",
        "src/application/**/*.ts",
        "src/adapters/storage/**/*.ts",
        "src/lib/**/*.ts",
      ],
      exclude: [
        "src/**/*.d.ts",
        "src/core/models/types.ts",
        "src/lib/index.ts",
        "src/adapters/supabase/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
