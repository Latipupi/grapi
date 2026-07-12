import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = (toasts: Toast[]) => void;
let listeners: ToastListener[] = [];
let toasts: Toast[] = [];

const notify = () => {
  listeners.forEach((listener) => listener([...toasts]));
};

export const toast = {
  success: (message: string, duration = 3000) => addToast(message, 'success', duration),
  error: (message: string, duration = 4000) => addToast(message, 'error', duration),
  info: (message: string, duration = 3000) => addToast(message, 'info', duration),
  warning: (message: string, duration = 3500) => addToast(message, 'warning', duration),
};

const addToast = (message: string, type: ToastType, duration: number) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, message, type, duration };
  toasts = [...toasts, newToast];
  notify();
  return id;
};

export const removeToast = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
};

export const useToasts = () => {
  const [activeToasts, setActiveToasts] = useState<Toast[]>(toasts);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setActiveToasts(newToasts);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return activeToasts;
};

// Individual Toast Item with Timer Progress Bar
const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { id, message, type, duration = 3000 } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  };

  const themes = {
    success: 'bg-white/95 border-emerald-100 shadow-emerald-100/30 text-emerald-900',
    error: 'bg-white/95 border-red-100 shadow-red-100/30 text-red-900',
    info: 'bg-white/95 border-blue-100 shadow-blue-100/30 text-blue-900',
    warning: 'bg-white/95 border-amber-100 shadow-amber-100/30 text-amber-900',
  };

  const progressColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={cn(
        "relative flex items-start gap-3 p-4 pr-10 border rounded-2xl shadow-xl backdrop-blur-md min-w-[320px] max-w-[420px] overflow-hidden",
        themes[type]
      )}
    >
      {icons[type]}
      <div className="flex-1 text-sm font-medium leading-5">{message}</div>
      <button
        onClick={() => removeToast(id)}
        className="absolute top-3.5 right-3 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar Timer */}
      {duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={cn("absolute bottom-0 left-0 h-1", progressColors[type])}
        />
      )}
    </motion.div>
  );
};

export const Toaster: React.FC = () => {
  const activeToasts = useToasts();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {activeToasts.map((t) => (
            <ToastItem key={t.id} toast={t} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
