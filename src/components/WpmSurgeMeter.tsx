import React from 'react';
import { Flame, Gauge, Zap } from 'lucide-react';

interface WpmSurgeMeterProps {
  wpm: number;
  accuracy: number;
  rawWpm: number;
}

export const WpmSurgeMeter: React.FC<WpmSurgeMeterProps> = ({ wpm, accuracy, rawWpm }) => {
  // Speed tier calculation
  const getTier = (speed: number) => {
    if (speed >= 120) {
      return {
        label: 'GODSPEED',
        color: 'text-cyber-yellow',
        border: 'border-cyber-yellow/40',
        glow: 'shadow-[0_0_25px_rgba(255,230,0,0.5)]',
        bg: 'bg-cyber-yellow/10',
        icon: <Flame className="w-4 h-4 text-cyber-yellow animate-bounce" />,
      };
    }
    if (speed >= 95) {
      return {
        label: 'OVERCLOCKED',
        color: 'text-cyber-violet',
        border: 'border-cyber-violet/40',
        glow: 'shadow-[0_0_20px_rgba(189,0,255,0.4)]',
        bg: 'bg-cyber-violet/10',
        icon: <Zap className="w-4 h-4 text-cyber-violet animate-pulse" />,
      };
    }
    if (speed >= 70) {
      return {
        label: 'HYPER-DRIVE',
        color: 'text-cyber-lime',
        border: 'border-cyber-lime/40',
        glow: 'shadow-[0_0_18px_rgba(57,255,20,0.35)]',
        bg: 'bg-cyber-lime/10',
        icon: <Gauge className="w-4 h-4 text-cyber-lime" />,
      };
    }
    if (speed >= 45) {
      return {
        label: 'VELOCITY',
        color: 'text-theme-primary',
        border: 'border-theme-primary/30',
        glow: 'shadow-[0_0_15px_rgba(0,245,255,0.3)]',
        bg: 'bg-theme-primary/10',
        icon: <Gauge className="w-4 h-4 text-theme-primary" />,
      };
    }
    return {
      label: 'IDLE / CRUISE',
      color: 'text-slate-400',
      border: 'border-white/10',
      glow: '',
      bg: 'bg-white/5',
      icon: <Gauge className="w-4 h-4 text-slate-500" />,
    };
  };

  const tier = getTier(wpm);
  // Tachometer percentage capped at 160 WPM
  const percentage = Math.min(100, Math.round((wpm / 140) * 100));

  return (
    <div
      className={`glass-panel rounded-2xl p-4 transition-all duration-300 border ${tier.border} ${tier.glow} flex items-center justify-between gap-4`}
    >
      {/* Speed & Tier Status */}
      <div className="flex items-center gap-3.5">
        <div className={`p-2.5 rounded-xl border ${tier.border} ${tier.bg}`}>
          {tier.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Speed Surge
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${tier.bg} ${tier.color}`}>
              {tier.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={`text-3xl font-black font-display tracking-tight transition-colors duration-200 ${tier.color}`}>
              {wpm}
            </span>
            <span className="text-xs text-slate-400 font-mono">WPM</span>
            <span className="text-[11px] text-slate-500 font-mono ml-1">
              (Raw: {rawWpm})
            </span>
          </div>
        </div>
      </div>

      {/* Surge Revs Bar Meter */}
      <div className="w-36 sm:w-48 flex flex-col gap-1.5">
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>0</span>
          <span>70</span>
          <span>140+</span>
        </div>
        <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, #00F5FF 0%, #39FF14 50%, #BD00FF 80%, #FF3366 100%)`,
              boxShadow: wpm > 40 ? '0 0 10px rgba(0, 245, 255, 0.5)' : 'none',
            }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-slate-400">Accuracy</span>
          <span className={`font-bold ${accuracy >= 97 ? 'text-cyber-lime' : accuracy >= 90 ? 'text-theme-primary' : 'text-cyber-crimson'}`}>
            {accuracy}%
          </span>
        </div>
      </div>
    </div>
  );
};
