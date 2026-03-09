import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type ToastEntry = {
  id: number;
  message: string;
};

const ToastContext = createContext<{
  push: (message: string) => void;
} | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const value = useMemo(
    () => ({
      push(message: string) {
        const id = Date.now();
        setToasts((current) => [...current, { id, message }]);
        setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3000);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-card"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
