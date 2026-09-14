import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToastNotification } from '../types/race';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface CyberToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const CyberToast: React.FC<CyberToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isWarn = toast.type === 'warn';
          const isSuccess = toast.type === 'success';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`pointer-events-auto p-3.5 rounded-2xl glass-panel border flex items-start justify-between gap-3 shadow-2xl backdrop-blur-xl ${
                isWarn
                  ? 'border-red-500/40 bg-red-950/40 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : isSuccess
                  ? 'border-cyber-lime/40 bg-emerald-950/40 text-emerald-200 shadow-[0_0_20px_rgba(57,255,20,0.2)]'
                  : 'border-theme-primary/40 bg-slate-900/80 text-cyan-200 shadow-[0_0_20px_rgba(0,245,255,0.15)]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  {isWarn ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : isSuccess ? (
                    <CheckCircle className="w-4 h-4 text-cyber-lime" />
                  ) : (
                    <Info className="w-4 h-4 text-theme-primary" />
                  )}
                </div>
                <div className="text-xs font-mono leading-relaxed">
                  {toast.text}
                </div>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
