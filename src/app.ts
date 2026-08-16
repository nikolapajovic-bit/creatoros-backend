import express, { type Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/errorHandler";

import authRoutes from "@/modules/auth/auth.routes";
import dealRoutes from "@/modules/deals/deal.routes";
import contractRoutes from "@/modules/contracts/contract.routes";
import financeRoutes from "@/modules/finance/finance.routes";
import eventRoutes from "@/modules/calendar/event.routes";
import notificationRoutes from "@/modules/notifications/notification.routes";
import mediaRoutes from "@/modules/media/media.routes";
import messageRoutes from "@/modules/messages/message.routes";
import userRoutes from "@/modules/users/user.routes";
import aiRoutes from "@/modules/ai/ai.routes";
import onboardingRoutes from "@/modules/users/onboarding.routes";
import analyticsRoutes from "@/modules/analytics/analytics.routes";
import { UPLOAD_DIR } from "@/config/paths";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1);

  // Security & parsing middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.CLIENT_URL.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  if (env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // Health check — korisno za deployment/monitoring provere
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Rute
  app.use("/api/auth", authRoutes);
  app.use("/api/deals", dealRoutes);
  app.use("/api/contracts", contractRoutes);
  app.use("/api/finance", financeRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/media", mediaRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/onboarding", onboardingRoutes);
  app.use("/api/analytics", analyticsRoutes);

  // Servira upload-ovane fajlove kao staticke resurse
  app.use("/uploads", express.static(UPLOAD_DIR));

  // Error handler MORA biti poslednji middleware
  app.use(errorHandler);

  return app;
}
