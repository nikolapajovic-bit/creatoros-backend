import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";
import { AppError } from "@/utils/AppError";

export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");
      throw new AppError(message, 400);
    }

    const data = result.data as {
      body?: unknown;
      params?: Record<string, string>;
      query?: Record<string, unknown>;
    };

    req.body = data.body ?? req.body;
    if (data.params) {
      Object.assign(req.params, data.params);
    }
    if (data.query) {
      req.validatedQuery = data.query;
    }
    next();
  };
}
