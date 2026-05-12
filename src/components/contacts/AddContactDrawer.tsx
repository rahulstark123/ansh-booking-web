import { motion, AnimatePresence } from "framer-motion";
import { CameraIcon, XMarkIcon, UserPlusIcon, MapPinIcon, BriefcaseIcon, PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { type ReactNode, useEffect, useState } from "react";
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
  const [lookupLoading, setLookupLoading] = useState(false);
  const canSave = form.name.trim() && form.email.trim();

  useEffect(() => {
    if (form.pincode.length === 6 && /^\d+$/.test(form.pincode)) {
      handlePincodeLookup(form.pincode);
    }
  }, [form.pincode]);

  async function handlePincodeLookup(pincode: string) {
    setLookupLoading(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/in/${pincode}`);
      if (!res.ok) throw new Error("Pincode not found");
      const data = await res.json();
      
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        onChange({
          ...form,
          city: place["place name"],
          state: place["state"],
          country: data.country,
        });
      }
    } catch (err) {
      console.error("Pincode lookup failed", err);
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <DrawerBackdrop onClick={onClose} aria-label="Close add contact panel" />
          <motion.aside 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-8 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Database Entry</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-900">Add New Contact</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700 active:scale-95"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 pb-10">
              <div className="space-y-8">
                {/* Profile Section */}
                <section className="space-y-6 pt-4">
                  <div className="flex items-center gap-6 rounded-3xl border border-zinc-100 bg-zinc-50/50 p-6 shadow-sm">
                    <div className="relative group cursor-pointer">
                      <div className="h-20 w-20 rounded-3xl bg-zinc-200 flex items-center justify-center border-2 border-white shadow-md transition-transform group-hover:scale-105">
                        <CameraIcon className="h-8 w-8 text-zinc-500" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-[var(--app-primary)] border-2 border-white flex items-center justify-center">
                        <PlusIcon className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Contact Avatar</h3>
                      <p className="mt-1 text-xs font-medium text-zinc-500 leading-snug">Upload a professional photo or use a generated initial.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Identity Details</p>
                    <Field label="Full name" required>
                      <Input 
                        value={form.name} 
                        onChange={(v) => onChange({ ...form, name: v })} 
                        placeholder="e.g. John Wick"
                      />
                    </Field>

                    <Field label="Email address" required>
                      <Input 
                        type="email" 
                        value={form.email} 
                        onChange={(v) => onChange({ ...form, email: v })} 
                        placeholder="john@example.com"
                      />
                    </Field>

                    <Field label="Phone number">
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
                        inputClass="!w-full !h-[50px] !rounded-2xl !border-zinc-200 !bg-white !pl-16 !text-sm !font-bold !text-zinc-900 focus:!border-[var(--app-primary)] focus:!ring-4 focus:!ring-[var(--app-primary-soft)] transition-all"
                        buttonClass="!border-zinc-200 !bg-white hover:!bg-zinc-50 !rounded-l-2xl !pl-2"
                        dropdownClass="!text-sm !rounded-xl !shadow-2xl !border-zinc-200"
                      />
                    </Field>
                  </div>
                </section>

                {/* Professional Section */}
                <section className="space-y-6 rounded-3xl bg-zinc-50 p-6 ring-1 ring-zinc-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Professional Context</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Job title">
                      <Input 
                        value={form.jobTitle} 
                        onChange={(v) => onChange({ ...form, jobTitle: v })} 
                        placeholder="Product Lead"
                      />
                    </Field>
                    <Field label="Company">
                      <Input 
                        value={form.company} 
                        onChange={(v) => onChange({ ...form, company: v })} 
                        placeholder="Continental"
                      />
                    </Field>
                  </div>

                  <Field label="LinkedIn Profile">
                    <Input 
                      value={form.linkedin} 
                      onChange={(v) => onChange({ ...form, linkedin: v })} 
                      placeholder="linkedin.com/in/username"
                    />
                  </Field>
                </section>

                {/* Location Section */}
                <section className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Geographic Info</p>
                  
                  <Field label="Pincode">
                    <div className="relative">
                      <Input 
                        value={form.pincode} 
                        onChange={(v) => onChange({ ...form, pincode: v })} 
                        placeholder="400001"
                        maxLength={6}
                      />
                      {lookupLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <ArrowPathIcon className="h-5 w-5 animate-spin text-[var(--app-primary)]" />
                        </div>
                      )}
                    </div>
                  </Field>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <Field label="City">
                        <Input 
                          value={form.city} 
                          onChange={(v) => onChange({ ...form, city: v })} 
                          placeholder="Mumbai"
                        />
                      </Field>
                    </div>
                    <div className="col-span-1">
                      <Field label="State">
                        <Input 
                          value={form.state} 
                          onChange={(v) => onChange({ ...form, state: v })} 
                          placeholder="MH"
                        />
                      </Field>
                    </div>
                    <div className="col-span-1">
                      <Field label="Country">
                        <Input 
                          value={form.country} 
                          onChange={(v) => onChange({ ...form, country: v })} 
                          placeholder="India"
                        />
                      </Field>
                    </div>
                  </div>

                  <Field label="Time zone">
                    <Input 
                      value={form.timezone} 
                      onChange={(v) => onChange({ ...form, timezone: v })} 
                      placeholder="UTC+05:30 (India)"
                    />
                  </Field>
                </section>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-zinc-100 p-8 flex items-center justify-end gap-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-zinc-500 transition hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={!canSave}
                className="rounded-2xl bg-[var(--app-primary)] px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-[var(--app-primary-soft)] transition-all hover:bg-[var(--app-primary-hover)] active:scale-[0.98] disabled:opacity-40"
              >
                Save Contact
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-zinc-600">
        {label}
        {required && <span className="ml-1 text-rose-500 font-bold">*</span>}
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
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-all focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary-soft)]"
    />
  );
}
