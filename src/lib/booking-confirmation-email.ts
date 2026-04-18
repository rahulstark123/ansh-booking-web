import nodemailer from "nodemailer";

type BookingConfirmationEmailInput = {
  bookingId?: string;
  guestName: string;
  guestEmail: string;
  hostName: string;
  hostEmail?: string;
  eventName: string;
  startsAt: Date;
  endsAt: Date;
  meetingLink?: string | null;
  timezone?: string;
  notes?: string | null;
};

const DEFAULT_TIMEZONE = "Asia/Kolkata";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Nodemailer `from` value; structured form is more reliably preserved by SMTP than a raw string. */
type MailFrom = string | { name: string; address: string };

const DEFAULT_BOOKING_FROM_NAME = "Ansh Bookings";

function buildFromHeader(): MailFrom | undefined {
  const addr = process.env.EMAIL_FROM?.trim() || process.env.SMTP_FROM?.trim();
  if (!addr) return undefined;
  // Full RFC header in one env var, e.g. Ansh Bookings <bookings@domain>
  if (addr.includes("<") && addr.includes(">")) return addr;

  const rawName = process.env.EMAIL_FROM_NAME;
  const displayName = rawName !== undefined ? rawName.trim() : DEFAULT_BOOKING_FROM_NAME;
  if (displayName) {
    return { name: displayName, address: addr };
  }
  return addr;
}

/** Bare address for ICS MAILTO: (From may be "Name" <addr> or structured). */
function emailFromFromHeader(from: MailFrom): string {
  if (typeof from === "object") return from.address.trim();
  const m = from.match(/<([^>]+)>/);
  return (m ? m[1] : from).trim();
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = buildFromHeader();
  const port = Number(process.env.SMTP_PORT || "587");
  // Port 465 = implicit TLS → secure: true. Port 587 = usually STARTTLS → secure: false.
  const secure =
    (process.env.SMTP_SECURE || (port === 465 ? "true" : "false")).toLowerCase() === "true";

  if (!host || !user || !pass || !from || Number.isNaN(port)) {
    return null;
  }

  return { host, user, pass, from, port, secure };
}

function formatWhen(startsAt: Date, endsAt: Date, timezone: string) {
  const date = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(startsAt);
  const startTime = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(startsAt);
  const endTime = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(endsAt);
  return `${date}, ${startTime} - ${endTime} (${timezone})`;
}

