import type { Role } from "@/modules/users/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export {};
