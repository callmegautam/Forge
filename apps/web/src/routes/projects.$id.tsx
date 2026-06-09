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
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { api, type ApiResponse } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Project, Deployment } from "@/types";
import Loader from "@/components/loader";

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  live: "default",
  building: "secondary",
  queued: "outline",
  failed: "destructive",
};

export function meta({ params }: { params: { id: string } }) {
  return [{ title: `Project — Forge` }];
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { data: session, isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    if (authPending) return;
    if (!session) { navigate("/login"); return; }
    api.get<ApiResponse<Project>>(`/api/projects/${id}`)
      .then((res) => setProject(res.data.data ?? null))
      .catch(() => { toast.error("Project not found"); navigate("/dashboard"); })
      .finally(() => setLoading(false));
  }, [id, session, authPending, navigate]);

  async function handleRedeploy() {
    setDeploying(true);
    try {
      const res = await api.post<ApiResponse>(`/api/projects/${id}/deployments`, {});
      if (res.data.success) {
        toast.success("Deployment queued");
        const dep = await api.get<ApiResponse<Project>>(`/api/projects/${id}`);
        setProject(dep.data.data ?? null);
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
          <Info key={d.id} label="Domain" value={`${d.domain}.localhost`} />
        ))}
      </div>

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
              <TableHead>Port</TableHead>
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
                <TableCell className="font-mono text-xs">{d.containerPort ?? "—"}</TableCell>
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
