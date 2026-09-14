import React from 'react';
import { motion } from 'framer-motion';
import type { Racer } from '../types/race';
import { Trophy, Zap, Flag } from 'lucide-react';

interface RaceTrackProps {
  racers: Racer[];
}

export const RaceTrack: React.FC<RaceTrackProps> = ({ racers }) => {
  // Sort racers by progress to display dynamic ranks
  const sortedRacers = [...racers].sort((a, b) => {
    if (a.finishTime && b.finishTime) return a.finishTime - b.finishTime;
    if (a.finishTime) return -1;
    if (b.finishTime) return 1;
    return b.progress - a.progress;
  });

  const getRankBadge = (racerId: string) => {
    const rankIndex = sortedRacers.findIndex(r => r.id === racerId);
    if (rankIndex === 0) return { label: '1st', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
    if (rankIndex === 1) return { label: '2nd', color: 'text-slate-300 bg-slate-300/10 border-slate-300/30' };
    if (rankIndex === 2) return { label: '3rd', color: 'text-amber-700 bg-amber-700/10 border-amber-700/30' };
    return { label: `${rankIndex + 1}th`, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' };
  };

  return (
    <div className="w-full relative rounded-2xl glass-panel p-4 md:p-5 overflow-hidden shadow-2xl border border-white/[0.08] backdrop-blur-xl mb-6">
      {/* Track Header & Distance Markers */}
      <div className="flex items-center justify-between text-xs text-theme-subtext uppercase tracking-widest font-mono mb-3 px-2 border-b border-white/[0.05] pb-2">
        <span className="flex items-center gap-1.5 font-semibold text-theme-primary">
          <Zap className="w-3.5 h-3.5 animate-pulse" /> Cyber Gridway 404
        </span>
        <div className="flex items-center gap-6 sm:gap-12 md:gap-20 text-[10px] text-slate-500">
          <span className="hidden sm:inline">25%</span>
          <span className="hidden sm:inline">50%</span>
          <span className="hidden sm:inline">75%</span>
          <span className="flex items-center gap-1 text-cyber-yellow font-bold">
            <Flag className="w-3 h-3 text-cyber-yellow" /> FINISH
          </span>
        </div>
      </div>

      {/* Track Background Grid Lines & Vertical Distance Markers */}
      <div className="absolute inset-0 top-12 bottom-2 pointer-events-none px-4 md:px-6">
        <div className="h-full w-full relative">
          <div className="absolute left-[25%] top-0 bottom-0 border-l border-white/[0.03] border-dashed" />
          <div className="absolute left-[50%] top-0 bottom-0 border-l border-white/[0.03] border-dashed" />
          <div className="absolute left-[75%] top-0 bottom-0 border-l border-white/[0.03] border-dashed" />
          <div className="absolute right-0 top-0 bottom-0 border-r-2 border-amber-400/40 bg-gradient-to-l from-amber-400/5 to-transparent w-4" />
        </div>
      </div>

      {/* Lanes */}
      <div className="flex flex-col gap-2.5 relative z-10">
        {racers.map((racer) => {
          const rank = getRankBadge(racer.id);
          const isUser = racer.isUser;

          return (
            <div
              key={racer.id}
              className={`relative h-12 rounded-xl flex items-center px-3 transition-all duration-300 ${
                isUser
                  ? 'bg-gradient-to-r from-theme-primary/[0.08] via-theme-primary/[0.03] to-transparent border border-theme-primary/30 shadow-[0_0_15px_rgba(0,245,255,0.06)]'
                  : 'bg-black/25 border border-white/[0.04]'
              }`}
            >
              {/* Lane Info (Rank & Name) */}
              <div className="flex items-center gap-2 w-28 sm:w-36 flex-shrink-0 z-20">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${rank.color}`}>
                  {rank.label}
                </span>
                <span
                  className={`text-xs truncate font-medium ${
                    isUser ? 'text-theme-primary font-bold' : 'text-slate-300'
                  }`}
                  title={racer.name}
                >
                  {isUser ? `${racer.name} (YOU)` : racer.name}
                </span>
              </div>

              {/* Progress Track Runway */}
              <div className="flex-1 h-full relative mx-2">
                {/* Racer Vehicle / Avatar Moving on Track */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 flex items-center"
                  style={{
                    left: `${Math.min(96, Math.max(0, racer.progress))}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                >
                  {/* Glowing Speed Thruster Trail */}
                  <div
                    className="h-1.5 rounded-full mr-1 transition-all duration-200"
                    style={{
                      width: racer.currentWpm > 0 ? `${Math.min(60, Math.max(12, racer.currentWpm * 0.45))}px` : '4px',
                      background: `linear-gradient(to right, transparent, ${racer.color})`,
                      boxShadow: `0 0 10px ${racer.color}`,
                    }}
                  />

                  {/* Vehicle Icon Badge */}
                  <div
                    className={`relative w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-lg border transition-transform duration-200 ${
                      isUser
                        ? 'border-theme-primary bg-theme-primary/20 scale-110 shadow-[0_0_12px_var(--theme-primary)]'
                        : 'border-white/20 bg-slate-900/80'
                    }`}
                  >
                    <span>{racer.avatar}</span>
                    {racer.progress >= 100 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    )}
                  </div>

                  {/* Floating WPM Tag */}
                  <div className="ml-2 flex items-center gap-1 text-[11px] font-mono whitespace-nowrap bg-black/70 backdrop-blur px-1.5 py-0.5 rounded border border-white/10">
                    <span className="font-bold" style={{ color: racer.color }}>
                      {racer.currentWpm}
                    </span>
                    <span className="text-[9px] text-slate-400">WPM</span>
                  </div>
                </motion.div>
              </div>

              {/* Finish Line Indicator */}
              <div className="w-8 flex items-center justify-end z-20">
                {racer.progress >= 100 ? (
                  <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {racer.progress}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
