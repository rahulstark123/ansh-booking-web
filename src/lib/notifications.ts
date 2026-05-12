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
  const prisma = getPrisma();
  if (!prisma) return null;

  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
