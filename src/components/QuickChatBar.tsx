import React from 'react';
import { MessageSquare } from 'lucide-react';

const QUICK_CHAT_OPTIONS = [
  { id: 'ready', text: 'Ready when you are! ⚡' },
  { id: 'glhf', text: 'Good luck, have fun! 🤝' },
  { id: 'rematch', text: 'Rematch! 🔄' },
  { id: 'overclocked', text: 'Overclocked! 🔥' },
  { id: 'clean', text: 'Clean race! 🏁' },
];

interface QuickChatBarProps {
  onSendChat: (message: string) => void;
  disabled?: boolean;
}

export const QuickChatBar: React.FC<QuickChatBarProps> = ({ onSendChat, disabled = false }) => {
  return (
    <div className="w-full flex flex-col gap-2 p-3 rounded-2xl bg-black/40 border border-white/5">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1 uppercase tracking-wider font-semibold">
          <MessageSquare className="w-3 h-3 text-theme-primary" /> Tactical Radio Comms
        </span>
        <span className="text-slate-500">1-click radio emote</span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {QUICK_CHAT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            disabled={disabled}
            onClick={() => onSendChat(opt.text)}
            className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-theme-primary/10 border border-white/10 hover:border-theme-primary/40 text-[11px] font-mono text-slate-300 hover:text-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-40"
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
};
