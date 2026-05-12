import { getPrisma } from "../src/lib/prisma";

async function checkNotifications() {
  const prisma = getPrisma();
  if (!prisma) {
    console.error("Prisma not available");
    return;
  }

  try {
    const count = await prisma.notification.count();
    console.log(`Total notifications in DB: ${count}`);

    const latest = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    console.log("Latest 5 notifications:", JSON.stringify(latest, null, 2));
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    process.exit(0);
  }
}

checkNotifications();
