import { getPrisma } from "./prisma";

export type NotificationType = "booking" | "slot" | "system" | "integration";

export async function createNotification({
  userId,
  title,
  message,
  type = "system",
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  console.log(`[Notification] Creating: ${title} for user: ${userId}`);
  const prisma = getPrisma();
  
  if (!prisma) {
    console.error("[Notification] Prisma client not available");
    return null;
  }

  // Double check if the model exists on the client (might be stale cache)
  if (!("notification" in prisma)) {
    console.error("[Notification] 'notification' model not found on Prisma client. You might need to restart your dev server.");
    return null;
  }

  try {
    const result = await (prisma as any).notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
    console.log(`[Notification] Created successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error("[Notification] Failed to create notification:", error);
  }
}
