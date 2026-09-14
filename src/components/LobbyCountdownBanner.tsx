import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Play, XCircle } from 'lucide-react';
import type { RoomParticipant } from '../hooks/useRaceRoom';

interface LobbyCountdownBannerProps {
  countdown: number; // 10 down to 0
  userName: string;
  userAvatar: string;
  remotePilots: RoomParticipant[];
  onForceLaunch: () => void;
  onAbort: () => void;
}

export const LobbyCountdownBanner: React.FC<LobbyCountdownBannerProps> = ({
  countdown,
  userName,
  userAvatar,
  remotePilots,
  onForceLaunch,
  onAbort,
}) => {
  // F1 style 5 light pods
  // As countdown goes from 10 down to 1, fill lights
  const filledLights = Math.min(5, Math.max(1, Math.ceil((10 - countdown) / 2)));
  const progressPercent = Math.max(0, Math.min(100, ((10 - countdown) / 10) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -25, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full glass-panel rounded-3xl p-5 md:p-6 mb-6 border-2 border-cyber-lime/40 bg-gradient-to-r from-cyber-lime/[0.08] via-black/60 to-theme-primary/[0.08] shadow-[0_0_40px_rgba(57,255,20,0.25)] relative overflow-hidden backdrop-blur-2xl"
    >
      {/* Background animated cyber pulse line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/40 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyber-lime via-theme-primary to-cyber-lime"
          style={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
        {/* Left: F1 Light Pods & Status Header */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-lime animate-ping" />
            <span className="text-xs font-mono text-cyber-lime uppercase font-black tracking-widest flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-cyber-lime" /> F1 GRID LAUNCH ENGAGED
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black font-display text-white tracking-wide">
            ALL PILOTS READY // RACE STARTING
          </h3>

          {/* F1 5-Light Indicator Pods */}
          <div className="flex items-center gap-2 mt-1">
            {[1, 2, 3, 4, 5].map((lightIdx) => {
              const isLit = lightIdx <= filledLights;
              return (
                <div
                  key={lightIdx}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isLit
                      ? 'bg-red-500 border-red-400 shadow-[0_0_15px_#ef4444] scale-105'
                      : 'bg-black/60 border-white/10 opacity-40'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isLit ? 'bg-white shadow-[0_0_8px_#fff]' : 'bg-red-950/60'
                    }`}
                  />
                </div>
              );
            })}
            <span className="text-[10px] font-mono text-slate-400 uppercase ml-1">
              GRID LIGHTS
            </span>
          </div>
        </div>

        {/* Center: Big Countdown Digit */}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="relative flex items-center justify-center">
            <span className="font-display font-black text-6xl sm:text-7xl text-cyber-lime drop-shadow-[0_0_30px_rgba(57,255,20,0.8)] tracking-tighter tabular-nums">
              {countdown < 10 ? `0${countdown}` : countdown}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase block -mt-1 tracking-widest">
              SECONDS
            </span>
          </div>
        </div>

        {/* Right: Connected Pilots Roster & Action Controls */}
        <div className="flex flex-col items-center md:items-end gap-3">
          {/* Pilots Mini Status Badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyber-lime/10 border border-cyber-lime/30 text-[11px] font-mono text-white">
              <span>{userAvatar}</span>
              <span className="font-bold text-cyber-lime">{userName}</span>
              <span className="text-[9px] text-cyber-lime font-bold">READY</span>
            </div>
            {remotePilots.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyber-lime/10 border border-cyber-lime/30 text-[11px] font-mono text-white"
              >
                <span>{p.avatar}</span>
                <span className="font-bold text-cyber-lime">{p.name}</span>
                <span className="text-[9px] text-cyber-lime font-bold">READY</span>
              </div>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAbort}
              className="px-3.5 py-2 rounded-xl glass-panel border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-mono flex items-center gap-1.5 transition-all"
              title="Cancel readiness and pause launch"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Unready / Pause</span>
            </button>

            <button
              onClick={onForceLaunch}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyber-lime to-theme-primary text-black font-bold text-xs font-mono shadow-[0_0_15px_rgba(57,255,20,0.4)] hover:opacity-90 flex items-center gap-1.5 transition-transform hover:scale-105"
              title="Skip 10s countdown and launch race immediately"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Launch Now</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
