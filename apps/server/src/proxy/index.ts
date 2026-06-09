import type { Request, Response, NextFunction } from "express";
import { db } from "@forge/db";
import { domain } from "@forge/db/schema/domains";
import { eq } from "drizzle-orm";

export async function subdomainProxy(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const host = req.headers.host;
  if (!host) {
    next();
    return;
  }

  const subdomain = extractSubdomain(host);
  if (!subdomain) {
    next();
    return;
  }

  try {
    const record = await db.query.domain.findFirst({
      where: eq(domain.domain, subdomain),
      with: {
        project: {
          with: {
            deployments: true,
          },
        },
      },
    });

    if (!record?.project) {
      next();
      return;
    }

    const liveDeployment = record.project.deployments.find(
      (d) => d.status === "live" && d.containerPort != null,
    );

    if (!liveDeployment?.containerPort) {
      next();
      return;
    }

    const target = `http://localhost:${liveDeployment.containerPort}`;

    const response = await fetch(`${target}${req.url}`, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: req.method !== "GET" && req.method !== "HEAD"
        ? JSON.stringify(req.body)
        : undefined,
    });

    for (const [key, value] of response.headers) {
      const lower = key.toLowerCase();
      if (!["content-encoding", "transfer-encoding", "content-length"].includes(lower)) {
        res.setHeader(key, value);
      }
    }

    res.status(response.status);
    const text = await response.text();
    res.send(text);
  } catch (_err) {
    res.status(502).json({ error: "Container not available. Redeploy the project." });
  }
}

function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0] ?? "";
  const parts = hostname.split(".");
  if (parts.length >= 2 && parts.at(-1) === "localhost") {
    return parts.slice(0, -1).join(".");
  }
  return null;
}
