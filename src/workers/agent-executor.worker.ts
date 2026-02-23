import { Worker, Queue } from "bullmq";
import { prisma } from "../lib/db/client";
import { execute } from "../engine/executor";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = { url: redisUrl };

export const AGENT_EXECUTOR_QUEUE = "agent-executor";

export const agentExecutorQueue = new Queue(AGENT_EXECUTOR_QUEUE, { connection });

export async function enqueueAgentExecution(agentId: string): Promise<void> {
  await agentExecutorQueue.add("execute", { agentId }, { jobId: agentId });
}

export function startAgentExecutorWorker(): Worker {
  const worker = new Worker(
    AGENT_EXECUTOR_QUEUE,
    async (job) => {
      const { agentId } = job.data as { agentId: string };
      if (!agentId) return;
      await execute(agentId, prisma);
    },
    {
      connection,
      concurrency: 1,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`Agent executor job ${job?.id} failed:`, err);
  });

  return worker;
}
