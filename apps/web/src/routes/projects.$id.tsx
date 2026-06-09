import { Badge } from "@forge/ui/components/badge";
import { Button } from "@forge/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@forge/ui/components/table";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";

import { api, type ApiResponse } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { env } from "@forge/env/web";
import type { Project } from "@/types";
import Loader from "@/components/loader";

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  live: "default",
  building: "secondary",
  queued: "outline",
  failed: "destructive",
};

export function meta() {
  return [{ title: "Project — Forge" }];
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { data: session, isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  function fetchProject() {
    if (!id) return;
    api.get<ApiResponse<Project>>(`/api/projects/${id}`)
      .then((res) => setProject(res.data.data ?? null))
      .catch(() => { toast.error("Project not found"); navigate("/dashboard"); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (authPending) return;
    if (!session) { navigate("/login"); return; }
    fetchProject();
  }, [id, session, authPending, navigate]);

  const latestDeployment = project?.deployments?.length
    ? project.deployments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;
  const isBuilding = latestDeployment?.status === "queued" || latestDeployment?.status === "building";

  useEffect(() => {
    if (!id || !latestDeployment || !isBuilding) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setLogs([]);
      setConnected(false);
      doneRef.current = false;
      return;
    }

    const socket = io(env.VITE_SERVER_URL, {
      withCredentials: true,
      query: { projectId: id, deploymentId: latestDeployment.id },
    });

    socket.on("connect", () => setConnected(true));
    socket.on("log", (chunk: string) => {
      if (chunk === "[done]") { doneRef.current = true; return; }
      setLogs((prev) => [...prev, chunk]);
    });
    socket.on("error", (msg: string) => toast.error(msg));
    socket.on("disconnect", () => setConnected(false));

    socketRef.current = socket;

    return () => { socket.disconnect(); };
  }, [id, latestDeployment?.id, isBuilding]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (!isBuilding) return;
    const interval = setInterval(fetchProject, 3000);
    return () => clearInterval(interval);
  }, [isBuilding, id]);

  async function handleRedeploy() {
    setDeploying(true);
    try {
      const res = await api.post<ApiResponse>(`/api/projects/${id}/deployments`, {});
      if (res.data.success) {
        toast.success("Deployment queued");
        await fetchProject();
      }
    } catch {
      toast.error("Failed to queue deployment");
    } finally {
      setDeploying(false);
    }
  }

  if (authPending || loading) return <Loader />;
  if (!project) return null;

  const deployments = project.deployments ?? [];

  return (
    <div className="mx-auto max-w-4xl w-full px-4 pt-8 pb-16">
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        &larr; Back to Dashboard
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1 break-all">{project.repoUrl}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRedeploy} disabled={deploying}>
            {deploying ? "Queuing..." : "Redeploy"}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-8 flex-wrap">
        <Info label="Branch" value={project.branch} />
        <Info label="Framework" value={project.framework ?? "Auto-detect"} />
        <Info label="Status" value={project.status} />
        {project.domains?.map((d) => (
          <a
            key={d.id}
            href={`http://${d.domain}.localhost:3000`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border px-3 py-2 text-xs hover:bg-muted transition-colors"
          >
            <p className="text-muted-foreground">Domain</p>
            <p className="font-medium underline">{d.domain}.localhost:3000</p>
          </a>
        ))}
      </div>

      {isBuilding && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Build Logs</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{connected ? "connected" : "disconnected"}</span>
              <span className={`inline-block size-1.5 rounded-full ${connected ? "bg-green-500" : "bg-muted"}`} />
            </div>
          </div>
          <div className="rounded-lg border bg-black text-green-400 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[200px] max-h-[400px] overflow-y-auto">
            {logs.length === 0 ? (
              <span className="text-muted-foreground">Waiting for logs...</span>
            ) : (
              logs.map((line, i) => <div key={i}>{line}</div>)
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      <h2 className="font-semibold mb-3">Deployments</h2>

      {deployments.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No deployments yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deployments.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Link to={`/projects/${id}/deployments/${d.id}`}>
                    <Badge variant={statusColor[d.status] ?? "outline"}>{d.status}</Badge>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{d.triggeredBy}</TableCell>
                <TableCell className="font-mono text-xs">{d.branch}</TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {new Date(d.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2 text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
