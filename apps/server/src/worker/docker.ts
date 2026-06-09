import { $ } from "bun";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnWithLogs } from "./logs";

const BUILD_DIR = "/tmp/forge-builds";

function buildDir(projectId: string) {
  return join(BUILD_DIR, projectId);
}

function imageTag(projectId: string) {
  return `forge-${projectId}`;
}

function containerName(projectId: string) {
  return `forge-${projectId}`;
}

export async function cloneRepo(
  repoUrl: string,
  projectId: string,
  branch: string,
  deploymentId: string,
): Promise<void> {
  const dir = buildDir(projectId);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }

  const exitCode = await spawnWithLogs(deploymentId, [
    "git", "clone", "--branch", branch, "--depth", "1", repoUrl, dir,
  ]);

  if (exitCode !== 0) {
    throw new Error("Failed to clone repository");
  }
}

export function readPackageJson(projectId: string): Record<string, unknown> {
  const path = join(buildDir(projectId), "package.json");
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function writeDockerfile(projectId: string, content: string): void {
  writeFileSync(join(buildDir(projectId), "Dockerfile"), content);
}

export async function dockerBuild(
  projectId: string,
  deploymentId: string,
): Promise<void> {
  const dir = buildDir(projectId);
  const tag = imageTag(projectId);

  const exitCode = await spawnWithLogs(deploymentId, [
    "docker", "build", "-t", tag, dir,
  ]);

  if (exitCode !== 0) {
    throw new Error("Docker build failed");
  }
}

export async function stopExistingContainer(projectId: string): Promise<void> {
  const name = containerName(projectId);
  await $`docker stop ${name}`.nothrow().quiet();
  await $`docker rm ${name}`.nothrow().quiet();
}

export async function dockerRun(
  projectId: string,
  hostPort: number,
  internalPort: number,
  deploymentId: string,
): Promise<string> {
  const name = containerName(projectId);
  const tag = imageTag(projectId);

  await stopExistingContainer(projectId);

  const exitCode = await spawnWithLogs(deploymentId, [
    "docker", "run", "-d",
    "--name", name,
    "-p", `${hostPort}:${internalPort}`,
    "--restart", "unless-stopped",
    tag,
  ]);

  if (exitCode !== 0) {
    throw new Error("Docker run failed");
  }

  const inspect = await $`docker inspect ${name} --format '{{.Id}}'`.quiet();
  return inspect.stdout.toString().trim();
}

export async function cleanupBuild(projectId: string): Promise<void> {
  const dir = buildDir(projectId);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function getUsedPorts(): Promise<number[]> {
  const result = await $`docker ps --format '{{json .}}'`.quiet();
  if (result.exitCode !== 0) return [];

  const ports: number[] = [];
  const output = result.stdout.toString().trim();
  for (const line of output.split("\n")) {
    try {
      const container = JSON.parse(line);
      const portBindings = container.Ports as Array<{ PublicPort?: number }>;
      if (portBindings) {
        for (const p of portBindings) {
          if (p.PublicPort) ports.push(p.PublicPort);
        }
      }
    } catch { /* skip malformed lines */ }
  }
  return ports;
}

export function findAvailablePort(usedPorts: number[], start = 4000, end = 5000): number {
  for (let port = start; port <= end; port++) {
    if (!usedPorts.includes(port)) return port;
  }
  throw new Error("No available ports in range");
}
