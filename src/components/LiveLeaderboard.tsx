import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Racer } from '../types/race';
import { Trophy } from 'lucide-react';

interface LiveLeaderboardProps {
  racers: Racer[];
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ racers }) => {
  // Sort racers by progress descending
  const sortedRacers = [...racers].sort((a, b) => {
    if (a.finishTime && b.finishTime) return a.finishTime - b.finishTime;
    if (a.finishTime) return -1;
    if (b.finishTime) return 1;
    return b.progress - a.progress;
  });

  return (
    <div className="w-full glass-panel rounded-2xl p-4 border border-white/[0.08] backdrop-blur-xl">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3 pb-2 border-b border-white/5">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-white">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> Live Standings
        </span>
        <span className="text-[10px] text-slate-500">Auto-updates dynamically</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <AnimatePresence>
          {sortedRacers.map((racer, index) => {
            const isUser = racer.isUser;
            const isLeader = index === 0;

            const rankBorder = isLeader
              ? 'border-amber-400/40 bg-amber-400/5'
              : index === 1
              ? 'border-slate-300/30 bg-slate-300/5'
              : index === 2
              ? 'border-amber-700/30 bg-amber-700/5'
              : 'border-white/5 bg-black/30';

            return (
              <motion.div
                key={racer.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${rankBorder} transition-shadow ${
                  isUser ? 'ring-1 ring-theme-primary/50 shadow-[0_0_12px_rgba(0,245,255,0.15)]' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {/* Rank Index */}
                  <span
                    className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-[10px] font-black ${
                      isLeader
                        ? 'bg-amber-400 text-black'
                        : index === 1
                        ? 'bg-slate-300 text-black'
                        : index === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  {/* Avatar & Name */}
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{racer.avatar}</span>
                      <span
                        className={`text-xs font-semibold truncate ${
                          isUser ? 'text-theme-primary' : 'text-slate-200'
                        }`}
                      >
                        {racer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>{racer.progress}% done</span>
                    </div>
                  </div>
                </div>

                {/* Right metrics: WPM */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-xs font-mono font-black" style={{ color: racer.color }}>
                    {racer.currentWpm} <span className="text-[9px] text-slate-500">WPM</span>
                  </span>
                  {racer.progress >= 100 ? (
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                      Finished
                    </span>
                  ) : (
                    <div className="w-10 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${racer.progress}%`,
                          backgroundColor: racer.color,
                        }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
