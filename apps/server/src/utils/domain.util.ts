export function extractRepoName(repoUrl: string): string {
  const url = new URL(repoUrl);
  const path = url.pathname.replace(/\.git$/, "").replace(/\/$/, "");
  const segments = path.split("/").filter(Boolean);
  const name = segments[segments.length - 1] || "project";
  return name.toLowerCase();
}

export function sanitizeDomainLabel(name: string): string {
  return name
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

export function generateDomainSlug(repoUrl: string): string {
  const name = extractRepoName(repoUrl);
  return sanitizeDomainLabel(name);
}

export function generateRandomSuffix(): string {
  return Math.random().toString(36).substring(2, 8);
}

export function makeUniqueDomainCandidate(
  baseSlug: string,
  suffix: string,
): string {
  return `${baseSlug}-${suffix}`;
}
