import { useState, useEffect, useRef, useCallback } from 'react';
import type { Racer, RaceMode } from '../types/race';

const INITIAL_BOTS: Racer[] = [
  {
    id: 'bot-1',
    name: 'Rookie.bin',
    isUser: false,
    color: '#00F5FF', // Cyan
    avatar: '🤖',
    progress: 0,
    currentWpm: 45,
    targetWpm: 48,
    difficulty: 'easy'
  },
  {
    id: 'bot-2',
    name: 'GridRunner',
    isUser: false,
    color: '#39FF14', // Lime
    avatar: '⚡',
    progress: 0,
    currentWpm: 75,
    targetWpm: 78,
    difficulty: 'medium'
  },
  {
    id: 'bot-3',
    name: 'Overclocked_X',
    isUser: false,
    color: '#BD00FF', // Violet
    avatar: '🔥',
    progress: 0,
    currentWpm: 105,
    targetWpm: 108,
    difficulty: 'hard'
  }
];

interface UseRaceBotsProps {
  isRacing: boolean;
  mode: RaceMode;
  targetTextLength: number;
}

export function useRaceBots({ isRacing, mode, targetTextLength }: UseRaceBotsProps) {
  const [bots, setBots] = useState<Racer[]>(INITIAL_BOTS);
  const botStatsRef = useRef<{
    [id: string]: {
      currentChars: number;
      instantWpm: number;
      targetWpm: number;
      jitterTimer: number;
    }
  }>({
    'bot-1': { currentChars: 0, instantWpm: 45, targetWpm: 48, jitterTimer: 0 },
    'bot-2': { currentChars: 0, instantWpm: 75, targetWpm: 78, jitterTimer: 0 },
    'bot-3': { currentChars: 0, instantWpm: 105, targetWpm: 108, jitterTimer: 0 },
  });

  // Reset bots
  const resetBots = useCallback(() => {
    botStatsRef.current = {
      'bot-1': { currentChars: 0, instantWpm: 45, targetWpm: 46 + Math.random() * 8, jitterTimer: 0 },
      'bot-2': { currentChars: 0, instantWpm: 75, targetWpm: 74 + Math.random() * 10, jitterTimer: 0 },
      'bot-3': { currentChars: 0, instantWpm: 105, targetWpm: 102 + Math.random() * 14, jitterTimer: 0 },
    };

    setBots(INITIAL_BOTS.map(bot => ({
      ...bot,
      progress: 0,
      currentWpm: bot.targetWpm || 60,
      finishTime: undefined,
      rank: undefined
    })));
  }, []);

  // Dynamic simulation loop
  useEffect(() => {
    if (!isRacing) return;

    // Approximate total characters needed to finish
    const approxTotalChars = mode.type === 'words' 
      ? mode.count * 5.2 
      : mode.type === 'time'
      ? (mode.duration / 60) * 85 * 5 // standard reference characters for time mode
      : targetTextLength;

    const interval = setInterval(() => {
      setBots(prevBots => {
        return prevBots.map(bot => {
          if (bot.progress >= 100) return bot;

          const stats = botStatsRef.current[bot.id] || {
            currentChars: 0,
            instantWpm: bot.targetWpm || 60,
            targetWpm: bot.targetWpm || 60,
            jitterTimer: 0
          };

          // Update jitter every ~1-2 seconds
          stats.jitterTimer += 0.1;
          if (stats.jitterTimer > 1.5) {
            stats.jitterTimer = 0;
            // Human-like speed variations +/- 12%
            const variance = (Math.random() - 0.48) * (stats.targetWpm * 0.22);
            stats.instantWpm = Math.max(20, Math.round(stats.targetWpm + variance));
          }

          // Characters typed per 100ms interval:
          // WPM = (chars / 5) / minutes => chars/sec = (WPM * 5) / 60 => chars/100ms = (WPM * 5) / 600
          const charsTypedThisTick = (stats.instantWpm * 5) / 600;
          stats.currentChars += charsTypedThisTick;
          botStatsRef.current[bot.id] = stats;

          const newProgress = Math.min(100, Math.round((stats.currentChars / approxTotalChars) * 100));

          return {
            ...bot,
            progress: newProgress,
            currentWpm: stats.instantWpm,
            finishTime: newProgress >= 100 && !bot.finishTime ? Date.now() : bot.finishTime
          };
        });
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRacing, mode, targetTextLength]);

  return {
    bots,
    resetBots
  };
}
