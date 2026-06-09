import { findQueuedDeployments, updateDeployment } from "../db/deployments.db";
import { detectFramework, generateDockerfile } from "./detector";
import {
  cloneRepo,
  readPackageJson,
  writeDockerfile,
  dockerBuild,
  dockerRun,
  cleanupBuild,
  getUsedPorts,
  findAvailablePort,
} from "./docker";

const POLL_INTERVAL = 5_000;

async function processDeployment(id: string, projectId: string, repoUrl: string, branch: string) {
  try {
    await updateDeployment(id, { status: "building" });

    await cloneRepo(repoUrl, projectId, branch);

    const pkg = readPackageJson(projectId);
    const config = detectFramework(pkg);

    const dockerfile = generateDockerfile(config);
    writeDockerfile(projectId, dockerfile);

    await dockerBuild(projectId);

    const usedPorts = await getUsedPorts();
    const hostPort = findAvailablePort(usedPorts);

    const containerId = await dockerRun(projectId, hostPort, config.internalPort);

    await updateDeployment(id, {
      status: "live",
      containerPort: hostPort,
      containerId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Deployment ${id} failed:`, message);
    await updateDeployment(id, { status: "failed" });
  } finally {
    await cleanupBuild(projectId);
  }
}

async function tick() {
  try {
    const deployments = await findQueuedDeployments();
    for (const dep of deployments) {
      const project = dep.project;
      if (!project) continue;

      processDeployment(dep.id, project.id, project.repoUrl!, project.branch);
    }
  } catch (error) {
    console.error("Worker tick failed:", error);
  }
}

export function startWorker() {
  console.log("Worker started, polling every", POLL_INTERVAL / 1000, "s");
  tick();
  setInterval(tick, POLL_INTERVAL);
}