function buildTextBody(input: BookingConfirmationEmailInput): string {
  const when = formatWhen(input.startsAt, input.endsAt, input.timezone || DEFAULT_TIMEZONE);
  const addToGoogleCalendarUrl = buildGoogleCalendarLink(input);
  return [
    `Hi ${input.guestName},`,
    "",
    "Your meeting is confirmed.",
    "",
    `Event: ${input.eventName}`,
    `Host: ${input.hostName}`,
    `When: ${when}`,
    input.meetingLink ? `Meeting link: ${input.meetingLink}` : "Meeting link: Will be shared soon.",
    `Add to Google Calendar: ${addToGoogleCalendarUrl}`,
    input.notes?.trim() ? `Notes: ${input.notes.trim()}` : null,
    "",
    "If you need to reschedule, please contact the host.",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatUtcForGoogleCalendar(date: Date): string {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

function buildGoogleCalendarLink(input: BookingConfirmationEmailInput): string {
  const details = [
    `Booked with ${input.hostName}`,
    input.meetingLink ? `Join: ${input.meetingLink}` : null,
    input.notes?.trim() ? `Notes: ${input.notes.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.eventName,
    dates: `${formatUtcForGoogleCalendar(input.startsAt)}/${formatUtcForGoogleCalendar(input.endsAt)}`,
    details,
  });
  if (input.meetingLink) {
    params.set("location", input.meetingLink);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildHtmlBody(input: BookingConfirmationEmailInput): string {
  const when = formatWhen(input.startsAt, input.endsAt, input.timezone || DEFAULT_TIMEZONE);
  const guestName = escapeHtml(input.guestName);
  const eventName = escapeHtml(input.eventName);
  const hostName = escapeHtml(input.hostName);
  const safeWhen = escapeHtml(when);
  const safeNotes = input.notes?.trim() ? escapeHtml(input.notes.trim()) : null;
  const safeMeetingLink =
    input.meetingLink && /^https?:\/\//i.test(input.meetingLink) ? input.meetingLink : null;
  const addToGoogleCalendarUrl = buildGoogleCalendarLink(input);
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <p>Hi ${guestName},</p>
      <p>Your meeting is confirmed.</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        <tr><td><strong>Event</strong></td><td>${eventName}</td></tr>
        <tr><td><strong>Host</strong></td><td>${hostName}</td></tr>
        <tr><td><strong>When</strong></td><td>${safeWhen}</td></tr>
        <tr><td><strong>Meeting link</strong></td><td>${
          safeMeetingLink
            ? `<a href="${safeMeetingLink}" target="_blank" rel="noreferrer">Join meeting</a>`
            : "Will be shared soon."
        }</td></tr>
        <tr><td><strong>Calendar</strong></td><td><a href="${addToGoogleCalendarUrl}" target="_blank" rel="noreferrer">Add to Google Calendar</a></td></tr>
        ${
          safeNotes
            ? `<tr><td><strong>Notes</strong></td><td>${safeNotes}</td></tr>`
            : ""
        }
      </table>
      <p style="margin-top: 16px;">If you need to reschedule, please contact the host.</p>
    </div>
  `;
}

function buildIcalAttachment(input: BookingConfirmationEmailInput, smtpFrom: MailFrom) {
  return {
    method: "REQUEST" as const,
    filename: "booking-invite.ics",
    content: [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Ansh Booking//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${input.bookingId || `${Date.now()}-${input.guestEmail}`}@ansh-booking`,
      `DTSTAMP:${formatUtcForGoogleCalendar(new Date())}`,
      `DTSTART:${formatUtcForGoogleCalendar(input.startsAt)}`,
      `DTEND:${formatUtcForGoogleCalendar(input.endsAt)}`,
      `SUMMARY:${input.eventName.replaceAll("\n", " ")}`,
      `DESCRIPTION:${buildTextBody(input).replaceAll("\n", "\\n")}`,
      input.meetingLink ? `LOCATION:${input.meetingLink}` : "",
      `ORGANIZER;CN=${input.hostName}:MAILTO:${input.hostEmail || emailFromFromHeader(smtpFrom)}`,
      `ATTENDEE;CN=${input.guestName};RSVP=TRUE:MAILTO:${input.guestEmail}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n"),
  };
}

export async function sendBookingConfirmationEmail(input: BookingConfirmationEmailInput): Promise<void> {
  const smtp = getSmtpConfig();
  if (!smtp) {
    console.warn(
      "[booking-confirmation-email] No email sent: set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM (or SMTP_FROM). Port 465 usually needs SMTP_SECURE=true.",
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
    tls: {
      minVersion: "TLSv1.2" as const,
    },
  });

  const baseMail = {
    from: smtp.from,
    to: input.guestEmail,
    replyTo: input.hostEmail || smtp.from,
    subject: `Booking Confirmed: ${input.eventName}`,
    text: buildTextBody(input),
    html: buildHtmlBody(input),
  };

  try {
    await transporter.sendMail({
      ...baseMail,
      icalEvent: buildIcalAttachment(input, smtp.from),
    });
  } catch (firstErr) {
    // Some providers (incl. shared hosting SMTP) reject calendar MIME; send body-only so the guest still gets mail.
    console.warn(
      "[booking-confirmation-email] Send with calendar attachment failed; retrying without ICS.",
      firstErr instanceof Error ? firstErr.message : firstErr,
    );
    await transporter.sendMail(baseMail);
  }
}
