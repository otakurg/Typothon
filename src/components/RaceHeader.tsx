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
  Quote,
  Trophy,
  Crown
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
  isHost?: boolean;
  seriesScores?: Record<string, number>;
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
  isHost = true,
  seriesScores = {},
}) => {
  const isMultiplayer = !!roomId;
  const canChangeMode = !isMultiplayer || isHost;

  const scoreEntries = Object.entries(seriesScores);
  const hasSeriesScores = scoreEntries.length > 0;

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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-wider uppercase font-display bg-gradient-to-r from-theme-primary via-white to-theme-secondary bg-clip-text text-transparent">
                Typothon
              </h1>
              {isMultiplayer && isHost && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30 font-bold">
                  <Crown className="w-3 h-3" /> HOST
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-theme-subtext">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-lime animate-ping" />
              <span>SYSTEM ONLINE // V2.5 MULTI-MESH</span>
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
          {!canChangeMode && (
            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20 mr-1 flex items-center gap-1 font-semibold">
              <Crown className="w-3 h-3" /> Host Chooses Mode
            </span>
          )}

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
                  disabled={!canChangeMode}
                  onClick={() => onSelectMode({ type: 'time', duration })}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-theme-primary text-black font-bold shadow-[0_0_10px_var(--theme-primary)]'
                      : canChangeMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 cursor-not-allowed'
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
                  disabled={!canChangeMode}
                  onClick={() => onSelectMode({ type: 'words', count })}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-theme-primary text-black font-bold shadow-[0_0_10px_var(--theme-primary)]'
                      : canChangeMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>

          {/* Quote Mode */}
          <button
            disabled={!canChangeMode}
            onClick={() => onSelectMode({ type: 'quote' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              mode.type === 'quote'
                ? 'bg-theme-primary text-black border-theme-primary font-bold shadow-[0_0_10px_var(--theme-primary)]'
                : canChangeMode ? 'bg-black/40 border-white/5 text-slate-400 hover:text-white' : 'bg-black/40 border-white/5 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Quote className="w-3 h-3" />
            <span>Quote</span>
          </button>
        </div>

        {/* Series Scoreboard Pill (If tournament rounds played) */}
        {hasSeriesScores && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs font-mono text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.15)]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">SERIES:</span>
            {scoreEntries.map(([name, score], idx) => (
              <span key={name} className="flex items-center gap-1">
                {idx > 0 && <span className="text-slate-500">vs</span>}
                <span className="text-white font-bold">{name}</span>
                <span className="bg-black/60 px-1.5 py-0.2 rounded font-black text-cyber-lime">{score}</span>
              </span>
            ))}
          </div>
        )}

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
