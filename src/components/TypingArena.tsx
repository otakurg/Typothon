import React, { useRef, useEffect, useState } from 'react';
import type { WordState } from '../hooks/useTypingEngine';
import { MousePointerClick, RotateCcw } from 'lucide-react';

interface TypingArenaProps {
  words: WordState[];
  currentWordIndex: number;
  currentInput: string;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRestart: () => void;
  isLocked: boolean;
  quoteSource?: string;
}

export const TypingArena: React.FC<TypingArenaProps> = ({
  words,
  currentWordIndex,
  currentInput,
  onKeyDown,
  onRestart,
  isLocked,
  quoteSource
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(true);

  // Auto focus input on mount and when unlocked
  useEffect(() => {
    if (!isLocked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLocked]);

  // Scroll active word into visible viewport smoothly
  useEffect(() => {
    if (currentWordRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = currentWordRef.current;

      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const elemTop = element.offsetTop;
      const elemHeight = element.clientHeight;

      // Scroll if the word is outside the middle 50% of the box
      if (elemTop < containerTop + 20 || elemTop + elemHeight > containerTop + containerHeight - 20) {
        container.scrollTo({
          top: elemTop - containerHeight / 2 + elemHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [currentWordIndex]);

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      setIsFocused(true);
    }
  };

  return (
    <div
      className="relative w-full rounded-2xl glass-panel p-6 sm:p-8 min-h-[220px] max-h-[340px] flex flex-col justify-between select-none cursor-text transition-all duration-300 border border-white/[0.08] shadow-2xl backdrop-blur-xl group"
      onClick={handleContainerClick}
    >
      {/* Hidden input to capture keystrokes */}
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none -top-40 left-0"
        onKeyDown={onKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus
        tabIndex={0}
        aria-label="Typing input capture"
      />

      {/* Unfocused Overlay */}
      {!isFocused && !isLocked && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-opacity">
          <div className="flex items-center gap-2 text-theme-primary font-bold text-sm tracking-wider uppercase bg-theme-primary/10 border border-theme-primary/30 px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(0,245,255,0.2)] animate-pulse">
            <MousePointerClick className="w-4 h-4" />
            Click or press any key to focus
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Keyboard input paused while out of focus
          </p>
        </div>
      )}

      {/* Words Stream Container */}
      <div
        ref={containerRef}
        className="overflow-y-auto max-h-[220px] pr-2 flex flex-wrap gap-x-2.5 gap-y-3.5 text-lg sm:text-xl md:text-2xl font-mono leading-relaxed tracking-wide scroll-smooth transition-all"
        style={{ scrollbarWidth: 'thin' }}
      >
        {words.map((wordObj, wIdx) => {
          const isCurrent = wIdx === currentWordIndex;
          const isPast = wIdx < currentWordIndex;

          return (
            <div
              key={wIdx}
              ref={isCurrent ? currentWordRef : null}
              className={`relative flex items-center px-1 rounded transition-all duration-150 ${
                isCurrent
                  ? 'bg-white/[0.04] ring-1 ring-white/10 shadow-[0_0_12px_rgba(255,255,255,0.03)]'
                  : ''
              } ${
                wordObj.hasError && isPast
                  ? 'border-b-2 border-cyber-crimson'
                  : ''
              }`}
            >
              {wordObj.chars.map((charObj, cIdx) => {
                const isCaretHere = isCurrent && cIdx === currentInput.length;

                let charColor = 'text-slate-500/80';
                if (charObj.state === 'correct') {
                  charColor = 'text-theme-primary [text-shadow:0_0_8px_var(--theme-primary)] font-medium';
                } else if (charObj.state === 'incorrect') {
                  charColor = 'text-cyber-crimson bg-cyber-crimson/20 rounded-xs [text-shadow:0_0_8px_#FF3366] font-bold underline decoration-cyber-crimson';
                } else if (charObj.state === 'extra') {
                  charColor = 'text-red-400 bg-red-500/30 rounded-xs font-bold';
                }

                return (
                  <span key={cIdx} className="relative inline-block">
                    {/* Animated Caret on current character */}
                    {isCaretHere && isFocused && !isLocked && (
                      <span
                        className="absolute -left-[1.5px] top-1 bottom-1 w-[2.5px] bg-theme-primary rounded-full animate-caret pointer-events-none"
                        style={{
                          boxShadow: '0 0 10px var(--theme-primary), 0 0 15px var(--theme-primary)',
                        }}
                      />
                    )}
                    <span className={charColor}>{charObj.char}</span>
                  </span>
                );
              })}

              {/* Caret at the end of the word if user typed all characters or extra */}
              {isCurrent && currentInput.length >= wordObj.chars.length && isFocused && !isLocked && (
                <span className="relative inline-block w-0">
                  <span
                    className="absolute -left-[1.5px] top-1 bottom-1 w-[2.5px] bg-theme-primary rounded-full animate-caret pointer-events-none"
                    style={{
                      boxShadow: '0 0 10px var(--theme-primary), 0 0 15px var(--theme-primary)',
                    }}
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info: Hotkey guidance & Quote citation */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestart();
              if (inputRef.current) inputRef.current.focus();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-theme-primary transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
            title="Restart Race"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-slate-400">Tab</kbd>
            {' '}+{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-slate-400">Enter</kbd>
            {' '}to restart
          </span>
        </div>

        {quoteSource && (
          <div className="text-right italic text-slate-400 text-[11px] truncate max-w-xs sm:max-w-md">
            — {quoteSource}
          </div>
        )}
      </div>
    </div>
  );
};
