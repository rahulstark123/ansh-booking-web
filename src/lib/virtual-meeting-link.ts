import { randomBytes } from "crypto";

type LocationKind = "google-meet" | "zoom" | "phone" | "in-person" | string;

function alphaCode(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

function numberCode(length: number): string {
  const chars = "0123456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

export function buildVirtualMeetingLink(location: LocationKind): string | null {
  if (location === "google-meet") {
    return `https://meet.google.com`;
  }
  if (location === "zoom") {
    return `https://zoom.us/join`;
  }
  return null;
}
