import {
  makeUniqueDomainCandidate,
  generateRandomSuffix,
} from "../utils/domain.util";
import { db } from "@forge/db";
import { domain } from "@forge/db/schema/domains";
import { eq } from "drizzle-orm";

export async function domainExists(domainName: string) {
  const existing = await db.query.domain.findFirst({
    where: eq(domain.domain, domainName),
  });
  return !!existing;
}

export async function findUniqueDomain(baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  while (await domainExists(candidate)) {
    candidate = makeUniqueDomainCandidate(baseSlug, generateRandomSuffix());
  }
  return candidate;
}
