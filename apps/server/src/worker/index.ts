import { findQueuedDeployments, updateDeployment } from "../db/deployments.db";
import { logStream } from "../utils/log-stream";
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

async function processDeployment(
  id: string,
  projectId: string,
  repoUrl: string,
  branch: string,
) {
  try {
    await updateDeployment(id, { status: "building" });

    logStream.emit(id, `Cloning ${repoUrl} (branch: ${branch})...\n`);
    await cloneRepo(repoUrl, projectId, branch, id);

    logStream.emit(id, "Reading package.json...\n");
    const pkg = readPackageJson(projectId);
    const config = detectFramework(pkg);
    logStream.emit(id, `Detected framework: ${config.framework}\n`);

    logStream.emit(id, "Generating Dockerfile...\n");
    const dockerfile = generateDockerfile(config);
    writeDockerfile(projectId, dockerfile);
    logStream.emit(id, "Dockerfile generated\n");

    logStream.emit(id, "Building Docker image...\n");
    await dockerBuild(projectId, id);

    logStream.emit(id, "Allocating port...\n");
    const usedPorts = await getUsedPorts();
    const hostPort = findAvailablePort(usedPorts);
    logStream.emit(id, `Starting container on port ${hostPort}...\n`);

    const containerId = await dockerRun(projectId, hostPort, config.internalPort, id);

    logStream.emit(id, `Deployment live on port ${hostPort}\n`);

    await updateDeployment(id, {
      status: "live",
      containerPort: hostPort,
      containerId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStream.emit(id, `Failed: ${message}\n`);
    await updateDeployment(id, { status: "failed" });
  } finally {
    logStream.end(id);
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
