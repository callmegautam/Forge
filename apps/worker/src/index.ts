import { updateDeployment } from "./db";
import { updateProjectById } from "./db";
import { logStream } from "@forge/deployment";
import { detectFramework, generateDockerfile } from "@forge/deployment/detector";
import {
  cloneRepo,
  readPackageJson,
  writeDockerfile,
  dockerBuild,
  dockerRun,
  cleanupBuild,
} from "@forge/deployment/docker";
import { createDeploymentWorker, type DeploymentJobResult } from "@forge/queue";

async function processDeployment(
  id: string,
  projectId: string,
  repoUrl: string,
  branch: string,
) {
  try {
    await updateDeployment(id, { status: "building" });
    await cloneRepo(repoUrl, projectId, branch, id);
    const pkg = readPackageJson(projectId);
    const config = detectFramework(pkg);
    await updateProjectById(projectId, { framework: config.framework });
    const dockerfile = generateDockerfile(config);
    writeDockerfile(projectId, dockerfile);
    await dockerBuild(projectId, id);
    const { containerId, containerPort } = await dockerRun(projectId, config.internalPort, id);
    await updateDeployment(id, {
      status: "live",
      containerId,
      containerPort,
    });
  } catch (error) {
    await updateDeployment(id, { status: "failed" });
  } finally {
    logStream.end(id);
    await cleanupBuild(projectId);
  }
}

export function startWorker() {
  const worker = createDeploymentWorker(
    async (job): Promise<DeploymentJobResult> => {
      const { deploymentId, projectId, repoUrl, branch } = job.data;
      await processDeployment(deploymentId, projectId, repoUrl, branch);
      return { success: true };
    },
  );

  worker.on("completed", (job) => {
    console.log(`Deployment ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Deployment ${job?.id} failed:`, err.message);
  });

  console.log("Worker started, waiting for deployment jobs...");
}
