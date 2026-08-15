import { createServer } from "http";
import { createApp } from "@/app";
import { connectDB } from "@/config/db";
import { env } from "@/config/env";
import { initSockets } from "@/sockets";
import { startDeadlineReminderJob } from "@/jobs/deadlineReminders.job";

async function bootstrap() {
  await connectDB();

  const app = createApp();
  const httpServer = createServer(app);

  initSockets(httpServer);
  startDeadlineReminderJob();

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Socket.io ready`);
  });
}

bootstrap().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
