import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError";
import type { Role } from "@/modules/users/user.model";

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403,
      );
    }

    next();
  };
}
