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
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { api, type ApiResponse } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Project } from "@/types";
import Loader from "@/components/loader";

const statusColor: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  inactive: "secondary",
  archived: "outline",
};

export function meta() {
  return [{ title: "Dashboard — Forge" }];
}

export default function Dashboard() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authPending) return;
    if (!session) {
      navigate("/login");
      return;
    }
    api.get<ApiResponse<Project[]>>("/api/projects")
      .then((res) => setProjects(res.data.data ?? []))
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  }, [session, authPending, navigate]);

  if (authPending || loading) return <Loader />;

  const liveCount = projects.filter((p) =>
    p.deployments?.some((d) => d.status === "live"),
  ).length;

  return (
    <div className="mx-auto max-w-4xl w-full px-4 pt-8 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {session?.user.name}
          </p>
        </div>
        <Link to="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="rounded-lg border p-4 flex-1">
          <p className="text-2xl font-bold">{projects.length}</p>
          <p className="text-xs text-muted-foreground">Total Projects</p>
        </div>
        <div className="rounded-lg border p-4 flex-1">
          <p className="text-2xl font-bold">{liveCount}</p>
          <p className="text-xs text-muted-foreground">Live Deployments</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No projects yet.</p>
          <Link to="/projects/new">
            <Button variant="outline" className="mt-4">Create your first project</Button>
          </Link>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Framework</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link to={`/projects/${p.id}`} className="hover:underline font-medium">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.framework ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={statusColor[p.status] ?? "outline"}>{p.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{p.branch}</TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {new Date(p.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
