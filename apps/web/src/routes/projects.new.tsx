import { Button } from "@forge/ui/components/button";
import { Input } from "@forge/ui/components/input";
import { Label } from "@forge/ui/components/label";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { api, type ApiResponse } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import Loader from "@/components/loader";

const frameworks = [
  { value: "", label: "Auto-detect" },
  { value: "nextjs", label: "Next.js" },
  { value: "react-vite", label: "React (Vite)" },
  { value: "express", label: "Express" },
];

export function meta() {
  return [{ title: "New Project — Forge" }];
}

export default function NewProject() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [framework, setFramework] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && !session) navigate("/login");
  }, [session, isPending, navigate]);

  if (isPending) return <Loader />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse>("/api/projects", {
        repoUrl,
        branch: branch || "main",
        framework: framework || undefined,
      });
      if (res.data.success) {
        toast.success("Project created");
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to create project";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg w-full px-4 pt-8 pb-16">
      <h1 className="text-2xl font-bold mb-1">New Project</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Deploy a GitHub repository.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="repoUrl">Repository URL</Label>
          <Input
            id="repoUrl"
            placeholder="https://github.com/user/repo.git"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="branch">Branch</Label>
          <Input
            id="branch"
            placeholder="main"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="framework">Framework</Label>
          <select
            id="framework"
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {frameworks.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" disabled={!repoUrl || submitting} className="w-full">
          {submitting ? "Creating..." : "Create Project"}
        </Button>
      </form>
    </div>
  );
}
