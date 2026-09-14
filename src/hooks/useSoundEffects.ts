import { useState, useEffect, useRef, useCallback } from 'react';

export type SoundProfile = 'clicky' | 'thocky' | 'beep' | 'off';

export function useSoundEffects() {
  const [profile, setProfile] = useState<SoundProfile>(() => {
    return (localStorage.getItem('typothon_sound_profile') as SoundProfile) || 'thocky';
  });
  const [volume, setVolume] = useState<number>(0.3);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('typothon_sound_profile', profile);
  }, [profile]);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playKeySound = useCallback((isError = false) => {
    if (profile === 'off') return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;

    if (isError) {
      // Error buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
      return;
    }

    if (profile === 'thocky') {
      // Thocky switch: low pass filtered noise + soft Sine pitch drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // randomized pitch slightly for natural feel
      const baseFreq = 220 + (Math.random() * 30 - 15);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

      gain.gain.setValueAtTime(volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (profile === 'clicky') {
      // Clicky blue switch: high pitch crisp click + transient
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 1800 + (Math.random() * 200 - 100);
      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.025);

      gain.gain.setValueAtTime(volume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } else if (profile === 'beep') {
      // Cyber blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 60, now);

      gain.gain.setValueAtTime(volume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }, [profile, volume, initAudio]);

  const playCountdown = useCallback((isFinal = false) => {
    if (profile === 'off') return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = isFinal ? 1046.5 : 523.25; // High C or Mid C
    osc.frequency.setValueAtTime(freq, now);

    const dur = isFinal ? 0.35 : 0.15;
    gain.gain.setValueAtTime(volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }, [profile, volume, initAudio]);

  const playFinishFanfare = useCallback(() => {
    if (profile === 'off') return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }, [profile, volume, initAudio]);

  const playLobbyTick = useCallback((secondsRemaining: number) => {
    if (profile === 'off') return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = secondsRemaining <= 3 ? 987.77 : 587.33;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(volume * 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }, [profile, volume, initAudio]);

  return {
    profile,
    setProfile,
    volume,
    setVolume,
    playKeySound,
    playCountdown,
    playFinishFanfare,
    playLobbyTick,
    initAudio
  };
}
