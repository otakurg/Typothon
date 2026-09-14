import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import type { RaceResults, Racer } from '../types/race';
import { 
  RotateCcw, 
  Share2, 
  ArrowRight, 
  Check, 
  Flame, 
  Target, 
  Clock, 
  Activity,
  Trophy,
  Swords,
  X
} from 'lucide-react';
import { QuickChatBar } from './QuickChatBar';

interface ResultsModalProps {
  results: RaceResults;
  allRacers: Racer[];
  onPlayAgain: () => void;
  onNextTrack: () => void;
  seriesScores?: Record<string, number>;
  onRematch?: () => void;
  onSendQuickChat?: (phrase: string) => void;
  isMultiplayer?: boolean;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  results,
  allRacers,
  onPlayAgain,
  onNextTrack,
  seriesScores = {},
  onRematch,
  onSendQuickChat,
  isMultiplayer = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Compute final podium rankings
  const sortedRacers = [...allRacers].sort((a, b) => {
    if (a.finishTime && b.finishTime) return a.finishTime - b.finishTime;
    if (a.finishTime) return -1;
    if (b.finishTime) return 1;
    return b.progress - a.progress;
  });

  const userRank = sortedRacers.findIndex(r => r.isUser) + 1;

  // Fire confetti cannon on mount
  useEffect(() => {
    const isTopThree = userRank <= 3;
    const duration = isTopThree ? 2500 : 1200;
    const end = Date.now() + duration;

    const colors = ['#00F5FF', '#39FF14', '#BD00FF', '#FFE600', '#FF3366'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [userRank]);

  // Peak WPM from timeline
  const peakWpm = results.timeline.length > 0 
    ? Math.max(...results.timeline.map(t => t.netWpm), results.netWpm) 
    : results.netWpm;

  // Share result to clipboard
  const handleShare = async () => {
    const text = `🏁 Typothon Telemetry:
⚡ Net Speed: ${results.netWpm} WPM (Peak: ${peakWpm} WPM)
🎯 Accuracy: ${results.accuracy}%
📊 Rank: #${userRank}
⏱️ Time: ${results.durationSeconds}s | Latency: ${results.keyLatencyMs}ms
Consistency: ${results.consistency}%
Play: Typothon (Cyberpunk Edition)`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Keyboard shortcut listener for Tab+Enter / Esc
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && e.ctrlKey)) {
        onPlayAgain();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onPlayAgain]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-md p-3 sm:p-6 md:p-8">
      <div className="min-h-full w-full flex items-start sm:items-center justify-center py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl glass-panel rounded-3xl p-5 sm:p-8 border border-theme-primary/30 shadow-[0_0_50px_rgba(0,245,255,0.15)] my-auto relative"
        >
          {/* Header with Rank & Trophy */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl border flex-shrink-0 ${
                  userRank === 1
                    ? 'bg-amber-400/20 border-amber-400 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : userRank === 2
                    ? 'bg-slate-300/20 border-slate-300 text-slate-200'
                    : userRank === 3
                    ? 'bg-amber-700/20 border-amber-700 text-amber-600'
                    : 'bg-white/10 border-white/20 text-slate-400'
                }`}
              >
                {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : '🏎️'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-theme-primary uppercase tracking-widest font-semibold">
                    Race Complete
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
                    PODIUM #{userRank}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display tracking-tight text-white mt-0.5 leading-tight">
                  {userRank === 1
                    ? 'VICTORY: GRID CHAMPION'
                    : userRank === 2
                    ? 'RUNNER UP: IMPRESSIVE VELOCITY'
                    : userRank === 3
                    ? 'PODIUM FINISH: WELL RACED'
                    : 'RACE CONCLUDED'}
                </h2>
              </div>
            </div>

            {/* Quick Action Buttons + Close X */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-panel border border-white/10 hover:border-theme-primary/40 text-xs font-mono text-slate-300 hover:text-white transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-cyber-lime" />
                    <span className="text-cyber-lime">Copied Telemetry!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Result</span>
                  </>
                )}
              </button>

              <button
                onClick={onPlayAgain}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Series Scoreboard / Rematch Banner in Multiplayer */}
        {isMultiplayer && (
          <div className="my-5 p-3.5 sm:p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold block">
                  Head-to-Head Series Score
                </span>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-mono mt-0.5">
                  {Object.entries(seriesScores).length > 0 ? (
                    Object.entries(seriesScores).map(([name, score], idx) => (
                      <span key={name} className="flex items-center gap-1.5">
                        {idx > 0 && <span className="text-slate-500 font-bold">vs</span>}
                        <span className="text-white font-bold">{name}</span>
                        <span className="bg-black/80 px-2 py-0.5 rounded font-black text-cyber-lime border border-amber-400/30">{score}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs">Series in progress • First round completed</span>
                  )}
                </div>
              </div>
            </div>

            {onRematch && (
              <button
                onClick={onRematch}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-mono font-bold text-xs hover:brightness-110 shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all flex items-center gap-1.5 transform hover:scale-105"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Instant Rematch</span>
              </button>
            )}
          </div>
        )}

        {/* Primary Headline Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
          {/* Net WPM */}
          <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] flex flex-col">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-theme-primary" /> Net Speed
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black font-display text-theme-primary tracking-tight">
                {results.netWpm}
              </span>
              <span className="text-xs font-mono text-slate-400">WPM</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1">
              Raw: {results.rawWpm} WPM
            </span>
          </div>

          {/* Accuracy */}
          <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] flex flex-col">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyber-lime" /> Accuracy
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className={`text-4xl font-black font-display tracking-tight ${
                results.accuracy >= 97 ? 'text-cyber-lime' : results.accuracy >= 90 ? 'text-slate-100' : 'text-cyber-crimson'
              }`}>
                {results.accuracy}%
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1">
              {results.totalErrors} errors ({results.uncorrectedErrors} uncorrected)
            </span>
          </div>

          {/* Consistency */}
          <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] flex flex-col">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyber-violet" /> Consistency
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black font-display text-cyber-violet tracking-tight">
                {results.consistency}%
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1">
              Latency: {results.keyLatencyMs}ms / key
            </span>
          </div>

          {/* Time & Total Keystrokes */}
          <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] flex flex-col">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Duration
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black font-display text-white tracking-tight">
                {results.durationSeconds}s
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-1">
              {results.totalKeystrokes} total keys
            </span>
          </div>
        </div>

        {/* Speed Curve Telemetry Graph (Recharts) */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/[0.08] mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-theme-primary" /> Velocity Telemetry Curve
            </span>
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-theme-primary">
                <span className="w-2.5 h-2.5 rounded-full bg-theme-primary inline-block" /> Net WPM
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> Raw WPM
              </span>
            </div>
          </div>

          <div className="h-44 sm:h-52 w-full">
            {results.timeline.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="second" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickFormatter={(sec) => `${sec}s`} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    domain={[0, 'auto']} 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(13, 15, 23, 0.95)',
                      borderColor: 'rgba(0, 245, 255, 0.3)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
                  <Line
                    type="monotone"
                    dataKey="rawWpm"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    dot={false}
                    name="Raw WPM"
                  />
                  <Line
                    type="monotone"
                    dataKey="netWpm"
                    stroke="#00F5FF"
                    strokeWidth={2.5}
                    dot={{ fill: '#00F5FF', r: 3 }}
                    activeDot={{ r: 6, fill: '#00F5FF', stroke: '#fff' }}
                    name="Net WPM"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                Race completed in sprint format ({results.netWpm} WPM overall)
              </div>
            )}
          </div>
        </div>

        {/* Detailed Character Telemetry & Final Standings Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Character Breakdown */}
          <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-3">
              Character Breakdown
            </span>
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase block">Correct</span>
                <span className="text-lg font-bold text-cyber-lime mt-1 block">
                  {results.correctChars}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase block">Incorrect</span>
                <span className="text-lg font-bold text-cyber-crimson mt-1 block">
                  {results.incorrectChars}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase block">Extra</span>
                <span className="text-lg font-bold text-amber-400 mt-1 block">
                  {results.extraChars}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase block">Missed</span>
                <span className="text-lg font-bold text-slate-400 mt-1 block">
                  {results.missedChars}
                </span>
              </div>
            </div>
          </div>

          {/* Final Finish Order */}
          <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-3">
              Final Grid Positions
            </span>
            <div className="flex flex-col gap-2">
              {sortedRacers.slice(0, 4).map((racer, idx) => (
                <div
                  key={racer.id}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-mono ${
                    racer.isUser ? 'bg-theme-primary/10 border border-theme-primary/30 text-theme-primary' : 'bg-black/30 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">#{idx + 1}</span>
                    <span>{racer.avatar}</span>
                    <span className="font-medium truncate max-w-[120px]">
                      {racer.name} {racer.isUser && '(YOU)'}
                    </span>
                  </div>
                  <span className="font-bold" style={{ color: racer.color }}>
                    {racer.currentWpm} WPM
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Post-race Quick Chat Comms in Multiplayer */}
        {isMultiplayer && onSendQuickChat && (
          <div className="mb-6">
            <QuickChatBar onSendChat={onSendQuickChat} />
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <span className="text-xs font-mono text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">Esc</kbd> or click button to restart
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onNextTrack}
              className="px-5 py-2.5 rounded-xl glass-panel border border-white/15 text-slate-200 hover:text-white hover:border-theme-primary/50 text-xs font-mono flex items-center gap-2 transition-all"
            >
              <span>Next Track</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {isMultiplayer && onRematch ? (
              <button
                onClick={onRematch}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs font-mono shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:brightness-110 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
              >
                <Swords className="w-4 h-4" />
                <span>Instant Rematch</span>
              </button>
            ) : (
              <button
                onClick={onPlayAgain}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-theme-primary to-theme-secondary text-black font-bold text-xs font-mono shadow-[0_0_20px_var(--theme-primary)] hover:opacity-95 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            )}
          </div>
        </div>
        </motion.div>
      </div>
    </div>
  );
};
