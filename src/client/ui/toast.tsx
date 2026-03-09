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
      <div className="fixed bottom-4 left-3 right-3 z-[100] flex max-w-sm flex-col gap-3 sm:bottom-8 sm:left-auto sm:right-8 sm:w-full sm:gap-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-in slide-in-from-right border-4 border-black bg-[var(--accent-color)] px-4 py-3 text-sm font-black uppercase text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:px-8 sm:py-4 sm:text-lg sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
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
