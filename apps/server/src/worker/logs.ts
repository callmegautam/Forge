import type { Subprocess } from "bun";
import { logStream } from "../utils/log-stream";

export async function spawnWithLogs(
  deploymentId: string,
  cmd: string[],
  options?: Record<string, unknown>,
): Promise<number> {
  console.log(`[spawn] ${cmd.join(" ")}`);
  const proc = Bun.spawn(cmd, {
    ...options,
    stdout: "pipe",
    stderr: "pipe",
  }) as Subprocess & { stdout: ReadableStream<Uint8Array>; stderr: ReadableStream<Uint8Array> };

  const decoder = new TextDecoder();

  async function readStream(
    stream: ReadableStream<Uint8Array>,
  ): Promise<void> {
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      process.stdout.write(text);
      logStream.emit(deploymentId, text);
    }
  }

  await Promise.all([readStream(proc.stdout), readStream(proc.stderr)]);

  const exitCode = await proc.exited;
  console.log(`[spawn] exit code: ${exitCode}`);
  return exitCode;
}
