"use client";

import { AlertTriangle, CheckCircle2, CircleAlert, Info, X } from "./icons";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastInput {
  readonly title: string;
  readonly description?: string;
  readonly tone?: ToastTone;
  readonly action?: {
    readonly label: string;
    readonly onClick: () => void;
  };
}

interface ToastRecord extends ToastInput {
  readonly id: number;
  readonly tone: ToastTone;
}

interface ToastContextValue {
  readonly toast: (input: ToastInput) => void;
  readonly dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneIcon = {
  success: CheckCircle2,
  error: CircleAlert,
  warning: AlertTriangle,
  info: Info,
} as const;

export function ToastProvider({ children }: { readonly children: React.ReactNode }) {
  const [toasts, setToasts] = useState<readonly ToastRecord[]>([]);
  const sequence = useRef(0);
  const timers = useRef(new Set<number>());
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);
  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++sequence.current;
      setToasts((current) => [...current.slice(-3), { ...input, id, tone: input.tone ?? "info" }]);
      const timer = window.setTimeout(() => {
        timers.current.delete(timer);
        dismiss(id);
      }, 6000);
      timers.current.add(timer);
    },
    [dismiss],
  );
  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );
  const value = useMemo(() => ({ dismiss, toast }), [dismiss, toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-label="Notifications" className="ctps-toast-viewport">
        {toasts.map((item) => {
          const Icon = toneIcon[item.tone];
          return (
            <div
              className="ctps-toast"
              data-tone={item.tone}
              key={item.id}
              role={item.tone === "error" || item.tone === "warning" ? "alert" : "status"}
            >
              <Icon aria-hidden="true" className="ctps-toast-icon" />
              <div className="min-w-0 flex-1">
                <p className="ctps-toast-title">{item.title}</p>
                {item.description ? (
                  <p className="ctps-toast-description">{item.description}</p>
                ) : null}
                {item.action ? (
                  <button className="ctps-toast-action" onClick={item.action.onClick} type="button">
                    {item.action.label}
                  </button>
                ) : null}
              </div>
              <button
                aria-label={`Dismiss ${item.title} notification`}
                className="ctps-toast-dismiss"
                onClick={() => dismiss(item.id)}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
