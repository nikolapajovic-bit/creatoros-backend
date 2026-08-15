import type { Request, Response, NextFunction } from "express";
import { logAudit } from "@/services/auditLog.service";
import type { AuditAction } from "@/models/auditLog.model";

const METHOD_TO_ACTION: Record<string, AuditAction | undefined> = {
  POST: "create",
  PATCH: "update",
  PUT: "update",
  DELETE: "delete",
};

/**
 * Generički audit middleware — kači se na rute koje menjaju podatke (POST/PATCH/PUT/DELETE).
 * `resourceName` se prosleđuje eksplicitno po ruti (npr. "Deal", "Contract") jer ga ne možemo
 * pouzdano izvesti iz URL-a u svakom slučaju.
 */
export function auditLog(resourceName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const action = METHOD_TO_ACTION[req.method];
    if (!action || !req.user) {
      next();
      return;
    }

    // Presrećemo res.json() da uhvatimo šta kontroler vraća — jedini pouzdan način
    // da dobijemo _id novokreiranog resursa (ne postoji u req.params kod POST-a)
    let responseBody: unknown;
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      responseBody = body;
      return originalJson(body);
    };

    res.on("finish", () => {
      if (res.statusCode >= 400) return;

      const paramId =
        (req.params.id as string | undefined) ??
        (req.params.conversationId as string | undefined);

      const bodyId = extractIdFromResponse(responseBody);
      const resourceId = paramId ?? bodyId ?? "unknown";

      logAudit({
        actor: req.user!.id,
        action,
        resource: resourceName,
        resourceId,
        after: action !== "delete" ? req.body : undefined,
        ip: req.ip,
      });
    });

    next();
  };
}

function extractIdFromResponse(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;

  // Odgovori su oblika { deal: {...} }, { contract: {...} }, itd. — uzmi prvi objekat sa _id poljem
  for (const value of Object.values(record)) {
    if (value && typeof value === "object" && "_id" in value) {
      return String((value as { _id: unknown })._id);
    }
  }
  return undefined;
}
