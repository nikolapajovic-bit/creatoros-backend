import "dotenv/config";
import mongoose from "mongoose";
import { env } from "@/config/env";
import { User } from "@/modules/users/user.model";
import { Notification } from "@/modules/notifications/notification.model";

async function seed() {
  await mongoose.connect(env.MONGODB_URI);

  const user = await User.findOne({ email: "ana@test.com" });
  if (!user) {
    console.error("❌ Test user not found — run register first");
    process.exit(1);
  }

  await Notification.insertMany([
    {
      owner: user._id,
      type: "deadline",
      title: "Reel due tomorrow",
      description: "Nova Beauty summer campaign — submit by Aug 4",
      relatedBrand: "Nova Beauty",
    },
    {
      owner: user._id,
      type: "deal",
      title: "New inquiry received",
      description: "Pulse Audio wants to collaborate on a headphone review",
      relatedBrand: "Pulse Audio",
    },
    {
      owner: user._id,
      type: "payment",
      title: "Payout completed",
      description: "$1,200 transferred to your bank account",
      read: true,
    },
  ]);

  console.log("✅ Seeded notifications");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
