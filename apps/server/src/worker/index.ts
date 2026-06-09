import { findQueuedDeployments, updateDeployment } from "../db/deployments.db";
import { updateProjectById } from "../db/projects.db";
import { logStream } from "../utils/log-stream";
import { detectFramework, generateDockerfile } from "./detector";
import {
  cloneRepo,
  readPackageJson,
  writeDockerfile,
  dockerBuild,
  dockerRun,
  cleanupBuild,
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

async function tick() {
  try {
    const deployments = await findQueuedDeployments();
    for (const dep of deployments) {
      const project = dep.project;
      if (!project || !project.repoUrl) continue;

      await processDeployment(dep.id, project.id, project.repoUrl, project.branch);
    }
  } catch (_error) {
  }
}

export function startWorker() {
  let running = false;

  async function loop() {
    if (running) return;
    running = true;
    try {
      await tick();
    } catch (_err) {
    } finally {
      running = false;
      setTimeout(loop, POLL_INTERVAL);
    }
  }

  loop();
}
