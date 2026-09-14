import React from 'react';
import type { RaceMode, RaceStatus, ThemeId } from '../types/race';
import type { SoundProfile } from '../hooks/useSoundEffects';
import { 
  Zap, 
  Volume2, 
  VolumeX, 
  Palette, 
  Users, 
  RotateCcw, 
  Timer, 
  Type, 
  Quote 
} from 'lucide-react';

interface RaceHeaderProps {
  mode: RaceMode;
  onSelectMode: (mode: RaceMode) => void;
  status: RaceStatus;
  timeRemaining: number | null;
  elapsedTime: number;
  currentWordIndex: number;
  totalWords: number;
  liveWpm: number;
  liveAccuracy: number;
  soundProfile: SoundProfile;
  onToggleSound: () => void;
  currentTheme: ThemeId;
  onOpenThemeModal: () => void;
  roomId: string | null;
  onOpenRoomModal: () => void;
  onRestart: () => void;
}

export const RaceHeader: React.FC<RaceHeaderProps> = ({
  mode,
  onSelectMode,
  status: _status,
  timeRemaining,
  elapsedTime: _elapsedTime,
  currentWordIndex,
  totalWords,
  liveWpm,
  liveAccuracy,
  soundProfile,
  onToggleSound,
  currentTheme: _currentTheme,
  onOpenThemeModal,
  roomId,
  onOpenRoomModal,
  onRestart,
}) => {
  return (
    <header className="w-full flex flex-col gap-4 mb-6">
      {/* Top Bar: Brand, Actions (Theme, Sound, Room, Reset) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-theme-primary to-theme-secondary flex items-center justify-center shadow-[0_0_15px_var(--theme-primary)]">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider uppercase font-display bg-gradient-to-r from-theme-primary via-white to-theme-secondary bg-clip-text text-transparent">
              TypeRacer Neo
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-theme-subtext">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-lime animate-ping" />
              <span>SYSTEM ONLINE // V2.4</span>
            </div>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2">
          {/* Room / Multiplayer Button */}
          <button
            onClick={onOpenRoomModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              roomId
                ? 'bg-theme-secondary/20 border-theme-secondary text-theme-secondary shadow-[0_0_12px_rgba(189,0,255,0.3)]'
                : 'glass-panel border-white/10 text-slate-300 hover:border-theme-primary/40 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{roomId ? roomId : 'Multiplayer'}</span>
          </button>

          {/* Sound Profile Toggle */}
          <button
            onClick={onToggleSound}
            className="glass-panel p-2 rounded-xl border border-white/10 text-slate-300 hover:text-theme-primary hover:border-theme-primary/40 transition-all"
            title={`Sound: ${soundProfile}`}
          >
            {soundProfile === 'off' ? (
              <VolumeX className="w-4 h-4 text-slate-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-theme-primary" />
            )}
          </button>

          {/* Theme Switcher Trigger */}
          <button
            onClick={onOpenThemeModal}
            className="glass-panel p-2 rounded-xl border border-white/10 text-slate-300 hover:text-theme-primary hover:border-theme-primary/40 transition-all"
            title="Change Visual Theme"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Restart Race Button */}
          <button
            onClick={onRestart}
            className="glass-panel p-2 rounded-xl border border-white/10 text-slate-300 hover:text-theme-primary hover:border-theme-primary/40 transition-all"
            title="Restart Race (Tab + Enter)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Second Row: Mode Selector Tabs + Live HUD counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-2.5 sm:p-3 rounded-2xl border border-white/[0.08]">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap text-xs font-mono">
          {/* Time Modes */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
            <span className="text-slate-500 px-1.5 flex items-center gap-1">
              <Timer className="w-3 h-3" /> Time:
            </span>
            {([15, 30, 60] as const).map((duration) => {
              const isSelected = mode.type === 'time' && mode.duration === duration;
              return (
                <button
                  key={duration}
                  onClick={() => onSelectMode({ type: 'time', duration })}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-theme-primary text-black font-bold shadow-[0_0_10px_var(--theme-primary)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {duration}s
                </button>
              );
            })}
          </div>

          {/* Word Count Modes */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
            <span className="text-slate-500 px-1.5 flex items-center gap-1">
              <Type className="w-3 h-3" /> Words:
            </span>
            {([25, 50, 100] as const).map((count) => {
              const isSelected = mode.type === 'words' && mode.count === count;
              return (
                <button
                  key={count}
                  onClick={() => onSelectMode({ type: 'words', count })}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-theme-primary text-black font-bold shadow-[0_0_10px_var(--theme-primary)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>

          {/* Quote Mode */}
          <button
            onClick={() => onSelectMode({ type: 'quote' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              mode.type === 'quote'
                ? 'bg-theme-primary text-black border-theme-primary font-bold shadow-[0_0_10px_var(--theme-primary)]'
                : 'bg-black/40 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Quote className="w-3 h-3" />
            <span>Quote</span>
          </button>
        </div>

        {/* Live HUD Quick Readout */}
        <div className="flex items-center gap-4 text-xs font-mono ml-auto">
          {/* Progress / Remaining Counter */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase">
              {mode.type === 'time' ? 'Time Remaining' : 'Progress'}
            </span>
            <span className="text-sm font-bold text-white">
              {mode.type === 'time' ? (
                `${timeRemaining ?? mode.duration}s`
              ) : (
                `${Math.min(totalWords, currentWordIndex)} / ${totalWords}`
              )}
            </span>
          </div>

          {/* Live WPM Pill */}
          <div className="flex flex-col items-end border-l border-white/10 pl-3">
            <span className="text-[10px] text-slate-500 uppercase">Speed</span>
            <span className="text-sm font-bold text-theme-primary">
              {liveWpm} <span className="text-[10px] text-slate-400">WPM</span>
            </span>
          </div>

          {/* Live Accuracy */}
          <div className="flex flex-col items-end border-l border-white/10 pl-3">
            <span className="text-[10px] text-slate-500 uppercase">Acc</span>
            <span className={`text-sm font-bold ${liveAccuracy >= 95 ? 'text-cyber-lime' : 'text-slate-200'}`}>
              {liveAccuracy}%
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
