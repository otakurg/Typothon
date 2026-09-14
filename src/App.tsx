import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { RaceMode, RaceStatus, ThemeId, Racer, RaceResults } from './types/race';
import { THEMES } from './constants/themes';
import { generateRaceText } from './constants/words';
import { useSoundEffects } from './hooks/useSoundEffects';
import { useTypingEngine } from './hooks/useTypingEngine';
import { useRaceBots } from './hooks/useRaceBots';
import { useRaceRoom } from './hooks/useRaceRoom';

import { RaceHeader } from './components/RaceHeader';
import { RaceTrack } from './components/RaceTrack';
import { TypingArena } from './components/TypingArena';
import { WpmSurgeMeter } from './components/WpmSurgeMeter';
import { LiveLeaderboard } from './components/LiveLeaderboard';
import { ResultsModal } from './components/ResultsModal';
import { ThemeSelector } from './components/ThemeSelector';
import { RoomModal } from './components/RoomModal';
import { CountdownOverlay } from './components/CountdownOverlay';
import { LobbyCountdownBanner } from './components/LobbyCountdownBanner';
import { CyberToast } from './components/CyberToast';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('typothon_theme') as ThemeId) || 'cyberpunk';
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('typothon_theme', theme);
  }, [theme]);

  // Race Mode & Target Text
  const [mode, setMode] = useState<RaceMode>({ type: 'time', duration: 30 });
  const [raceData, setRaceData] = useState(() => generateRaceText(mode));
  const [status, setStatus] = useState<RaceStatus>('idle');
  const [raceResults, setRaceResults] = useState<RaceResults | null>(null);
  const [userFinishTime, setUserFinishTime] = useState<number | undefined>(undefined);

  // Sound effects hook
  const {
    profile: soundProfile,
    setProfile: setSoundProfile,
    playKeySound,
    playCountdown,
    playFinishFanfare,
    playLobbyTick,
  } = useSoundEffects();

  const handleToggleSound = useCallback(() => {
    setSoundProfile(prev => {
      if (prev === 'off') return 'thocky';
      if (prev === 'thocky') return 'clicky';
      if (prev === 'clicky') return 'beep';
      return 'off';
    });
  }, [setSoundProfile]);

  // Bot Racers Simulation
  const { bots, resetBots } = useRaceBots({
    isRacing: status === 'racing',
    mode,
    targetTextLength: raceData.text.length,
  });

  // Multiplayer Room Hook callbacks
  const handleRemoteStart = useCallback((remotePayload?: { text: string; source?: string; mode: RaceMode }) => {
    if (remotePayload?.text) {
      setRaceData({ text: remotePayload.text, source: remotePayload.source });
      if (remotePayload.mode) setMode(remotePayload.mode);
      resetBots();
      setRaceResults(null);
      setUserFinishTime(undefined);
    }
    setIsRoomModalOpen(false);
    setStatus('countdown');
  }, [resetBots]);

  const handleHostSettingsSync = useCallback((settings: { includeBots: boolean; mode?: RaceMode }) => {
    if (settings.mode) {
      setMode(settings.mode);
      setRaceData(generateRaceText(settings.mode));
    }
  }, []);

  // Finish handler ref so useTypingEngine can be called before useRaceRoom
  const onFinishRef = useRef<(results: RaceResults) => void>(() => {});

  // Typing Engine Hook
  const {
    currentWordIndex,
    currentInput,
    renderedWords,
    netWpm,
    rawWpm,
    accuracy,
    progress: userProgress,
    elapsedTime,
    timeRemaining,
    handleKeyDown,
    resetEngine,
  } = useTypingEngine({
    targetText: raceData.text,
    mode,
    onFinish: (results) => onFinishRef.current(results),
    onKeypressSound: playKeySound,
    isLocked: status === 'countdown' || status === 'finished'
  });

  const {
    roomId,
    userId,
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    isReady,
    toggleReady,
    createRoom,
    joinRoom,
    leaveRoom,
    remoteRacers,
    remotePilots,
    remoteCount,
    networkStatus,
    allReady,
    lobbyCountdown,
    startLobbyCountdown,
    forceLaunchNow,
    isHost,
    includeBots,
    toggleIncludeBots,
    isAfk,
    toasts,
    dismissToast,
    sendQuickChat,
    chatBubbles,
    seriesScores,
    recordWinner,
    requestRematch,
    getInviteLink,
  } = useRaceRoom(
    userProgress,
    netWpm,
    status === 'finished',
    mode,
    handleRemoteStart,
    playLobbyTick,
    handleHostSettingsSync
  );

  // Handle Race finish & winner determination
  const handleRaceFinish = useCallback((results: RaceResults) => {
    setStatus('finished');
    const finishTime = Date.now();
    setUserFinishTime(finishTime);
    playFinishFanfare();
    setRaceResults(results);

    // If multiplayer, check if this pilot is the first finisher across the line
    if (roomId) {
      const anyOtherFinished = remoteRacers.some(r => r.finishTime && r.finishTime < finishTime);
      if (!anyOtherFinished) {
        recordWinner(userName);
      }
    }
  }, [playFinishFanfare, roomId, remoteRacers, userName, recordWinner]);

  useEffect(() => {
    onFinishRef.current = handleRaceFinish;
  }, [handleRaceFinish]);

  // User racer object
  const userRacer: Racer = useMemo(() => ({
    id: 'user',
    name: userName,
    isUser: true,
    color: '#00F5FF',
    avatar: userAvatar,
    progress: userProgress,
    currentWpm: netWpm,
    finishTime: userFinishTime,
    isHost,
    isAfk,
    chatBubble: chatBubbles[userId],
  }), [userName, userAvatar, userProgress, netWpm, userFinishTime, isHost, isAfk, chatBubbles, userId]);

  // Combined racers on the track:
  // If includeBots is false, pure human-only racing (User + Remote players).
  // If includeBots is true, pad up to 4 racers with simulated bots.
  const allRacers: Racer[] = useMemo(() => {
    const racers: Racer[] = [userRacer, ...remoteRacers];
    const botsNeeded = includeBots ? Math.max(0, 4 - racers.length) : 0;
    const selectedBots = bots.slice(0, botsNeeded);
    return [...racers, ...selectedBots];
  }, [userRacer, remoteRacers, bots, includeBots]);

  // Automatic 10-second F1 countdown trigger when all pilots click READY
  useEffect(() => {
    if (allReady && lobbyCountdown === null && status === 'idle') {
      startLobbyCountdown({ text: raceData.text, source: raceData.source, mode });
    }
  }, [allReady, lobbyCountdown, status, startLobbyCountdown, raceData, mode]);

  // Reset / Start Race
  const startNewRace = useCallback((newMode?: RaceMode) => {
    const currentMode = newMode || mode;
    if (newMode) setMode(newMode);
    
    setRaceData(generateRaceText(currentMode));
    resetEngine();
    resetBots();
    setRaceResults(null);
    setUserFinishTime(undefined);
    setStatus('idle');
  }, [mode, resetEngine, resetBots]);

  // Instant rematch trigger in multiplayer
  const handleRematch = useCallback(() => {
    requestRematch();
    startNewRace();
  }, [requestRematch, startNewRace]);

  // Manual Trigger from Solo Mode
  const triggerSoloStart = useCallback(() => {
    if (roomId && remoteCount > 0) {
      // In multiplayer, skip 10s and launch now
      forceLaunchNow({ text: raceData.text, source: raceData.source, mode });
    } else {
      // In solo mode, instant launch countdown
      setStatus('countdown');
    }
  }, [roomId, remoteCount, forceLaunchNow, raceData, mode]);

  // When countdown completes
  const handleCountdownComplete = useCallback(() => {
    setStatus('racing');
  }, []);

  // Global hotkeys (Tab + Enter or Esc)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        startNewRace();
      } else if (e.key === 'Escape' && status !== 'finished') {
        e.preventDefault();
        startNewRace();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [startNewRace, status]);

  return (
    <div className="min-h-screen relative w-full bg-theme-bg text-theme-text cyber-grid flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 selection:bg-theme-primary/20 selection:text-theme-primary transition-colors duration-300">
      {/* Optional CRT Scanlines if Amber Theme */}
      {THEMES[theme]?.attributes.hasScanlines && (
        <div className="crt-overlay fixed inset-0 pointer-events-none z-30" />
      )}

      {/* Main Container */}
      <div className="w-full max-w-5xl flex flex-col z-10">
        {/* Header HUD & Controls */}
        <RaceHeader
          mode={mode}
          onSelectMode={(m) => {
            startNewRace(m);
            if (roomId && isHost) {
              toggleIncludeBots(includeBots);
            }
          }}
          status={status}
          timeRemaining={timeRemaining}
          elapsedTime={elapsedTime}
          currentWordIndex={currentWordIndex}
          totalWords={raceData.text.split(/\s+/).length}
          liveWpm={netWpm}
          liveAccuracy={accuracy}
          soundProfile={soundProfile}
          onToggleSound={handleToggleSound}
          currentTheme={theme}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          roomId={roomId}
          onOpenRoomModal={() => setIsRoomModalOpen(true)}
          onRestart={() => startNewRace()}
          isHost={isHost}
          seriesScores={seriesScores}
        />

        {/* F1 Grid Launch 10-Second Countdown Banner (When all players ready) */}
        {lobbyCountdown !== null && (
          <LobbyCountdownBanner
            countdown={lobbyCountdown}
            userName={userName}
            userAvatar={userAvatar}
            remotePilots={remotePilots}
            onForceLaunch={() => forceLaunchNow({ text: raceData.text, source: raceData.source, mode })}
            onAbort={toggleReady}
          />
        )}

        {/* Live Race Track */}
        <RaceTrack racers={allRacers} />

        {/* Middle Stats Row: Floating WpmSurgeMeter + Live Standings */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          <div className="md:col-span-5">
            <WpmSurgeMeter
              wpm={netWpm}
              accuracy={accuracy}
              rawWpm={rawWpm}
            />
          </div>
          <div className="md:col-span-7">
            <LiveLeaderboard racers={allRacers} />
          </div>
        </div>

        {/* Central Typing Arena */}
        <TypingArena
          words={renderedWords}
          currentWordIndex={currentWordIndex}
          currentInput={currentInput}
          onKeyDown={handleKeyDown}
          onRestart={() => startNewRace()}
          isLocked={status === 'countdown' || status === 'finished' || lobbyCountdown !== null}
          quoteSource={raceData.source}
        />

        {/* Footer info & keyboard shortcuts */}
        <footer className="mt-8 flex flex-wrap items-center justify-between text-xs font-mono text-slate-500 py-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
            <span>Typothon Engine // React 19 + Tailwind + Web Audio</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Hotkeys: <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">Esc</kbd> restart</span>
            <span>Theme: <span className="text-theme-primary font-bold">{THEMES[theme]?.name}</span></span>
          </div>
        </footer>
      </div>

      {/* Countdown Overlay (3... 2... 1... GO!) */}
      {status === 'countdown' && (
        <CountdownOverlay
          onComplete={handleCountdownComplete}
          onTickSound={playCountdown}
        />
      )}

      {/* Post-Race Victory & Analytics Modal */}
      {status === 'finished' && raceResults && (
        <ResultsModal
          results={raceResults}
          allRacers={allRacers}
          onPlayAgain={() => startNewRace()}
          onNextTrack={() => startNewRace()}
          seriesScores={seriesScores}
          onRematch={roomId ? handleRematch : undefined}
          onSendQuickChat={roomId ? sendQuickChat : undefined}
          isMultiplayer={!!roomId}
        />
      )}

      {/* Theme Selector Modal */}
      <ThemeSelector
        currentTheme={theme}
        onSelectTheme={setTheme}
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Multiplayer Room Modal */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        roomId={roomId}
        userName={userName}
        setUserName={setUserName}
        userAvatar={userAvatar}
        setUserAvatar={setUserAvatar}
        isReady={isReady}
        onToggleReady={toggleReady}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onLeaveRoom={leaveRoom}
        onStartRace={triggerSoloStart}
        remoteCount={remoteCount}
        networkStatus={networkStatus}
        remotePilots={remotePilots}
        allReady={allReady}
        lobbyCountdown={lobbyCountdown}
        isHost={isHost}
        includeBots={includeBots}
        onToggleIncludeBots={toggleIncludeBots}
        onSendQuickChat={sendQuickChat}
        getInviteLink={getInviteLink}
      />

      {/* Real-time Cyber Toast Alerts */}
      <CyberToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
