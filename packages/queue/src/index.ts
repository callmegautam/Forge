import { Queue, Worker } from "bullmq";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const url = new URL(REDIS_URL);

const connection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  username: url.username || undefined,
  password: url.password || undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
};

export type DeploymentJobData = {
  deploymentId: string;
  projectId: string;
  repoUrl: string;
  branch: string;
};

export type DeploymentJobResult = {
  success: boolean;
};

export const deploymentQueue = new Queue<DeploymentJobData, DeploymentJobResult>("deployments", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export function createDeploymentWorker(
  processor: (job: import("bullmq").Job<DeploymentJobData>) => Promise<DeploymentJobResult>,
) {
  return new Worker<DeploymentJobData, DeploymentJobResult>("deployments", processor, {
    connection,
    concurrency: 1,
  });
}
