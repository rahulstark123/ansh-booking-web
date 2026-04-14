"use client";

import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AddContactDrawer } from "@/components/contacts/AddContactDrawer";
import { ContactDetailsDrawer } from "@/components/contacts/ContactDetailsDrawer";
import { ContactTable } from "@/components/contacts/ContactTable";
import { useToast } from "@/components/ui/ToastProvider";
import { useContacts } from "@/hooks/use-contacts";
import { saveContact } from "@/lib/contacts-api";
import {
  EMPTY_CONTACT_FORM,
  type Contact,
  type ContactForm,
  type FilterId,
} from "@/lib/contacts-data";
import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedId, setSelectedId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<ContactForm>(EMPTY_CONTACT_FORM);
  const { data, isLoading, isError } = useContacts(user?.id, { page, pageSize, q: search, filter });
  const contacts = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const selected = useMemo(() => contacts.find((c) => c.id === selectedId) ?? null, [contacts, selectedId]);

  function openAddContact() {
    setSelectedId("");
    setAddOpen(true);
  }

  function closeAddContact() {
    setAddOpen(false);
    setForm(EMPTY_CONTACT_FORM);
  }

  async function handleSaveContact() {
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
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) throw new Error("Supabase is not configured");
      const { data: sessionData, error } = await client.auth.getSession();
      if (error || !sessionData.session?.access_token) throw new Error("Not signed in");

      await saveContact(sessionData.session.access_token, {
        fullName: name,
        email,
        countryCode: form.phoneCountryCode.trim() || undefined,
        phone: form.phoneNumber.trim() || undefined,
        notes: "New contact added manually.",
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.contacts.root,
      });
      closeAddContact();
      setPage(1);
      showToast({ kind: "success", title: "Contact added", message: `${name} was added successfully.` });
    } catch {
      showToast({ kind: "error", title: "Save failed", message: "Could not save contact. Try again." });
    }
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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
            contacts={contacts}
            filter={filter}
            onFilterChange={(next) => {
              setFilter(next);
              setPage(1);
            }}
            selectedId={selected?.id ?? ""}
            onSelect={setSelectedId}
            page={page}
            totalPages={totalPages}
            total={total}
            onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
          {isError && <p className="mt-3 text-sm text-rose-600">Could not load contacts. Please refresh.</p>}
          {isLoading && <p className="mt-3 text-sm text-zinc-500">Loading contacts...</p>}
      </section>

      <ContactDetailsDrawer contact={!addOpen ? selected : null} onClose={() => setSelectedId("")} />
      <AddContactDrawer
        open={addOpen}
        form={form}
        onChange={setForm}
        onClose={closeAddContact}
        onSave={handleSaveContact}
      />
    </div>
  );
}
