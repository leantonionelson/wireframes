import { defineConfig } from "@playwright/test";

/* E2E critical flows. Runs its own dev server on 3100 with auth disabled
 * (process env beats .env.local in Next), so a normal authed dev server on
 * 3000 is unaffected. The suite creates and deletes its own project and
 * never touches existing ones. */
export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    env: { ...process.env as Record<string, string>, SCAFFOLD_PASSWORD: "" },
  },
});
