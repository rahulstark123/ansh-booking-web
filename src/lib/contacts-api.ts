import type { Contact, FilterId } from "@/lib/contacts-data";

export type ContactsListResponse = {
  items: Contact[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ApiContact = {
  id: string;
  fullName: string;
  email: string;
  countryCode: string | null;
  phone: string | null;
  pincode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lastBookedAt: string | null;
  notes: string | null;
};

function formatLastMeeting(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(d);
}

function toUiContact(row: ApiContact): Contact {
  const phone = row.phone ? `${row.countryCode ?? ""} ${row.phone}`.trim() : "";
  const hasMeeting = Boolean(row.lastBookedAt);
  return {
    id: row.id,
    name: row.fullName,
    email: row.email,
    phone,
    jobTitle: "",
    company: "",
    linkedin: "",
    timezone: "",
    country: row.country ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    pincode: row.pincode ?? "",
    owner: "Ansh",
    tag: hasMeeting ? "Warm" : "No meetings",
    lastMeeting: formatLastMeeting(row.lastBookedAt),
    nextMeeting: "-",
    notes: row.notes ?? "",
  };
}

export async function fetchContacts(
  accessToken: string,
  params: { page: number; pageSize: number; q: string; filter: FilterId },
): Promise<ContactsListResponse> {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.q.trim()) search.set("q", params.q.trim());
  if (params.filter !== "all") search.set("filter", params.filter);

  const res = await fetch(`/api/booking/contacts?${search.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load contacts");
  const body = (await res.json()) as {
    items: ApiContact[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  return {
    items: body.items.map(toUiContact),
    page: body.page,
    pageSize: body.pageSize,
    total: body.total,
    totalPages: body.totalPages,
  };
}

export async function saveContact(
  accessToken: string,
  payload: { 
    fullName: string; 
    email: string; 
    countryCode?: string; 
    phone?: string; 
    notes?: string;
    pincode?: string;
    city?: string;
    state?: string;
    country?: string;
  },
): Promise<void> {
  const res = await fetch("/api/booking/contacts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save contact");
}

export async function deleteContact(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`/api/booking/contacts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to delete contact");
}

export async function updateContact(
  accessToken: string,
  id: string,
  payload: Partial<{ 
    fullName: string; 
    email: string; 
    countryCode: string; 
    phone: string; 
    notes: string;
    pincode: string;
    city: string;
    state: string;
    country: string;
  }>,
): Promise<void> {
  const res = await fetch(`/api/booking/contacts/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update contact");
}
