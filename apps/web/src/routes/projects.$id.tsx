import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";

export function meta() {
  return [
    { title: "Forge — Project" },
    { name: "description", content: "Project details and deployment logs." },
  ];
}

const demoProjects: Record<string, {
  name: string;
  repoUrl: string;
  branch: string;
  framework: string;
  status: string;
  domain: string;
  lastDeployed: string;
  commitMessage: string;
  commitHash: string;
  commitAuthor: string;
  deploymentId: string;
  deployStatus: string;
  buildDuration: string;
}> = {
  "1": {
    name: "forge-web",
    repoUrl: "https://github.com/acme/forge-web",
    branch: "main",
    framework: "Next.js",
    status: "active",
    domain: "forge.acme.dev",
    lastDeployed: "2 hours ago",
    commitMessage: "feat: add domain management",
    commitHash: "a3f7c2d",
    commitAuthor: "alice",
    deploymentId: "dep-001",
    deployStatus: "live",
    buildDuration: "34s",
  },
  "2": {
    name: "api-gateway",
    repoUrl: "https://github.com/acme/api-gateway",
    branch: "main",
    framework: "Express",
    status: "active",
    domain: "api.acme.dev",
    lastDeployed: "5 hours ago",
    commitMessage: "fix: rate limiting middleware",
    commitHash: "e9b1a44",
    commitAuthor: "bob",
    deploymentId: "dep-002",
    deployStatus: "live",
    buildDuration: "22s",
  },
  "3": {
    name: "docs-site",
    repoUrl: "https://github.com/acme/docs-site",
    branch: "main",
    framework: "Astro",
    status: "active",
    domain: "docs.acme.dev",
    lastDeployed: "1 day ago",
    commitMessage: "chore: update dependencies",
    commitHash: "f1c8e3a",
    commitAuthor: "carol",
    deploymentId: "dep-003",
    deployStatus: "live",
    buildDuration: "41s",
  },
  "4": {
    name: "marketing-page",
    repoUrl: "https://github.com/acme/marketing-page",
    branch: "staging",
    framework: "Vite",
    status: "inactive",
    domain: "staging.acme.dev",
    lastDeployed: "3 days ago",
    commitMessage: "style: hero section redesign",
    commitHash: "b2d5f78",
    commitAuthor: "dave",
    deploymentId: "dep-004",
    deployStatus: "live",
    buildDuration: "18s",
  },
  "5": {
    name: "auth-service",
    repoUrl: "https://github.com/acme/auth-service",
    branch: "main",
    framework: "Express",
    status: "active",
    domain: "auth.acme.dev",
    lastDeployed: "6 hours ago",
    commitMessage: "feat: oauth2 provider support",
    commitHash: "c4a9e12",
    commitAuthor: "eve",
    deploymentId: "dep-005",
    deployStatus: "live",
    buildDuration: "29s",
  },
  "6": {
    name: "dashboard-ui",
    repoUrl: "https://github.com/acme/dashboard-ui",
    branch: "main",
    framework: "React",
    status: "archived",
    domain: "—",
    lastDeployed: "2 weeks ago",
    commitMessage: "refactor: migrate to new design system",
    commitHash: "d8f3b67",
    commitAuthor: "frank",
    deploymentId: "dep-006",
    deployStatus: "live",
    buildDuration: "25s",
  },
};

const mockLogs: Record<string, string[]> = {
  "1": [
    "[build] Cloning repository...",
    "[build] Resolving dependencies...",
    "[build] npm install completed in 12.4s",
    "[build] Running build script...",
    "[build] Compiling Next.js application...",
    "[build] Generating static pages...",
    "[build] Build completed in 34s",
    "[deploy] Creating container...",
    "[deploy] Configuring reverse proxy...",
    "[deploy] Health check passed",
    "[deploy] Deployment live at forge.acme.dev",
  ],
  "2": [
    "[build] Cloning repository...",
    "[build] Installing dependencies...",
    "[build] npm install completed in 8.2s",
    "[build] Running build script...",
    "[build] Build completed in 22s",
    "[deploy] Creating container...",
    "[deploy] Configuring reverse proxy...",
    "[deploy] Health check passed",
    "[deploy] Deployment live at api.acme.dev",
  ],
  "3": [
    "[build] Cloning repository...",
    "[build] Installing dependencies...",
    "[build] npm install completed in 15.1s",
    "[build] Running build script...",
    "[build] Building Astro site...",
    "[build] Optimizing assets...",
    "[build] Build completed in 41s",
    "[deploy] Creating container...",
    "[deploy] Configuring reverse proxy...",
    "[deploy] Health check passed",
    "[deploy] Deployment live at docs.acme.dev",
  ],
  "4": [
    "[build] Cloning repository...",
    "[build] Installing dependencies...",
    "[build] Build completed in 18s",
    "[deploy] Creating container...",
    "[deploy] Deployment live at staging.acme.dev",
  ],
  "5": [
    "[build] Cloning repository...",
    "[build] Installing dependencies...",
    "[build] npm install completed in 9.7s",
    "[build] Running build script...",
    "[build] Build completed in 29s",
    "[deploy] Creating container...",
    "[deploy] Configuring reverse proxy...",
    "[deploy] Health check passed",
    "[deploy] Deployment live at auth.acme.dev",
  ],
  "6": [
    "[build] Cloning repository...",
    "[build] Installing dependencies...",
    "[build] Build completed in 25s",
    "[deploy] Creating container...",
    "[deploy] Deployment live",
  ],
};

