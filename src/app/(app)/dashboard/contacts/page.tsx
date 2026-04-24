"use client";

import { MagnifyingGlassIcon, PlusIcon, UserGroupIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl space-y-8 py-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Contacts</h1>
          <p className="mt-2 text-base text-zinc-500 max-w-2xl">
            Manage your relationship database. Track bookings, customer history, and meeting follow-ups in one centralized place.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddContact}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--app-primary)] px-6 py-3 text-sm font-bold text-[var(--app-primary-foreground)] shadow-lg shadow-[var(--app-ring)] transition-all hover:bg-[var(--app-primary-hover)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" />
          Add Contact
        </button>
      </div>

      <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <div className="relative w-full max-w-md group">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-[var(--app-primary)]" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or email..."
                className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-12 pr-4 text-sm font-medium text-zinc-900 shadow-sm outline-none transition-all focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary-soft)]"
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest tabular-nums">
              <UserGroupIcon className="h-4 w-4" />
              {total} total contacts
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm">
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
              isLoading={isLoading}
              isError={isError}
            />
          </div>
      </section>

      <ContactDetailsDrawer contact={!addOpen ? selected : null} onClose={() => setSelectedId("")} />
      <AddContactDrawer
        open={addOpen}
        form={form}
        onChange={setForm}
        onClose={closeAddContact}
        onSave={handleSaveContact}
      />
    </motion.div>
  );
}
