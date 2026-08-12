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
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-3 right-3 z-[100] flex flex-col gap-3 sm:bottom-8 sm:left-auto sm:right-8 sm:w-full sm:max-w-sm"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="toast page-enter">
            <span className="live-dot" />
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
