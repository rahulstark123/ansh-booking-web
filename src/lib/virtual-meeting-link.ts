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
    const code = `${alphaCode(3)}-${alphaCode(4)}-${alphaCode(3)}`;
    return `https://meet.google.com/${code}`;
  }
  if (location === "zoom") {
    const room = numberCode(10);
    const pwd = alphaCode(8);
    return `https://zoom.us/j/${room}?pwd=${pwd}`;
  }
  return null;
}
