"use client";

import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

import { AddContactDrawer } from "@/components/contacts/AddContactDrawer";
import { ContactDetailsDrawer } from "@/components/contacts/ContactDetailsDrawer";
import { ContactTable } from "@/components/contacts/ContactTable";
import { useToast } from "@/components/ui/ToastProvider";
import {
  EMPTY_CONTACT_FORM,
  INITIAL_CONTACTS,
  type Contact,
  type ContactForm,
  type FilterId,
} from "@/lib/contacts-data";

export default function ContactsPage() {
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [selectedId, setSelectedId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<ContactForm>(EMPTY_CONTACT_FORM);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      const bySearch = q
        ? `${c.name} ${c.email} ${c.company} ${c.phone} ${c.owner} ${c.tag}`.toLowerCase().includes(q)
        : true;
      const byFilter = filter === "all" ? true : c.tag === filter;
      return bySearch && byFilter;
    });
  }, [contacts, search, filter]);

  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  function openAddContact() {
    setSelectedId("");
    setAddOpen(true);
  }

  function closeAddContact() {
    setAddOpen(false);
    setForm(EMPTY_CONTACT_FORM);
  }

  function saveContact() {
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name || !email) {
      showToast({
        kind: "error",
        title: "Missing required fields",
        message: "Please fill in full name and email before saving.",
      });
      return;
    }
    const phoneNumber = form.phoneNumber.trim();
    const phone = phoneNumber ? `${form.phoneCountryCode} ${phoneNumber}` : "";

    const contact: Contact = {
      id: `c${Date.now()}`,
      name,
      email,
      phone,
      jobTitle: form.jobTitle.trim(),
      company: form.company.trim(),
      linkedin: form.linkedin.trim(),
      timezone: form.timezone.trim(),
      country: form.country.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      owner: "Ansh",
      tag: "No meetings",
      lastMeeting: "-",
      nextMeeting: "-",
      notes: "New contact added manually.",
    };

    setContacts((prev) => [contact, ...prev]);
    setSelectedId(contact.id);
    closeAddContact();
    showToast({ kind: "success", title: "Contact added", message: `${contact.name} was added successfully.` });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Contacts</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Your people database from bookings and invites. Track relationships, meetings, and follow-ups.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
            <div className="relative w-full max-w-sm">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 text-sm text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:bg-white focus:ring-2 focus:ring-[var(--app-ring)]"
              />
            </div>
            <button
              type="button"
              onClick={openAddContact}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--app-primary)] px-3 py-2 text-xs font-medium text-[var(--app-primary-foreground)] hover:bg-[var(--app-primary-hover)]"
            >
              <PlusIcon className="h-4 w-4" />
              New contact
            </button>
          </div>

          <ContactTable
            contacts={filtered}
            filter={filter}
            onFilterChange={setFilter}
            selectedId={selected?.id ?? ""}
            onSelect={setSelectedId}
          />
      </section>

      <ContactDetailsDrawer contact={!addOpen ? selected : null} onClose={() => setSelectedId("")} />
      <AddContactDrawer open={addOpen} form={form} onChange={setForm} onClose={closeAddContact} onSave={saveContact} />
    </div>
  );
}
