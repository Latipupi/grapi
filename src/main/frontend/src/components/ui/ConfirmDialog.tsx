import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'primary';
}

type ConfirmListener = (
  options: ConfirmOptions | null,
  resolve: ((val: boolean) => void) | null
) => void;

let confirmListener: ConfirmListener | null = null;

export const confirm = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    if (confirmListener) {
      confirmListener(options, resolve);
    } else {
      // Safe fallback to native confirm if component is not loaded
      const ok = window.confirm(`${options.title}\n\n${options.message}`);
      resolve(ok);
    }
  });
};

export const ConfirmContainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveFn, setResolveFn] = useState<((val: boolean) => void) | null>(null);

  useEffect(() => {
    confirmListener = (opts, resolve) => {
      if (opts === null) {
        setIsOpen(false);
        setOptions(null);
        setResolveFn(null);
      } else {
        setOptions(opts);
        setResolveFn(() => resolve);
        setIsOpen(true);
      }
    };
    return () => {
      confirmListener = null;
    };
  }, []);

  const handleCancel = () => {
    if (resolveFn) resolveFn(false);
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (resolveFn) resolveFn(true);
    setIsOpen(false);
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, resolveFn]);

  if (!options) return null;

  const {
    title,
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    type = 'primary',
  } = options;

  const icons = {
    danger: (
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 text-red-500 border border-red-100/50 shrink-0">
        <AlertCircle className="w-6 h-6" />
      </div>
    ),
    warning: (
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100/50 shrink-0">
        <AlertTriangle className="w-6 h-6" />
      </div>
    ),
    info: (
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100/50 shrink-0">
        <HelpCircle className="w-6 h-6" />
      </div>
    ),
    primary: (
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100/50 shrink-0">
        <HelpCircle className="w-6 h-6" />
      </div>
    ),
  };

  const confirmButtonClasses = {
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 focus:ring-red-500/20',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-100 focus:ring-amber-500/20',
    info: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 focus:ring-blue-500/20',
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 focus:ring-emerald-500/20',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100"
          >
            {/* Close Button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content Area */}
            <div className="p-6 pt-8 flex gap-4">
              {icons[type]}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                {cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                className={cn("rounded-xl font-medium", confirmButtonClasses[type])}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
