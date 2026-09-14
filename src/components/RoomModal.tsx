import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  X, 
  Copy, 
  Check, 
  Play, 
  UserCheck, 
  LogOut, 
  Plus,
  Wifi,
  Globe,
  Clock,
  Zap
} from 'lucide-react';
import type { RoomParticipant } from '../hooks/useRaceRoom';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  userName: string;
  setUserName: (name: string) => void;
  userAvatar: string;
  setUserAvatar: (avatar: string) => void;
  isReady: boolean;
  onToggleReady: () => void;
  onCreateRoom: () => string;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
  onStartRace: () => void;
  remoteCount: number;
  networkStatus?: 'connected' | 'connecting' | 'offline';
  remotePilots?: RoomParticipant[];
  allReady?: boolean;
  lobbyCountdown?: number | null;
}

const AVATAR_OPTIONS = ['🚀', '⚡', '🛸', '🏎️', '🏍️', '👾', '🤖', '🔥'];

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  roomId,
  userName,
  setUserName,
  userAvatar,
  setUserAvatar,
  isReady,
  onToggleReady,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onStartRace,
  remoteCount: _remoteCount,
  networkStatus = 'offline',
  remotePilots = [],
  allReady = false,
  lobbyCountdown = null,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCodeInput.trim()) {
      onJoinRoom(joinCodeInput);
      setJoinCodeInput('');
    }
  };

  const totalPilots = remotePilots.length + 1;
  const readyCount = (isReady ? 1 : 0) + remotePilots.filter(p => p.isReady).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-theme-primary" />
            <div>
              <h3 className="text-lg font-bold font-display text-white tracking-wide uppercase">
                Multiplayer Network Arena
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] font-mono mt-0.5">
                {networkStatus === 'connected' ? (
                  <span className="text-cyber-lime flex items-center gap-1 font-semibold">
                    <Globe className="w-3 h-3" /> Global Multi-PC Mesh Online
                  </span>
                ) : networkStatus === 'connecting' ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Wifi className="w-3 h-3 animate-spin" /> Connecting Cloud Mesh...
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Local Standalone
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pilot Profile Customization */}
        <div className="mb-5 p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-3">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Pilot Configuration
          </span>
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
                {userAvatar}
              </div>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                maxLength={18}
                placeholder="Callsign / Handle"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-theme-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Avatar Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {AVATAR_OPTIONS.map((av) => (
              <button
                key={av}
                onClick={() => setUserAvatar(av)}
                className={`p-1.5 rounded-lg text-base transition-transform ${
                  userAvatar === av
                    ? 'bg-theme-primary/20 border border-theme-primary scale-110'
                    : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Room State: Active Room vs Create/Join */}
        {roomId ? (
          <div className="flex flex-col gap-4">
            {/* Room Code Badge */}
            <div className="p-4 rounded-2xl bg-theme-primary/[0.07] border border-theme-primary/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-theme-primary uppercase tracking-widest font-semibold">
                    Active Room Code
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyber-lime/20 text-cyber-lime font-mono font-bold">
                    LIVE
                  </span>
                </div>
                <span className="text-2xl font-black font-mono text-white tracking-widest mt-0.5 block">
                  {roomId}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-cyber-lime" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Pilot Readiness Roster */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                <span className="uppercase tracking-wider font-bold">Pilot Grid Readiness</span>
                <span>{readyCount} / {totalPilots} Ready</span>
              </div>

              {/* Local Player Card */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{userAvatar}</span>
                  <span className="text-xs font-mono font-bold text-theme-primary">
                    {userName} <span className="text-[10px] text-slate-400 font-normal">(YOU)</span>
                  </span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  isReady ? 'bg-cyber-lime/20 text-cyber-lime border border-cyber-lime/30' : 'bg-amber-400/20 text-amber-400'
                }`}>
                  {isReady ? 'READY' : 'PREPARING'}
                </span>
              </div>

              {/* Remote Players List */}
              {remotePilots.map((pilot) => (
                <div key={pilot.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{pilot.avatar}</span>
                    <span className="text-xs font-mono text-white font-medium">
                      {pilot.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    pilot.isReady ? 'bg-cyber-lime/20 text-cyber-lime border border-cyber-lime/30' : 'bg-amber-400/20 text-amber-400'
                  }`}>
                    {pilot.isReady ? 'READY' : 'PREPARING'}
                  </span>
                </div>
              ))}

              {remotePilots.length === 0 && (
                <div className="text-center py-2 text-xs font-mono text-slate-500 italic">
                  Waiting for other pilots to join room {roomId}...
                </div>
              )}
            </div>

            {/* Active 10-Second Countdown Banner */}
            {lobbyCountdown !== null && (
              <div className="p-4 rounded-2xl bg-cyber-lime/15 border border-cyber-lime/40 flex items-center justify-between shadow-[0_0_20px_rgba(57,255,20,0.2)]">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-5 h-5 text-cyber-lime animate-bounce" />
                  <div>
                    <span className="text-xs font-mono font-bold text-cyber-lime uppercase block">
                      ALL PILOTS READY // LAUNCHING
                    </span>
                    <span className="text-[11px] font-mono text-slate-300">
                      Synchronized grid start across all screens
                    </span>
                  </div>
                </div>
                <span className="text-3xl font-black font-display text-cyber-lime">
                  {lobbyCountdown < 10 ? `0${lobbyCountdown}` : lobbyCountdown}s
                </span>
              </div>
            )}

            {/* Status Guide */}
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 px-1">
              <Clock className="w-3.5 h-3.5 text-theme-primary flex-shrink-0" />
              <span>
                {allReady
                  ? '🏎️ Race starting in 10s! Hands on keyboard.'
                  : 'Competitive Rule: The 10s race timer starts automatically once all pilots click READY.'}
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onLeaveRoom}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave</span>
              </button>

              <button
                onClick={onToggleReady}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                  isReady
                    ? 'bg-cyber-lime/20 border-cyber-lime text-cyber-lime shadow-[0_0_15px_rgba(57,255,20,0.2)]'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{isReady ? 'UNREADY / PAUSE' : 'CLICK TO READY'}</span>
              </button>

              {allReady && lobbyCountdown !== null ? (
                <button
                  onClick={() => {
                    onStartRace();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyber-lime to-theme-primary text-black font-bold text-xs font-mono shadow-[0_0_15px_rgba(57,255,20,0.4)] hover:opacity-95 flex items-center gap-1.5 transition-transform hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Launch Now</span>
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Create Room Button */}
            <button
              onClick={() => onCreateRoom()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-theme-primary to-theme-secondary text-black font-bold font-mono text-sm shadow-[0_0_20px_var(--theme-primary)] flex items-center justify-center gap-2 hover:opacity-95 transition-all transform hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Host New Race Room</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-500 my-1">
              <div className="flex-1 h-px bg-white/10" />
              <span>OR JOIN ANY ROOM WITH CODE</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Join Room Form */}
            <form onSubmit={handleJoinSubmit} className="flex gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER CODE (e.g. NEO-5821)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-theme-primary outline-none transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl glass-panel border border-white/20 hover:border-theme-primary text-xs font-mono text-white font-bold hover:bg-theme-primary/10 transition-all"
              >
                Join
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
