export interface Project {
  id: string;
  userId: string;
  name: string;
  repoUrl: string | null;
  branch: string;
  framework: string | null;
  status: "active" | "inactive" | "archived";
  createdAt: string;
  updatedAt: string;
  domains?: Domain[];
  deployments?: Deployment[];
}

export interface Domain {
  id: string;
  projectId: string;
  domain: string;
  isPrimary: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: "queued" | "building" | "live" | "failed";
  commitHash: string | null;
  commitMessage: string | null;
  branch: string;
  triggeredBy: "manual" | "webhook" | "rollback";
  containerPort: number | null;
  containerId: string | null;
  buildDuration: number | null;
  createdAt: string;
  updatedAt: string;
}
