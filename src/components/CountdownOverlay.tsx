import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownOverlayProps {
  onComplete: () => void;
  onTickSound?: (isFinal: boolean) => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  onComplete,
  onTickSound,
}) => {
  const [count, setCount] = useState<number | 'GO'>(3);

  useEffect(() => {
    onTickSound?.(false);

    const timer1 = setTimeout(() => {
      setCount(2);
      onTickSound?.(false);
    }, 1000);

    const timer2 = setTimeout(() => {
      setCount(1);
      onTickSound?.(false);
    }, 2000);

    const timer3 = setTimeout(() => {
      setCount('GO');
      onTickSound?.(true);
    }, 3000);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete, onTickSound]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md pointer-events-none select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ opacity: 0, scale: 0.4, rotate: -10 }}
          animate={{ opacity: 1, scale: 1.2, rotate: 0 }}
          exit={{ opacity: 0, scale: 1.8, filter: 'blur(10px)' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center"
        >
          <span
            className={`font-black font-display text-8xl sm:text-9xl tracking-tighter ${
              count === 'GO'
                ? 'text-cyber-lime drop-shadow-[0_0_50px_rgba(57,255,20,0.8)]'
                : 'text-theme-primary drop-shadow-[0_0_40px_rgba(0,245,255,0.7)]'
            }`}
          >
            {count}
          </span>
          <span className="text-xs sm:text-sm font-mono tracking-widest uppercase text-slate-300 mt-4">
            {count === 'GO' ? 'SYSTEM INITIATED // ENGAGE' : 'PREPARING CIRCUIT GRID'}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
