import cron from "node-cron";
import { Event } from "@/modules/calendar/event.model";
import { Contract } from "@/modules/contracts/contract.model";
import { notifyUser } from "@/services/notification.service";

const REMINDER_DAYS = [5, 3, 1];

function daysUntil(date: Date): number {
  const now = new Date();
  const target = new Date(date);
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

async function checkDeadlineReminders() {
  console.log("⏰ Running deadline reminders check...");

  const events = await Event.find({ sourceType: { $exists: true } });

  for (const event of events) {
    const remaining = daysUntil(event.date);

    if (!REMINDER_DAYS.includes(remaining)) continue;
    if (event.remindersSent.includes(remaining)) continue;

    const isLastDay = remaining === 1;
    const title = isLastDay
      ? "🔥 Deadline is tomorrow!"
      : `Deadline in ${remaining} days`;
    const description = isLastDay
      ? `"${event.title}" is due tomorrow — don't miss it!`
      : `"${event.title}" is due in ${remaining} days`;

    await notifyUser({
      owner: event.owner.toString(),
      type: "deadline",
      title,
      description,
      relatedBrand: event.relatedBrand,
      link:
        event.sourceType === "deal"
          ? `/deals/${event.sourceId}`
          : `/contracts/${event.sourceId}`,
    });

    event.remindersSent.push(remaining);
    await event.save();
  }
}

async function checkExpiredContracts() {
  const now = new Date();
  const expired = await Contract.find({
    expiryDate: { $lt: now },
    status: { $nin: ["signed", "declined", "expired"] },
  });

  for (const contract of expired) {
    contract.status = "expired";
    await contract.save();
    await Event.deleteMany({ sourceType: "contract", sourceId: contract._id });

    await notifyUser({
      owner: contract.creator.toString(),
      type: "contract",
      title: "Contract expired",
      description: `"${contract.title}" has expired without being signed`,
      relatedBrand: contract.brand,
      link: `/contracts/${contract._id}`,
    });
  }
}

export function startDeadlineReminderJob() {
  // Pokreće se svaki dan u 09:00
  cron.schedule("0 9 * * *", async () => {
    try {
      await checkDeadlineReminders();
      await checkExpiredContracts();
    } catch (error) {
      console.error("Deadline reminder job failed:", error);
    }
  });

  console.log("✅ Deadline reminder job scheduled (daily at 09:00)");
}
