"use client";

import { CameraIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import PhoneInput from "react-phone-input-2";

import { DrawerBackdrop } from "@/components/ui/drawer-backdrop";
import type { ContactForm } from "@/lib/contacts-data";

export function AddContactDrawer({
  open,
  form,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  form: ContactForm;
  onChange: (next: ContactForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!open) return null;

  const canSave = form.name.trim() && form.email.trim();

  return (
    <>
      <DrawerBackdrop onClick={onClose} aria-label="Close add contact panel" />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900">Add Contact</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
            <CameraIcon className="h-5 w-5" />
          </span>
          <button
            type="button"
            className="rounded-full border border-[var(--app-primary)] px-3 py-1 text-sm font-medium text-[var(--app-primary)]"
          >
            Upload image
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Full name" required>
            <Input value={form.name} onChange={(v) => onChange({ ...form, name: v })} />
          </Field>

          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(v) => onChange({ ...form, email: v })} />
          </Field>

          <Field label="Phone" optional>
            <PhoneInput
              country="in"
              value={`${form.phoneCountryCode.replace("+", "")}${form.phoneNumber}`}
              onChange={(value, data: { dialCode?: string }) => {
                const dialCode = data?.dialCode ?? "";
                const nextNumber = dialCode && value.startsWith(dialCode) ? value.slice(dialCode.length) : value;
                onChange({
                  ...form,
                  phoneCountryCode: dialCode ? `+${dialCode}` : form.phoneCountryCode,
                  phoneNumber: nextNumber,
                });
              }}
              enableSearch
              countryCodeEditable={false}
              inputProps={{ name: "phone", placeholder: "Phone number" }}
              containerClass="react-phone-input-container"
              inputClass="!w-full !h-[42px] !rounded-lg !border-zinc-200 !bg-white !pl-14 !text-sm !text-zinc-900 focus:!border-[var(--app-focus-border)] focus:!ring-2 focus:!ring-[var(--app-ring)]"
              buttonClass="!border-zinc-200 !bg-white hover:!bg-zinc-50"
              dropdownClass="!text-sm"
            />
          </Field>

          <Field label="Job title" optional>
            <Input value={form.jobTitle} onChange={(v) => onChange({ ...form, jobTitle: v })} />
          </Field>

          <Field label="Company" optional>
            <Input value={form.company} onChange={(v) => onChange({ ...form, company: v })} />
          </Field>

          <Field label="LinkedIn" optional>
            <Input value={form.linkedin} onChange={(v) => onChange({ ...form, linkedin: v })} />
          </Field>

          <Field label="Time zone" optional>
            <Input value={form.timezone} onChange={(v) => onChange({ ...form, timezone: v })} />
          </Field>

          <Field label="Country" optional>
            <Input value={form.country} onChange={(v) => onChange({ ...form, country: v })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City" optional>
              <Input value={form.city} onChange={(v) => onChange({ ...form, city: v })} />
            </Field>
            <Field label="State" optional>
              <Input value={form.state} onChange={(v) => onChange({ ...form, state: v })} />
            </Field>
          </div>
        </div>

        <div className="sticky bottom-0 mt-5 flex items-center justify-end gap-2 border-t border-zinc-100 bg-white pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="rounded-full bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-[var(--app-primary-foreground)] transition hover:bg-[var(--app-primary-hover)] disabled:opacity-40"
          >
            Save contact
          </button>
        </div>
      </aside>
    </>
  );
}

function Field({
  label,
  optional,
  required,
  children,
}: {
  label: string;
  optional?: boolean;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-800">
        {label}
        {optional && <span className="ml-1 text-zinc-500">(Optional)</span>}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
    />
  );
}
