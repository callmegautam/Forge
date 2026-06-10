export type Framework = "nextjs" | "react-vite" | "express";

export interface DetectedFramework {
  framework: Framework;
  internalPort: number;
  buildCommand: string;
  startCommand: string;
  outputDir: string;
}

const FRAMEWORK_CONFIG: Record<Framework, DetectedFramework> = {
  nextjs: {
    framework: "nextjs",
    internalPort: 3000,
    buildCommand: "npm run build",
    startCommand: "npm start",
    outputDir: ".next",
  },
  "react-vite": {
    framework: "react-vite",
    internalPort: 5173,
    buildCommand: "npm run build",
    startCommand: "",
    outputDir: "dist",
  },
  express: {
    framework: "express",
    internalPort: 3000,
    buildCommand: "",
    startCommand: "npm start",
    outputDir: "",
  },
};

export function detectFramework(pkg: Record<string, unknown>): DetectedFramework {
  const deps = {
    ...(pkg.dependencies as Record<string, string> || {}),
    ...(pkg.devDependencies as Record<string, string> || {}),
  };
  if (deps.next) return FRAMEWORK_CONFIG.nextjs;
  if (deps.vite) return FRAMEWORK_CONFIG["react-vite"];
  if (deps.express) return FRAMEWORK_CONFIG.express;
  return FRAMEWORK_CONFIG.express;
}

export function generateDockerfile(config: DetectedFramework): string {
  if (config.framework === "react-vite") {
    return [
      "FROM node:20-alpine",
      "WORKDIR /app",
      "COPY package*.json ./",
      "RUN npm install",
      "COPY . .",
      `EXPOSE ${config.internalPort}`,
      `CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]`,
    ].join("\n");
  }
  const lines: string[] = [];
  lines.push("FROM node:20-alpine AS builder");
  lines.push("WORKDIR /app");
  lines.push("COPY package*.json ./");
  lines.push("RUN npm ci 2>/dev/null || npm install");
  lines.push("COPY . .");
  if (config.buildCommand) {
    lines.push(`RUN ${config.buildCommand}`);
  }
  lines.push("");
  lines.push("FROM node:20-alpine AS runner");
  lines.push("WORKDIR /app");
  if (config.framework === "nextjs") {
    lines.push("COPY --from=builder /app/.next ./.next");
    lines.push("COPY --from=builder /app/public ./public");
  }
  lines.push("COPY --from=builder /app/package.json ./package.json");
  lines.push("COPY --from=builder /app/node_modules ./node_modules");
  lines.push(`EXPOSE ${config.internalPort}`);
  lines.push(`CMD [${config.startCommand.split(" ").map(s => `"${s}"`).join(", ")}]`);
  return lines.join("\n");
}
