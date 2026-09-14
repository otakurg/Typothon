import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { RaceMode, RaceResults, SecondTelemetry } from '../types/race';

export interface CharacterState {
  char: string;
  state: 'untouched' | 'correct' | 'incorrect' | 'extra';
}

export interface WordState {
  word: string;
  chars: CharacterState[];
  isCurrent: boolean;
  isCompleted: boolean;
  hasError: boolean;
}

interface UseTypingEngineProps {
  targetText: string;
  mode: RaceMode;
  onFinish?: (results: RaceResults) => void;
  onKeypressSound?: (isError: boolean) => void;
  isLocked?: boolean;
}

export function useTypingEngine({
  targetText,
  mode,
  onFinish,
  onKeypressSound,
  isLocked = false
}: UseTypingEngineProps) {
  const targetWords = useMemo(() => targetText.trim().split(/\s+/), [targetText]);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [typedHistory, setTypedHistory] = useState<string[]>([]);
  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isFinished, setIsFinished] = useState(false);

  // Keystroke counters in reactive state
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [errorKeystrokes, setErrorKeystrokes] = useState(0);

  // Raw telemetry trackers
  const keystrokeTimestampsRef = useRef<number[]>([]);
  const timelineRef = useRef<SecondTelemetry[]>([]);
  const lastSecondRecordedRef = useRef(0);

  // Time remaining for timed mode
  const timeRemaining = useMemo(() => {
    if (mode.type !== 'time') return null;
    return Math.max(0, mode.duration - Math.floor(elapsedTime));
  }, [mode, elapsedTime]);

  // Reset engine
  const resetEngine = useCallback(() => {
    setCurrentWordIndex(0);
    setCurrentInput('');
    setTypedHistory([]);
    setStartTime(null);
    setElapsedTime(0);
    setIsFinished(false);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setErrorKeystrokes(0);
    keystrokeTimestampsRef.current = [];
    timelineRef.current = [];
    lastSecondRecordedRef.current = 0;
  }, []);

  // Compute live character breakdown & metrics
  const { correctChars, incorrectChars, extraChars, uncorrectedErrors } = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let extra = 0;
    let uncorrected = 0;

    // Past completed words
    typedHistory.forEach((typed, wIdx) => {
      const targetWord = targetWords[wIdx] || '';
      let wordHadUncorrected = false;

      for (let i = 0; i < Math.max(typed.length, targetWord.length); i++) {
        if (i >= targetWord.length) {
          extra++;
          wordHadUncorrected = true;
        } else if (i >= typed.length) {
          wordHadUncorrected = true;
        } else if (typed[i] === targetWord[i]) {
          correct++;
        } else {
          incorrect++;
          wordHadUncorrected = true;
        }
      }
      if (wordHadUncorrected) uncorrected++;
    });

    // Current word being typed
    const targetWord = targetWords[currentWordIndex] || '';
    for (let i = 0; i < currentInput.length; i++) {
      if (i >= targetWord.length) {
        extra++;
      } else if (currentInput[i] === targetWord[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }

    return {
      correctChars: correct,
      incorrectChars: incorrect,
      extraChars: extra,
      uncorrectedErrors: uncorrected
    };
  }, [targetWords, typedHistory, currentWordIndex, currentInput]);

  // Live WPM calculation purely from state
  const { netWpm, grossWpm, rawWpm, accuracy } = useMemo(() => {
    const elapsedMinutes = Math.max(elapsedTime, 1) / 60;

    const raw = Math.round((totalKeystrokes / 5) / elapsedMinutes);
    const gross = Math.round((correctChars / 5) / elapsedMinutes);
    const net = Math.max(0, Math.round(((correctChars / 5) - uncorrectedErrors) / elapsedMinutes));
    const acc = totalKeystrokes > 0 ? Math.min(100, Math.round((correctKeystrokes / totalKeystrokes) * 100)) : 100;

    return {
      netWpm: isNaN(net) ? 0 : net,
      grossWpm: isNaN(gross) ? 0 : gross,
      rawWpm: isNaN(raw) ? 0 : raw,
      accuracy: isNaN(acc) ? 100 : acc
    };
  }, [elapsedTime, totalKeystrokes, correctKeystrokes, correctChars, uncorrectedErrors]);

  // Progress computation (0 to 100)
  const progress = useMemo(() => {
    if (isFinished) return 100;
    if (mode.type === 'time') {
      return Math.min(100, (elapsedTime / mode.duration) * 100);
    }
    const totalWords = targetWords.length;
    if (totalWords === 0) return 0;
    const wordProgress = (currentWordIndex / totalWords) * 100;
    const currentCharWeight = (currentInput.length / (targetWords[currentWordIndex]?.length || 5)) * (100 / totalWords);
    return Math.min(100, Math.round(wordProgress + currentCharWeight));
  }, [isFinished, mode, elapsedTime, currentWordIndex, currentInput, targetWords]);

  // Finish race handler
  const finalizeRace = useCallback(() => {
    if (isFinished) return;
    setIsFinished(true);

    const elapsed = Math.max(elapsedTime, 1);

    // Consistency calculation: standard deviation of rolling WPMs in timeline
    const wpms = timelineRef.current.map(t => t.netWpm).filter(w => w > 0);
    let consistency = 95;
    if (wpms.length > 2) {
      const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
      const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
      consistency = Math.max(0, Math.min(100, Math.round(100 - cv)));
    }

    // Average key latency in ms
    let avgLatency = 120;
    const timestamps = keystrokeTimestampsRef.current;
    if (timestamps.length > 1) {
      const diffs: number[] = [];
      for (let i = 1; i < timestamps.length; i++) {
        const diff = timestamps[i] - timestamps[i - 1];
        if (diff < 1500) diffs.push(diff); // exclude long pauses
      }
      if (diffs.length > 0) {
        avgLatency = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
      }
    }

    const finalResults: RaceResults = {
      netWpm,
      grossWpm,
      rawWpm,
      accuracy,
      consistency,
      totalErrors: errorKeystrokes,
      uncorrectedErrors,
      correctChars,
      incorrectChars,
      extraChars,
      missedChars: Math.max(0, targetText.length - (correctChars + incorrectChars)),
      totalKeystrokes,
      durationSeconds: Math.round(elapsed),
      keyLatencyMs: avgLatency,
      timeline: timelineRef.current,
      rank: 1,
      racers: []
    };

    onFinish?.(finalResults);
  }, [isFinished, elapsedTime, netWpm, grossWpm, rawWpm, accuracy, errorKeystrokes, uncorrectedErrors, correctChars, incorrectChars, extraChars, targetText, totalKeystrokes, onFinish]);

  // Main timer tick effect
  useEffect(() => {
    if (!startTime || isFinished) return;

    const interval = setInterval(() => {
      const now = performance.now();
      const elapsedSec = (now - startTime) / 1000;
      setElapsedTime(elapsedSec);

      // Record timeline telemetry second by second
      const currentSec = Math.floor(elapsedSec);
      if (currentSec > lastSecondRecordedRef.current) {
        lastSecondRecordedRef.current = currentSec;
        timelineRef.current.push({
          second: currentSec,
          netWpm,
          rawWpm,
          errors: errorKeystrokes,
          accuracy
        });
      }

      // Check timed mode finish
      if (mode.type === 'time' && elapsedSec >= mode.duration) {
        finalizeRace();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, isFinished, mode, netWpm, rawWpm, accuracy, errorKeystrokes, finalizeRace]);

  // Handle keystroke input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>) => {
    if (isLocked || isFinished) return;

    // Ignore modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
      return;
    }

    const now = performance.now();
    if (!startTime) {
      setStartTime(now);
    }

    // Record key timestamp
    keystrokeTimestampsRef.current.push(now);
    const targetWord = targetWords[currentWordIndex] || '';

    // Handle Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Delete entire current word input
        setCurrentInput('');
      } else if (currentInput.length > 0) {
        setCurrentInput(prev => prev.slice(0, -1));
      } else if (currentWordIndex > 0) {
        // Jump back to previous word if current is empty
        const prevIndex = currentWordIndex - 1;
        const prevInput = typedHistory[prevIndex] || '';
        setCurrentWordIndex(prevIndex);
        setCurrentInput(prevInput);
        setTypedHistory(prev => prev.slice(0, -1));
      }
      return;
    }

    // Handle Space (Word completion)
    if (e.key === ' ') {
      e.preventDefault();
      if (currentInput.length === 0) return; // ignore consecutive spaces

      setTotalKeystrokes(prev => prev + 1);
      const isWordMatch = currentInput === targetWord;
      if (isWordMatch) {
        setCorrectKeystrokes(prev => prev + 1);
        onKeypressSound?.(false);
      } else {
        setErrorKeystrokes(prev => prev + 1);
        onKeypressSound?.(true);
      }

      const nextWordIndex = currentWordIndex + 1;
      setTypedHistory(prev => [...prev, currentInput]);
      setCurrentInput('');
      setCurrentWordIndex(nextWordIndex);

      // Check word mode finish
      if (nextWordIndex >= targetWords.length) {
        finalizeRace();
      }
      return;
    }

    // Handle character typing (length === 1)
    if (e.key.length === 1) {
      setTotalKeystrokes(prev => prev + 1);
      const expectedChar = targetWord[currentInput.length];
      const isCorrect = expectedChar !== undefined && e.key === expectedChar;

      if (isCorrect) {
        setCorrectKeystrokes(prev => prev + 1);
        onKeypressSound?.(false);
      } else {
        setErrorKeystrokes(prev => prev + 1);
        onKeypressSound?.(true);
      }

      // Max word length cap to prevent infinite typing overflow
      if (currentInput.length < targetWord.length + 10) {
        const nextInput = currentInput + e.key;
        setCurrentInput(nextInput);

        // Check if last character of the last word was typed correctly in word/quote mode
        if (currentWordIndex === targetWords.length - 1 && nextInput === targetWord) {
          setTypedHistory(prev => [...prev, nextInput]);
          finalizeRace();
        }
      }
    }
  }, [isLocked, isFinished, startTime, targetWords, currentWordIndex, currentInput, typedHistory, onKeypressSound, finalizeRace]);

  // Formatted structured words for visual rendering
  const renderedWords: WordState[] = useMemo(() => {
    return targetWords.map((word, wIdx) => {
      const isCurrent = wIdx === currentWordIndex;
      const isCompleted = wIdx < currentWordIndex;
      const typed = isCompleted ? (typedHistory[wIdx] || '') : isCurrent ? currentInput : '';

      const chars: CharacterState[] = [];
      let hasError = false;

      // Render standard target word characters
      for (let cIdx = 0; cIdx < word.length; cIdx++) {
        const targetChar = word[cIdx];
        if (cIdx < typed.length) {
          const isCharCorrect = typed[cIdx] === targetChar;
          if (!isCharCorrect) hasError = true;
          chars.push({
            char: targetChar,
            state: isCharCorrect ? 'correct' : 'incorrect'
          });
        } else {
          chars.push({
            char: targetChar,
            state: 'untouched'
          });
        }
      }

      // Render extra overflow characters typed beyond target word
      if (typed.length > word.length) {
        hasError = true;
        for (let extraIdx = word.length; extraIdx < typed.length; extraIdx++) {
          chars.push({
            char: typed[extraIdx],
            state: 'extra'
          });
        }
      }

      return {
        word,
        chars,
        isCurrent,
        isCompleted,
        hasError: isCompleted ? (typed !== word) : hasError
      };
    });
  }, [targetWords, currentWordIndex, currentInput, typedHistory]);

  return {
    currentWordIndex,
    currentInput,
    renderedWords,
    netWpm,
    grossWpm,
    rawWpm,
    accuracy,
    progress,
    elapsedTime,
    timeRemaining,
    isFinished,
    handleKeyDown,
    resetEngine,
    totalKeystrokes,
    totalErrors: errorKeystrokes
  };
}
