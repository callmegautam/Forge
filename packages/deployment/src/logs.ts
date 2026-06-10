import type { Subprocess } from "bun";
import { logStream } from "./log-stream";

export async function spawnWithLogs(
  deploymentId: string,
  cmd: string[],
  options?: Record<string, unknown>,
): Promise<number> {
  const proc = Bun.spawn(cmd, {
    ...options,
    stdout: "pipe",
    stderr: "pipe",
  }) as Subprocess & { stdout: ReadableStream<Uint8Array>; stderr: ReadableStream<Uint8Array> };

  const decoder = new TextDecoder();

  async function readStream(stream: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      logStream.emit(deploymentId, decoder.decode(value));
    }
  }

  await Promise.all([readStream(proc.stdout), readStream(proc.stderr)]);
  return await proc.exited;
}
