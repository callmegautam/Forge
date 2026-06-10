type LogCallback = (chunk: string) => void;

class LogStream {
  private listeners = new Map<string, Set<LogCallback>>();

  subscribe(deploymentId: string, callback: LogCallback): () => void {
    if (!this.listeners.has(deploymentId)) {
      this.listeners.set(deploymentId, new Set());
    }
    this.listeners.get(deploymentId)!.add(callback);
    return () => {
      this.listeners.get(deploymentId)?.delete(callback);
    };
  }

  emit(deploymentId: string, chunk: string) {
    this.listeners.get(deploymentId)?.forEach((cb) => cb(chunk));
  }

  end(deploymentId: string) {
    this.listeners.delete(deploymentId);
  }
}

export const logStream = new LogStream();
