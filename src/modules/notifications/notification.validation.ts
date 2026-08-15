import { z } from "zod";

export const notificationParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
