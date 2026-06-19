export function meta() {
  return [
    { title: "Forge — Dashboard" },
    { name: "description", content: "Manage your deployed projects." },
  ];
}

const demoProjects = [
  {
    id: "1",
    name: "forge-web",
    repoUrl: "https://github.com/acme/forge-web",
    branch: "main",
    framework: "Next.js",
    status: "active",
    domain: "forge.acme.dev",
    lastDeployed: "2 hours ago",
    commitMessage: "feat: add domain management",
  },
  {
    id: "2",
    name: "api-gateway",
    repoUrl: "https://github.com/acme/api-gateway",
    branch: "main",
    framework: "Express",
    status: "active",
    domain: "api.acme.dev",
    lastDeployed: "5 hours ago",
    commitMessage: "fix: rate limiting middleware",
  },
  {
    id: "3",
    name: "docs-site",
    repoUrl: "https://github.com/acme/docs-site",
    branch: "main",
    framework: "Astro",
    status: "active",
    domain: "docs.acme.dev",
    lastDeployed: "1 day ago",
    commitMessage: "chore: update dependencies",
  },
  {
    id: "4",
    name: "marketing-page",
    repoUrl: "https://github.com/acme/marketing-page",
    branch: "staging",
    framework: "Vite",
    status: "inactive",
    domain: "staging.acme.dev",
    lastDeployed: "3 days ago",
    commitMessage: "style: hero section redesign",
  },
  {
    id: "5",
    name: "auth-service",
    repoUrl: "https://github.com/acme/auth-service",
    branch: "main",
    framework: "Express",
    status: "active",
    domain: "auth.acme.dev",
    lastDeployed: "6 hours ago",
    commitMessage: "feat: oauth2 provider support",
  },
  {
    id: "6",
    name: "dashboard-ui",
    repoUrl: "https://github.com/acme/dashboard-ui",
    branch: "main",
    framework: "React",
    status: "archived",
    domain: "—",
    lastDeployed: "2 weeks ago",
    commitMessage: "refactor: migrate to new design system",
  },
];

const statusStyles: Record<string, { bg: string; dot: string; label: string }> = {
  active: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Active" },
  inactive: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Inactive" },
  archived: { bg: "bg-neutral-100 text-neutral-500 border-neutral-200", dot: "bg-neutral-400", label: "Archived" },
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

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "#edf5f6", fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Top Bar */}
      <header className="flex items-center justify-between px-8 md:px-12 py-5   shrink-0">
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
          <a href="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            Home
          </a>
          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium text-neutral-600">
            A
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 md:px-12 py-8 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
            <p className="text-sm text-neutral-500 mt-1">Manage and deploy your repositories</p>
          </div>
          <button
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-full hover:opacity-90 transition-opacity"
          >
            + New Project
          </button>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-neutral-200 p-5 flex flex-col gap-4 hover:border-neutral-300 transition-colors cursor-pointer"
              style={{ borderRadius: "16px" }}
            >
              {/* Top Row: Name + Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center w-9 h-9 bg-neutral-100 text-neutral-700 text-xs font-bold shrink-0"
                    style={{ borderRadius: "8px" }}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 leading-tight">{project.name}</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{project.framework}</p>
                  </div>
                </div>
                <StatusBadge status={project.status} />
              </div>

              {/* Details */}
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-neutral-500">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="truncate">{project.domain}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-500">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="truncate">{project.repoUrl.replace("https://github.com/", "")}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-500">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>{project.branch}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-400">{project.lastDeployed}</span>
                <span className="text-xs text-neutral-400 truncate max-w-[180px]" title={project.commitMessage}>
                  {project.commitMessage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
