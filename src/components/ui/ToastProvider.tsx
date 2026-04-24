import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  kind: ToastKind;
};

type ToastInput = Omit<ToastItem, "id">;

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      window.setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-6 right-6 z-[200] flex w-full max-w-[380px] flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={[
                "pointer-events-auto relative overflow-hidden rounded-2xl border bg-white/90 p-4 shadow-2xl backdrop-blur-xl transition-colors",
                toast.kind === "success"
                  ? "border-emerald-100 shadow-emerald-500/10"
                  : toast.kind === "error"
                    ? "border-rose-100 shadow-rose-500/10"
                    : "border-zinc-200 shadow-zinc-500/10",
              ].join(" ")}
            >
              {/* Progress bar effect */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className={[
                  "absolute bottom-0 left-0 h-1",
                  toast.kind === "success" ? "bg-emerald-500" : toast.kind === "error" ? "bg-rose-500" : "bg-zinc-400"
                ].join(" ")}
              />

              <div className="flex items-start gap-4">
                <div className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                  toast.kind === "success"
                    ? "bg-emerald-50 border-emerald-100"
                    : toast.kind === "error"
                      ? "bg-rose-50 border-rose-100"
                      : "bg-zinc-50 border-zinc-100",
                ].join(" ")}>
                  {toast.kind === "success" ? (
                    <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                  ) : toast.kind === "error" ? (
                    <ExclamationCircleIcon className="h-5 w-5 text-rose-600" />
                  ) : (
                    <InformationCircleIcon className="h-5 w-5 text-zinc-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1 py-0.5">
                  <p className="text-sm font-black tracking-tight text-zinc-900">{toast.title}</p>
                  {toast.message && (
                    <p className="mt-1 text-xs font-medium text-zinc-500 leading-relaxed">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-xl p-1 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700 active:scale-90"
                  aria-label="Close toast"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
