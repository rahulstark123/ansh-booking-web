import { getPrisma } from "../src/lib/prisma";

async function seedNotification() {
  const prisma = getPrisma();
  if (!prisma) {
    console.error("Prisma not available");
    return;
  }

  // Get the first user
  const user = await prisma.userProfile.findFirst();
  if (!user) {
    console.error("No user found in DB");
    return;
  }

  console.log(`Seeding notification for user: ${user.fullName} (${user.id})`);

  try {
    const n = await (prisma as any).notification.create({
      data: {
        userId: user.id,
        title: "Welcome to Notification Center",
        message: "This is a test notification to verify the system is working.",
        type: "system",
        link: "/dashboard",
      },
    });
    console.log(`Created notification: ${n.id}`);
  } catch (err) {
    console.error("Failed to seed:", err);
  } finally {
    process.exit(0);
  }
}

seedNotification();
