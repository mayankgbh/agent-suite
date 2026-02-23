/**
 * Run the agent executor worker. Schedule with cron or run in a process manager.
 * Usage: npx tsx scripts/run-agent-worker.ts
 * Requires: REDIS_URL, DATABASE_URL, ANTHROPIC_API_KEY
 */
import { startAgentExecutorWorker } from "../src/workers/agent-executor.worker";

const worker = startAgentExecutorWorker();
console.log("Agent executor worker started. Press Ctrl+C to exit.");

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
