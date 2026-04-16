import { NextRequest, NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

type ContactUsBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  let body: ContactUsBody;
  try {
    body = (await req.json()) as ContactUsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone?.trim() ?? "";
  const subject = body.subject?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!fullName || !email || !message) {
    return NextResponse.json({ error: "fullName, email and message are required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }
  if (phone && !/^[\d\s()+-]{7,20}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone format." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Message is too short." }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const created = await prisma.contactInquiry.create({
      data: {
        fullName,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
        source: "website-contact-form",
      },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[api/contact-us][POST]", e);
    return NextResponse.json({ error: "Failed to submit contact request." }, { status: 500 });
  }
}
