import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError";
import { env } from "@/config/env";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Poznata, "operativna" greška — bacena namerno kroz kod (npr. AppError("Not found", 404))
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  // Mongoose validation greška (npr. required polje nedostaje)
  if (
    err &&
    typeof err === "object" &&
    "name" in err &&
    err.name === "ValidationError" &&
    "message" in err
  ) {
    res.status(400).json({
      status: "error",
      message: "Validation failed",
      details: err.message,
    });
    return;
  }

  // Mongoose duplicate key greška (npr. email koji već postoji, unique index)
  if (err && typeof err === "object" && "code" in err && err.code === 11000) {
    res.status(409).json({
      status: "error",
      message: "A record with this value already exists",
    });
    return;
  }

  // Nepoznata/neočekivana greška — pravi bag u kodu
  console.error("💥 Unexpected error:", err);
  res.status(500).json({
    status: "error",
    message:
      env.NODE_ENV === "production" ? "Something went wrong" : String(err),
  });
}
