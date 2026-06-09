type LogCallback = (chunk: string) => void;

class LogStream {
  private listeners = new Map<string, Set<LogCallback>>();

  subscribe(deploymentId: string, callback: LogCallback): () => void {
    if (!this.listeners.has(deploymentId)) {
      this.listeners.set(deploymentId, new Set());
    }
    this.listeners.get(deploymentId)!.add(callback);
    return () => {
      const set = this.listeners.get(deploymentId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.listeners.delete(deploymentId);
      }
    };
  }

  emit(deploymentId: string, chunk: string) {
    const callbacks = this.listeners.get(deploymentId);
    if (callbacks) {
      for (const cb of callbacks) cb(chunk);
    }
  }

  end(deploymentId: string) {
    this.emit(deploymentId, "[done]");
    this.listeners.delete(deploymentId);
  }
}

export const logStream = new LogStream();