const statusStyles: Record<string, { bg: string; dot: string; label: string }> = {
  active: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Active" },
  inactive: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Inactive" },
  archived: { bg: "bg-neutral-100 text-neutral-500 border-neutral-200", dot: "bg-neutral-400", label: "Archived" },
  live: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Live" },
  building: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Building" },
  failed: { bg: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: "Failed" },
};

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? statusStyles.active;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border ${style.bg}`}
      style={{ borderRadius: "999px", fontFamily: "'JetBrains Mono', monospace" }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const project = demoProjects[params.id];
  const logs = mockLogs[params.id] ?? [];
  const [showLogs, setShowLogs] = useState(false);
  const [deployStatus, setDeployStatus] = useState(project?.deployStatus ?? "live");
  const [currentLogs, setCurrentLogs] = useState<string[]>(logs);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentLogs]);

  if (!project) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center" style={{ backgroundColor: "#edf5f6", fontFamily: "'JetBrains Mono', monospace" }}>
        <p className="text-neutral-500 text-sm">Project not found.</p>
        <Link to="/dashboard" className="mt-4 text-sm text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleRedeploy = () => {
    if (isRedeploying) return;
    setIsRedeploying(true);
    setDeployStatus("building");
    setShowLogs(true);
    setCurrentLogs([]);

    const deployLogs = [
      "[build] Cloning repository...",
      `[build] Checking out branch ${project.branch}...`,
      "[build] Installing dependencies...",
      "[build] npm install completed in 10.3s",
      "[build] Running build script...",
      `[build] Building ${project.framework} application...`,
      "[build] Build completed in 28s",
      "[deploy] Creating container...",
      "[deploy] Configuring reverse proxy...",
      "[deploy] Health check passed",
      `[deploy] Deployment live at ${project.domain}`,
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < deployLogs.length) {
        setCurrentLogs((prev) => [...prev, deployLogs[i]]);
        i++;
      } else {
        clearInterval(interval);
        setDeployStatus("live");
        setIsRedeploying(false);
      }
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "#edf5f6", fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Top Bar */}
      <header className="flex items-center justify-between px-8 md:px-12 py-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 bg-primary text-white text-sm font-bold"
            style={{ borderRadius: "8px" }}
          >
            F
          </div>
          <span className="text-lg font-semibold tracking-tight text-neutral-900">Forge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <Link to="/dashboard" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            Dashboard
          </Link>
          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium text-neutral-600">
            A
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 md:px-12 py-8 max-w-5xl mx-auto w-full">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <div className="bg-white border border-neutral-200 p-6 mb-4" style={{ borderRadius: "16px" }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-12 h-12 bg-neutral-100 text-neutral-700 text-lg font-bold shrink-0"
                style={{ borderRadius: "12px" }}
              >
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">{project.name}</h1>
                <p className="text-sm text-neutral-500 mt-0.5">{project.framework}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={deployStatus} />
              <button
                onClick={handleRedeploy}
                disabled={isRedeploying}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRedeploying ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deploying...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Redeploy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Project Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Repository Info */}
          <div className="bg-white border border-neutral-200 p-5" style={{ borderRadius: "16px" }}>
            <h2 className="text-sm font-semibold text-neutral-900 mb-4">Repository</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">URL</span>
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate max-w-[200px]"
                >
                  {project.repoUrl.replace("https://github.com/", "")}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Branch</span>
                <span className="text-neutral-900 font-medium">{project.branch}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Framework</span>
                <span className="text-neutral-900 font-medium">{project.framework}</span>
              </div>
            </div>
          </div>

          {/* Deployment Info */}
          <div className="bg-white border border-neutral-200 p-5" style={{ borderRadius: "16px" }}>
            <h2 className="text-sm font-semibold text-neutral-900 mb-4">Deployment</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Domain</span>
                {project.domain !== "—" ? (
                  <a
                    href={`https://${project.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {project.domain}
                  </a>
                ) : (
                  <span className="text-neutral-900 font-medium">{project.domain}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Last Deployed</span>
                <span className="text-neutral-900 font-medium">{project.lastDeployed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Build Duration</span>
                <span className="text-neutral-900 font-medium">{project.buildDuration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Commit */}
        <div className="bg-white border border-neutral-200 p-5 mb-4" style={{ borderRadius: "16px" }}>
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">Latest Commit</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600 shrink-0">
              {project.commitAuthor.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-900 truncate">{project.commitMessage}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-neutral-400">{project.commitHash}</span>
                <span className="text-xs text-neutral-400">by {project.commitAuthor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Logs */}
        <div className="bg-white border border-neutral-200 p-5" style={{ borderRadius: "16px" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900">Deployment Logs</h2>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {showLogs ? "Hide" : "Show"} Logs
            </button>
          </div>

          {showLogs && (
            <div
              className="bg-neutral-950 text-green-400 p-4 text-xs leading-relaxed overflow-y-auto max-h-72"
              style={{ borderRadius: "8px", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {currentLogs.length === 0 ? (
                <span className="text-neutral-500">Waiting for logs...</span>
              ) : (
                currentLogs.map((log, i) => (
                  <div key={i} className="py-0.5">{log}</div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          )}

          {!showLogs && (
            <p className="text-xs text-neutral-400">
              Click "Show Logs" to view the deployment output.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
