import { Badge } from "@forge/ui/components/badge";
import { Button } from "@forge/ui/components/button";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";

import { api, type ApiResponse } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { env } from "@forge/env/web";
import type { Deployment } from "@/types";
import Loader from "@/components/loader";

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  live: "default",
  building: "secondary",
  queued: "outline",
  failed: "destructive",
};

export function meta() {
  return [{ title: "Deployment Logs — Forge" }];
}

export default function DeploymentLogs() {
  const { id: projectId, deploymentId } = useParams();
  const { data: session, isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (authPending) return;
    if (!session) { navigate("/login"); return; }

    if (!projectId || !deploymentId) return;

    api.get<ApiResponse<Deployment>>(`/api/projects/${projectId}/deployments/${deploymentId}`)
      .then((res) => setDeployment(res.data.data ?? null))
      .catch(() => toast.error("Deployment not found"))
      .finally(() => setLoading(false));

    const socket = io(env.VITE_SERVER_URL, {
      withCredentials: true,
      query: { projectId, deploymentId },
    });

    socket.on("connect", () => setConnected(true));
    socket.on("log", (chunk: string) => {
      if (chunk === "[done]") { doneRef.current = true; return; }
      setLogs((prev) => [...prev, chunk]);
    });
    socket.on("error", (msg: string) => {
      toast.error(msg);
    });
    socket.on("disconnect", () => setConnected(false));

    socketRef.current = socket;

    return () => { socket.disconnect(); };
  }, [projectId, deploymentId, session, authPending, navigate]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (authPending || loading) return <Loader />;
  if (!deployment) return null;

  return (
    <div className="mx-auto max-w-4xl w-full px-4 pt-8 pb-16">
      <Link
        to={`/projects/${projectId}`}
        className="text-sm text-muted-foreground hover:underline mb-4 inline-block"
      >
        &larr; Back to Project
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Deployment Logs</h1>
          <div className="flex gap-2 mt-1 items-center">
            <Badge variant={statusColor[deployment.status] ?? "outline"}>
              {deployment.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {connected ? "connected" : "disconnected"}
            </span>
            <span className={`inline-block size-1.5 rounded-full ${connected ? "bg-green-500" : "bg-muted"}`} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-black text-green-400 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[300px] max-h-[600px] overflow-y-auto">
        {logs.length === 0 ? (
          <span className="text-muted-foreground">Waiting for logs...</span>
        ) : (
          logs.map((line, i) => (
            <div key={i}>{line}</div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
