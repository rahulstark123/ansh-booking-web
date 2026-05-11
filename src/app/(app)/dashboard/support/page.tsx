"use client";

import { 
  LifebuoyIcon, 
  ChatBubbleLeftRightIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
  PaperClipIcon,
  XMarkIcon,
  PhotoIcon,
  EyeIcon,
  TrashIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useToast } from "@/components/ui/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  attachments: string[];
  status: string;
  createdAt: string;
};

const SUBJECT_LIMIT = 100;
const MESSAGE_LIMIT = 2000;

export default function SupportPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const userId = useAuthStore((s) => s.user?.id) ?? "";

  async function fetchTickets() {
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) return;
      const { data: { session } } = await client.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/support", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  async function uploadImage(file: File): Promise<string> {
    if (file.size > 2 * 1024 * 1024) throw new Error("File exceeds 2MB limit.");
    const client = await getSupabaseBrowserClient();
    if (!client) throw new Error("No client");
    const ext = file.name.split('.').pop();
    const fileName = `support-tickets/${userId}/${Date.now()}.${ext}`;
    const { error } = await client.storage.from("avatars").upload(fileName, file, { cacheControl: "3600", upsert: true });
    if (error) throw error;
    const { data } = client.storage.from("avatars").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]);
        newUrls.push(url);
      }
      setAttachments((prev) => [...prev, ...newUrls]);
      showToast({ kind: "success", title: "Success", message: "Images uploaded." });
    } catch (err: any) {
      showToast({ kind: "error", title: "Upload failed", message: err.message });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      showToast({ kind: "error", title: "Error", message: "All fields are required" });
      return;
    }

    setSubmitting(true);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) return;
      const { data: { session } } = await client.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...form, attachments }),
      });

      const data = await res.json();
      if (data.success) {
        showToast({ kind: "success", title: "Success", message: "Ticket created successfully" });
        setForm({ subject: "", message: "" });
        setAttachments([]);
        fetchTickets();
      } else {
        showToast({ kind: "error", title: "Error", message: data.error || "Failed to create ticket" });
      }
    } catch (err) {
      showToast({ kind: "error", title: "Error", message: "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTicket(id: string) {
    setDeletingId(id);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) return;
      const { data: { session } } = await client.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/support?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();
      if (data.success) {
        showToast({ kind: "success", title: "Deleted", message: "Ticket deleted successfully" });
        setTickets((prev) => prev.filter((t) => t.id !== id));
        if (selectedTicket?.id === id) setSelectedTicket(null);
        setConfirmDeleteId(null);
      } else {
        showToast({ kind: "error", title: "Error", message: data.error || "Failed to delete" });
      }
    } catch (err) {
      showToast({ kind: "error", title: "Error", message: "Something went wrong" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl space-y-8 py-8 px-4"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-[var(--app-primary)] to-[var(--app-primary-hover)] p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <LifebuoyIcon className="w-4 h-4" />
            Support Center
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            {viewAll ? "Ticket History" : "Need a Hand?"}
          </h1>
          <p className="text-lg text-white/80 max-w-md font-medium">
            {viewAll 
              ? "Manage and track all your previous support inquiries in one place."
              : "Our team will love to help you out. Describe your issue and we'll get back to you as soon as possible."}
          </p>
          {viewAll && (
            <button 
              onClick={() => setViewAll(false)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Form
            </button>
          )}
        </div>
        <div className="hidden md:block">
          <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 rotate-6 shadow-2xl">
            <ChatBubbleLeftRightIcon className="w-16 h-16 text-white" />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!viewAll ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                    Create a Ticket
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-zinc-700">Subject</label>
                        <span className={["text-[10px] font-bold uppercase tracking-wider", form.subject.length >= SUBJECT_LIMIT ? "text-rose-500" : "text-zinc-400"].join(" ")}>
                          {form.subject.length} / {SUBJECT_LIMIT}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={form.subject}
                        maxLength={SUBJECT_LIMIT}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="Briefly describe the issue"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--app-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--app-ring)] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-zinc-700">Message</label>
                        <span className={["text-[10px] font-bold uppercase tracking-wider", form.message.length >= MESSAGE_LIMIT ? "text-rose-500" : "text-zinc-400"].join(" ")}>
                          {form.message.length} / {MESSAGE_LIMIT}
                        </span>
                      </div>
                      <textarea
                        rows={5}
                        value={form.message}
                        maxLength={MESSAGE_LIMIT}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Provide more details about your problem..."
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-[var(--app-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--app-ring)] outline-none transition-all resize-none"
                      />
                    </div>

                    {/* Attachments Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-zinc-700">Attachments</label>
                        <label className={["inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[var(--app-primary)] hover:text-[var(--app-primary-hover)] transition-colors", isUploading ? "opacity-50 pointer-events-none" : ""].join(" ")}>
                          <PaperClipIcon className="w-4 h-4" />
                          {isUploading ? "Uploading..." : "Add Images"}
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>

                      <AnimatePresence>
                        {attachments.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-wrap gap-3 p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200"
                          >
                            {attachments.map((url, idx) => (
                              <motion.div 
                                key={url} 
                                layout
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative group w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-zinc-200 bg-white"
                              >
                                <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(url)}
                                  className="absolute top-1 right-1 p-1 bg-zinc-900/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                                >
                                  <XMarkIcon className="w-3 h-3" />
                                </button>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || isUploading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[var(--app-ring)] transition-all hover:bg-[var(--app-primary-hover)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Submitting..." : "Send Ticket"}
                      {!submitting && <ChevronRightIcon className="w-4 h-4" />}
                    </button>
                  </form>
                </div>
                <div className="bg-zinc-50 border-t border-zinc-200 p-6">
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                    <span className="text-zinc-900 font-bold block mb-1">Note:</span>
                    Our team prioritize every issue and in order to resolve issue it might take us 48 hours to respond with the fix.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-3xl p-8 text-white space-y-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Past Tickets</h3>
                  {tickets.length > 0 && (
                    <button 
                      onClick={() => setViewAll(true)}
                      className="text-xs font-bold text-white/40 hover:text-white transition-colors"
                    >
                      View All
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                    ))
                  ) : tickets.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                        <ExclamationCircleIcon className="w-6 h-6 text-white/40" />
                      </div>
                      <p className="text-sm text-white/40 font-medium">No tickets yet</p>
                    </div>
                  ) : (
                    tickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate">{ticket.subject}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </p>
                              {ticket.attachments && ticket.attachments.length > 0 && (
                                <span className="flex items-center gap-0.5 text-white/60 text-[10px] font-bold">
                                  <PaperClipIcon className="w-2.5 h-2.5" />
                                  {ticket.attachments.length}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={[
                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                            ticket.status === "OPEN" ? "bg-amber-400 text-amber-950" : 
                            ticket.status === "RESOLVED" ? "bg-emerald-400 text-emerald-950" : 
                            "bg-blue-400 text-blue-950"
                          ].join(" ")}>
                            {ticket.status}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400">Subject</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400">Status</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400">Date</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">{ticket.subject}</span>
                          {ticket.attachments?.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                              <PaperClipIcon className="w-3 h-3" />
                              {ticket.attachments.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={[
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                          ticket.status === "OPEN" ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200" : 
                          ticket.status === "RESOLVED" ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" : 
                          "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                        ].join(" ")}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-zinc-500 tabular-nums">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedTicket(ticket)}
                            className="p-2 text-zinc-400 hover:text-[var(--app-primary)] hover:bg-[var(--app-primary-soft)] rounded-lg transition-all"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(ticket.id)}
                            disabled={deletingId === ticket.id}
                            className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                            title="Delete Ticket"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tickets.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                  <ExclamationCircleIcon className="w-8 h-8 text-zinc-300" />
                </div>
                <p className="text-sm font-bold text-zinc-500">No tickets found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={[
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                        selectedTicket.status === "OPEN" ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200" : 
                        selectedTicket.status === "RESOLVED" ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" : 
                        "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                      ].join(" ")}>
                        {selectedTicket.status}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 leading-tight">
                      {selectedTicket.subject}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-6 text-sm text-zinc-600 leading-relaxed font-medium whitespace-pre-wrap border border-zinc-100">
                  {selectedTicket.message}
                </div>

                {selectedTicket.attachments?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Attachments</h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedTicket.attachments.map((url, i) => (
                        <a 
                          key={i}
                          href={url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="group relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200 bg-white hover:ring-4 hover:ring-[var(--app-primary-soft)] transition-all"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <EyeIcon className="w-6 h-6 text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-zinc-100">
                  <button 
                    onClick={() => setConfirmDeleteId(selectedTicket.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Ticket
                  </button>
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-zinc-900 text-sm font-bold text-white hover:bg-zinc-800 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <TrashIcon className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-zinc-900">Are you sure?</h3>
                <p className="text-sm font-medium text-zinc-500">
                  This action cannot be undone. This ticket will be permanently removed.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleDeleteTicket(confirmDeleteId)}
                  disabled={!!deletingId}
                  className="w-full py-4 rounded-2xl bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all disabled:opacity-50"
                >
                  {deletingId ? "Deleting..." : "Yes, Delete Ticket"}
                </button>
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full py-4 rounded-2xl bg-zinc-100 text-zinc-900 text-sm font-bold hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
