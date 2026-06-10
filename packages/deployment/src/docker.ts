import { $ } from "bun";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnWithLogs } from "./logs";

const BUILD_DIR = "/tmp/forge-builds";

function buildDir(projectId: string) { return join(BUILD_DIR, projectId); }
function imageTag(projectId: string) { return `forge-${projectId}`; }
function containerName(projectId: string) { return `forge-${projectId}`; }

export async function cloneRepo(repoUrl: string, projectId: string, branch: string, deploymentId: string): Promise<void> {
  const dir = buildDir(projectId);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  const exitCode = await spawnWithLogs(deploymentId, ["git", "clone", "--branch", branch, "--depth", "1", repoUrl, dir]);
  if (exitCode !== 0) throw new Error("Failed to clone repository");
}

export function readPackageJson(projectId: string): Record<string, unknown> {
  const path = join(buildDir(projectId), "package.json");
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function writeDockerfile(projectId: string, content: string): void {
  writeFileSync(join(buildDir(projectId), "Dockerfile"), content);
}

export async function dockerBuild(projectId: string, deploymentId: string): Promise<void> {
  const dir = buildDir(projectId);
  const tag = imageTag(projectId);
  const exitCode = await spawnWithLogs(deploymentId, ["docker", "build", "-t", tag, dir]);
  if (exitCode !== 0) throw new Error("Docker build failed");
}

export async function stopExistingContainer(projectId: string): Promise<void> {
  const name = containerName(projectId);
  await $`docker stop ${name}`.nothrow().quiet();
  await $`docker rm ${name}`.nothrow().quiet();
}

export async function getHostPort(containerId: string, internalPort: number): Promise<number> {
  const result = await $`docker port ${containerId} ${internalPort}/tcp`.quiet();
  const output = result.stdout.toString().trim();
  const match = output.match(/:(\d+)$/);
  if (!match || !match[1]) throw new Error(`Could not determine host port for ${containerId}:${internalPort}`);
  return parseInt(match[1], 10);
}

export async function dockerRun(projectId: string, internalPort: number, deploymentId: string): Promise<{ containerId: string; containerPort: number }> {
  const name = containerName(projectId);
  const tag = imageTag(projectId);
  await stopExistingContainer(projectId);
  const exitCode = await spawnWithLogs(deploymentId, ["docker", "run", "-d", "--name", name, "-P", "--restart", "unless-stopped", tag]);
  if (exitCode !== 0) throw new Error("Docker run failed");
  const inspect = await $`docker inspect ${name} --format '{{.Id}}'`.quiet();
  const containerId = inspect.stdout.toString().trim();
  const containerPort = await getHostPort(containerId, internalPort);
  return { containerId, containerPort };
}

export async function cleanupBuild(projectId: string): Promise<void> {
  const dir = buildDir(projectId);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}
