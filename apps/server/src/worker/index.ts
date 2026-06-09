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
  const tag = `[deploy ${id.slice(0, 8)}]`;
  console.log(`${tag} Starting deployment for project ${projectId}`);
  console.log(`${tag} Repo: ${repoUrl}, Branch: ${branch}`);

  try {
    console.log(`${tag} Marking deployment as building`);
    await updateDeployment(id, { status: "building" });

    const msg1 = `Cloning ${repoUrl} (branch: ${branch})...\n`;
    console.log(`${tag} ${msg1.trim()}`);
    logStream.emit(id, msg1);
    await cloneRepo(repoUrl, projectId, branch, id);
    console.log(`${tag} Clone complete`);

    const msg2 = "Reading package.json...\n";
    logStream.emit(id, msg2);
    const pkg = readPackageJson(projectId);
    const config = detectFramework(pkg);
    console.log(`${tag} Detected framework: ${config.framework}`);
    const msg3 = `Detected framework: ${config.framework}\n`;
    logStream.emit(id, msg3);
    await updateProjectById(projectId, { framework: config.framework });

    console.log(`${tag} Generating Dockerfile`);
    const msg4 = "Generating Dockerfile...\n";
    logStream.emit(id, msg4);
    const dockerfile = generateDockerfile(config);
    writeDockerfile(projectId, dockerfile);
    logStream.emit(id, "Dockerfile generated\n");

    console.log(`${tag} Building Docker image`);
    const msg5 = "Building Docker image...\n";
    logStream.emit(id, msg5);
    await dockerBuild(projectId, id);
    console.log(`${tag} Docker build complete`);

    const msg6 = `Starting container...\n`;
    console.log(`${tag} ${msg6.trim()}`);
    logStream.emit(id, msg6);

    const { containerId, containerPort } = await dockerRun(projectId, config.internalPort, id);
    console.log(`${tag} Container started: ${containerId} on host port ${containerPort}`);

    const msg7 = `Deployment live on port ${containerPort}\n`;
    logStream.emit(id, msg7);

    await updateDeployment(id, {
      status: "live",
      containerId,
      containerPort,
    });
    console.log(`${tag} Deployment live`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`${tag} FAILED: ${message}`);
    logStream.emit(id, `Failed: ${message}\n`);
    await updateDeployment(id, { status: "failed" });
  } finally {
    logStream.end(id);
    await cleanupBuild(projectId);
    console.log(`${tag} Cleanup done`);
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
  } catch (error) {
    console.error("Worker tick failed:", error);
  }
}

export function startWorker() {
  console.log("Worker started, polling every", POLL_INTERVAL / 1000, "s");
  let running = false;

  async function loop() {
    if (running) return;
    running = true;
    try {
      await tick();
    } catch (err) {
      console.error("[worker] Unhandled error in tick:", err);
    } finally {
      running = false;
      setTimeout(loop, POLL_INTERVAL);
    }
  }

  loop();
}
