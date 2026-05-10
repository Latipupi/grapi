import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md' 
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Dialog Content */}
      <div className={cn(
        "relative bg-white w-full rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300",
        sizes[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
