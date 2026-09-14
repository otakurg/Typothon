import React from 'react';
import { motion } from 'framer-motion';
import { THEMES } from '../constants/themes';
import type { ThemeId } from '../types/race';
import { Check, X, Sparkles } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-theme-primary" />
            <h3 className="text-lg font-bold font-display text-white tracking-wide uppercase">
              Visual Themes
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Cards List */}
        <div className="flex flex-col gap-3">
          {(Object.values(THEMES) as Array<typeof THEMES[ThemeId]>).map((theme) => {
            const isSelected = currentTheme === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-theme-primary bg-theme-primary/10 shadow-[0_0_20px_rgba(0,245,255,0.15)] ring-1 ring-theme-primary/30'
                    : 'border-white/5 bg-black/40 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-mono">
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-theme-primary/20 text-theme-primary font-bold border border-theme-primary/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    {theme.tagline}
                  </p>
                </div>

                {/* Color Swatch Dots */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5 p-1 rounded-lg bg-black/60 border border-white/10">
                    <div
                      className="w-4 h-4 rounded-full border border-black"
                      style={{ backgroundColor: theme.previewColors.bg }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black"
                      style={{ backgroundColor: theme.previewColors.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black"
                      style={{ backgroundColor: theme.previewColors.accent }}
                    />
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-theme-primary flex items-center justify-center text-black">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] font-mono text-slate-500 mt-5">
          Select a theme to instantly update fonts, glows, and race palettes.
        </p>
      </motion.div>
    </div>
  );
};
