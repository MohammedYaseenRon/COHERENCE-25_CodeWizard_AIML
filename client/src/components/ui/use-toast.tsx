"use client"
import { useState, useEffect, createContext, useContext } from 'react';

type ToastProps = {
  title: string;
  description: string;
  duration?: number;
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
  toasts: ToastProps[];
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => {
    const id = Date.now();
    setToasts((toasts) => [...toasts, { ...props, duration: props.duration || 5000 }]);
    
    setTimeout(() => {
      setToasts((toasts) => toasts.filter((toast) => toast !== props));
    }, props.duration || 5000);
  };

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}
      {/* Toast container would go here */}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}