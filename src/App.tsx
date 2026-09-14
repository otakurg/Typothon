import { useState, useEffect, useCallback, useMemo } from 'react';
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
    playFinishFanfare
  } = useSoundEffects();

  const handleToggleSound = useCallback(() => {
    setSoundProfile(prev => {
      if (prev === 'off') return 'thocky';
      if (prev === 'thocky') return 'clicky';
      if (prev === 'clicky') return 'beep';
      return 'off';
    });
  }, [setSoundProfile]);

  // Handle Race finish
  const handleRaceFinish = useCallback((results: RaceResults) => {
    setStatus('finished');
    setUserFinishTime(Date.now());
    playFinishFanfare();
    setRaceResults(results);
  }, [playFinishFanfare]);

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
    onFinish: handleRaceFinish,
    onKeypressSound: playKeySound,
    isLocked: status === 'countdown' || status === 'finished'
  });

  // Bot Racers Simulation
  const { bots, resetBots } = useRaceBots({
    isRacing: status === 'racing',
    mode,
    targetTextLength: raceData.text.length,
  });

  // Multiplayer Room Hook
  const handleRemoteStart = useCallback(() => {
    setStatus('countdown');
  }, []);

  const {
    roomId,
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    isReady,
    toggleReady,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastStartCountdown,
    remoteRacers,
    remoteCount,
  } = useRaceRoom(userProgress, netWpm, status === 'finished', handleRemoteStart);

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
  }), [userName, userAvatar, userProgress, netWpm, userFinishTime]);

  // Combined racers on the track (Max 4 racers: User + Remote players + Bots to fill remaining lanes)
  const allRacers: Racer[] = useMemo(() => {
    const racers: Racer[] = [userRacer, ...remoteRacers];
    const botsNeeded = Math.max(0, 4 - racers.length);
    const selectedBots = bots.slice(0, botsNeeded);
    return [...racers, ...selectedBots];
  }, [userRacer, remoteRacers, bots]);

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

  // Trigger countdown to launch
  const triggerCountdown = useCallback(() => {
    setStatus('countdown');
    if (roomId) {
      broadcastStartCountdown();
    }
  }, [roomId, broadcastStartCountdown]);

  // When countdown completes
  const handleCountdownComplete = useCallback(() => {
    setStatus('racing');
  }, []);

  // Global hotkeys (Tab + Enter or Esc)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Tab + Enter or Ctrl + Enter
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
          onSelectMode={(m) => startNewRace(m)}
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
        />

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
          isLocked={status === 'countdown' || status === 'finished'}
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
        onStartRace={triggerCountdown}
        remoteCount={remoteCount}
      />
    </div>
  );
}
