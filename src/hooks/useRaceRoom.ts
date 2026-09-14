import { useState, useEffect, useRef, useCallback } from 'react';
import type { Racer, MultiTabMessage, RaceMode, DifficultyLevel, ToastNotification } from '../types/race';
import mqtt, { type MqttClient } from 'mqtt';

export interface RoomParticipant {
  id: string;
  name: string;
  color: string;
  avatar: string;
  progress: number;
  currentWpm: number;
  isReady: boolean;
  isHost: boolean;
  isAfk: boolean;
  isDnf?: boolean;
  finishTime?: number;
  lastSeen?: number;
  chatBubble?: { message: string; timestamp: number };
}

const AVATARS = ['🚀', '⚡', '🛸', '👾', '🏎️', '🏍️', '🤖', '🔥'];
const COLORS = ['#00F5FF', '#39FF14', '#BD00FF', '#FFB000', '#FF3366', '#8BE9FD'];

// Public high-reliability WebSocket MQTT brokers
const MQTT_BROKER_PRIMARY = 'wss://broker.emqx.io:8084/mqtt';
const MQTT_BROKER_FALLBACK = 'wss://broker.hivemq.com:8884/mqtt';

export function useRaceRoom(
  userProgress: number,
  userWpm: number,
  isUserFinished: boolean,
  currentMode: RaceMode,
  currentDifficulty: DifficultyLevel,
  onRemoteStart?: (payload?: { text: string; source?: string; mode: RaceMode; difficulty?: DifficultyLevel }) => void,
  onLobbyTick?: (sec: number) => void,
  onHostSettingsSync?: (settings: { includeBots?: boolean; mode?: RaceMode; difficulty?: DifficultyLevel }) => void
) {
  const [roomId, setRoomId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) return roomParam.trim().toUpperCase();
    }
    return null;
  });
  const [userId] = useState(() => 'pilot_' + Math.random().toString(36).substring(2, 7));
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('typothon_username') || `CyberPilot_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [userAvatar, setUserAvatar] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [userColor, setUserColor] = useState(() => COLORS[0]);
  const [isReady, setIsReady] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState<string | null>(null);
  const [includeBots, setIncludeBots] = useState<boolean>(true);
  const [isAfk, setIsAfk] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'connecting' | 'offline'>('offline');

  // Series score tracker (wins per pilot)
  const [seriesScores, setSeriesScores] = useState<Record<string, number>>({});

  // Floating notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const addToast = useCallback((text: string, type: 'info' | 'warn' | 'success' = 'info') => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 8);
    setToasts(prev => [...prev.slice(-4), { id, text, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Quick-chat bubbles per pilot
  const [chatBubbles, setChatBubbles] = useState<Record<string, { message: string; timestamp: number }>>({});

  // 10-second synchronized lobby countdown state
  const [lobbyCountdown, setLobbyCountdown] = useState<number | null>(null);
  const lobbyTargetTimeRef = useRef<number | null>(null);
  const lobbyPayloadRef = useRef<{ text: string; source?: string; mode: RaceMode } | null>(null);

  const [remoteParticipants, setRemoteParticipants] = useState<Record<string, RoomParticipant>>({});
  const channelRef = useRef<BroadcastChannel | null>(null);
  const mqttClientRef = useRef<MqttClient | null>(null);
  const seenMsgIdsRef = useRef<Set<string>>(new Set());
  const lastProgressSentRef = useRef<number>(0);

  // Save username
  useEffect(() => {
    localStorage.setItem('typothon_username', userName);
  }, [userName]);

  // Universal dispatch to both MQTT (Global Web) and BroadcastChannel (Local Tabs)
  const broadcastMessage = useCallback((type: MultiTabMessage['type'], payload?: any) => {
    if (!roomId) return;
    const msgId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    seenMsgIdsRef.current.add(msgId);

    const message: MultiTabMessage = {
      msgId,
      type,
      roomId,
      senderId: userId,
      senderName: userName,
      payload,
    };

    // 1. Local tabs via BroadcastChannel
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(message);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. Global internet via MQTT WSS
    if (mqttClientRef.current && mqttClientRef.current.connected) {
      try {
        const topic = `typothon/rooms/${roomId.toLowerCase()}`;
        mqttClientRef.current.publish(topic, JSON.stringify(message), { qos: 0 });
      } catch (e) {
        console.warn('MQTT publish error:', e);
      }
    }
  }, [roomId, userId, userName]);

  // Cancel any active lobby countdown
  const cancelLobbyCountdown = useCallback((reason?: string) => {
    lobbyTargetTimeRef.current = null;
    lobbyPayloadRef.current = null;
    setLobbyCountdown(null);
    broadcastMessage('LOBBY_COUNTDOWN_CANCEL', { reason });
  }, [broadcastMessage]);

  // Handle incoming messages
  const handleIncomingMessage = useCallback((msg: MultiTabMessage) => {
    if (!msg || msg.senderId === userId) return;

    // Deduplicate
    if (msg.msgId) {
      if (seenMsgIdsRef.current.has(msg.msgId)) return;
      seenMsgIdsRef.current.add(msg.msgId);
      if (seenMsgIdsRef.current.size > 200) {
        const firstItems = Array.from(seenMsgIdsRef.current).slice(0, 50);
        firstItems.forEach(id => seenMsgIdsRef.current.delete(id));
      }
    }

    switch (msg.type) {
      case 'PLAYER_JOIN':
        addToast(`Pilot ${msg.senderName} joined the room!`, 'info');
        // Reply with our presence
        broadcastMessage('PLAYER_PONG', {
          avatar: userAvatar,
          color: userColor,
          isReady,
          isHost,
          hostId,
          includeBots,
          isAfk,
        });

        setRemoteParticipants(prev => ({
          ...prev,
          [msg.senderId]: {
            id: msg.senderId,
            name: msg.senderName,
            avatar: msg.payload?.avatar || '🚀',
            color: msg.payload?.color || '#39FF14',
            progress: 0,
            currentWpm: 0,
            isReady: !!msg.payload?.isReady,
            isHost: !!msg.payload?.isHost,
            isAfk: !!msg.payload?.isAfk,
            lastSeen: Date.now(),
          }
        }));
        break;

      case 'PLAYER_PONG':
        if (msg.payload?.hostId) {
          setHostId(msg.payload.hostId);
        }
        if (msg.payload?.includeBots !== undefined) {
          setIncludeBots(msg.payload.includeBots);
        }
        setRemoteParticipants(prev => ({
          ...prev,
          [msg.senderId]: {
            id: msg.senderId,
            name: msg.senderName,
            avatar: msg.payload?.avatar || '🚀',
            color: msg.payload?.color || '#39FF14',
            progress: prev[msg.senderId]?.progress ?? 0,
            currentWpm: prev[msg.senderId]?.currentWpm ?? 0,
            isReady: !!msg.payload?.isReady,
            isHost: !!msg.payload?.isHost,
            isAfk: !!msg.payload?.isAfk,
            lastSeen: Date.now(),
          }
        }));
        break;

      case 'PLAYER_READY':
        setRemoteParticipants(prev => {
          if (!prev[msg.senderId]) return prev;
          return {
            ...prev,
            [msg.senderId]: {
              ...prev[msg.senderId],
              isReady: msg.payload?.isReady,
              lastSeen: Date.now(),
            }
          };
        });
        if (!msg.payload?.isReady) {
          lobbyTargetTimeRef.current = null;
          lobbyPayloadRef.current = null;
          setLobbyCountdown(null);
          addToast(`Pilot ${msg.senderName} is preparing (Unreadied)`, 'warn');
        }
        break;

      case 'PLAYER_AFK':
        setRemoteParticipants(prev => {
          if (!prev[msg.senderId]) return prev;
          return {
            ...prev,
            [msg.senderId]: {
              ...prev[msg.senderId],
              isAfk: !!msg.payload?.isAfk,
              lastSeen: Date.now(),
            }
          };
        });
        if (msg.payload?.isAfk) {
          addToast(`Pilot ${msg.senderName} is away (AFK)`, 'warn');
          lobbyTargetTimeRef.current = null;
          lobbyPayloadRef.current = null;
          setLobbyCountdown(null);
        } else {
          addToast(`Pilot ${msg.senderName} is back online`, 'info');
        }
        break;

      case 'HOST_SETTINGS': {
        if (msg.payload?.includeBots !== undefined) {
          setIncludeBots(msg.payload.includeBots);
        }
        onHostSettingsSync?.(msg.payload);
        const modeLabel = msg.payload?.mode?.type ? msg.payload.mode.type.toUpperCase() : '';
        const diffLabel = msg.payload?.difficulty ? ` [${msg.payload.difficulty.toUpperCase()}]` : '';
        const botsLabel = msg.payload?.includeBots !== undefined ? ` • Bots ${msg.payload.includeBots ? 'ON' : 'OFF'}` : '';
        addToast(`Host updated: ${modeLabel}${diffLabel}${botsLabel}`, 'info');
        break;
      }

      case 'QUICK_CHAT':
        if (msg.payload?.message) {
          setChatBubbles(prev => ({
            ...prev,
            [msg.senderId]: { message: msg.payload.message, timestamp: Date.now() }
          }));
          addToast(`${msg.senderName}: "${msg.payload.message}"`, 'info');
        }
        break;

      case 'LOBBY_COUNTDOWN_START':
        if (msg.payload?.targetStartTime) {
          lobbyTargetTimeRef.current = msg.payload.targetStartTime;
          lobbyPayloadRef.current = msg.payload;
          const initialRemaining = Math.max(1, Math.ceil((msg.payload.targetStartTime - Date.now()) / 1000));
          setLobbyCountdown(initialRemaining);
          onLobbyTick?.(initialRemaining);
        }
        break;

      case 'LOBBY_COUNTDOWN_CANCEL':
        lobbyTargetTimeRef.current = null;
        lobbyPayloadRef.current = null;
        setLobbyCountdown(null);
        addToast(`Launch paused: ${msg.payload?.reason || 'Pilot not ready'}`, 'warn');
        break;

      case 'START_COUNTDOWN':
        lobbyTargetTimeRef.current = null;
        lobbyPayloadRef.current = null;
        setLobbyCountdown(null);
        onRemoteStart?.(msg.payload);
        break;

      case 'RACE_UPDATE':
        setRemoteParticipants(prev => {
          if (!prev[msg.senderId]) {
            return {
              ...prev,
              [msg.senderId]: {
                id: msg.senderId,
                name: msg.senderName,
                avatar: msg.payload?.avatar || '🚀',
                color: msg.payload?.color || '#39FF14',
                progress: msg.payload?.progress ?? 0,
                currentWpm: msg.payload?.currentWpm ?? 0,
                isReady: true,
                isHost: false,
                isAfk: false,
                lastSeen: Date.now(),
              }
            };
          }
          return {
            ...prev,
            [msg.senderId]: {
              ...prev[msg.senderId],
              progress: msg.payload?.progress ?? prev[msg.senderId].progress,
              currentWpm: msg.payload?.currentWpm ?? prev[msg.senderId].currentWpm,
              lastSeen: Date.now(),
            }
          };
        });
        break;

      case 'PLAYER_FINISH': {
        const finishTime = msg.payload?.finishTime || Date.now();
        setRemoteParticipants(prev => {
          if (!prev[msg.senderId]) return prev;
          const anyWinnerYet = Object.values(prev).some(p => !!p.finishTime);
          if (!anyWinnerYet && !isUserFinished) {
            setSeriesScores(scores => ({
              ...scores,
              [msg.senderName]: (scores[msg.senderName] || 0) + 1,
            }));
          }
          return {
            ...prev,
            [msg.senderId]: {
              ...prev[msg.senderId],
              progress: 100,
              currentWpm: msg.payload?.currentWpm ?? prev[msg.senderId].currentWpm,
              finishTime,
              lastSeen: Date.now(),
            }
          };
        });
        addToast(`🏁 Pilot ${msg.senderName} crossed the finish line!`, 'success');
        break;
      }

      case 'PLAYER_LEAVE':
        addToast(`⚠️ Pilot ${msg.senderName} left the room`, 'warn');
        setRemoteParticipants(prev => {
          const next = { ...prev };
          delete next[msg.senderId];
          // Host migration check
          if (hostId === msg.senderId) {
            const remainingKeys = Object.keys(next);
            if (remainingKeys.length > 0) {
              const newHostKey = remainingKeys[0];
              setHostId(newHostKey);
            } else {
              setIsHost(true);
              setHostId(userId);
            }
          }
          return next;
        });
        lobbyTargetTimeRef.current = null;
        lobbyPayloadRef.current = null;
        setLobbyCountdown(null);
        break;

      case 'RESET_RACE':
        setRemoteParticipants(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(id => {
            next[id] = { ...next[id], progress: 0, currentWpm: 0, finishTime: undefined, isReady: false };
          });
          return next;
        });
        setIsReady(false);
        lobbyTargetTimeRef.current = null;
        lobbyPayloadRef.current = null;
        setLobbyCountdown(null);
        break;
    }
  }, [userId, userAvatar, userColor, isReady, isHost, hostId, includeBots, isAfk, isUserFinished, broadcastMessage, onRemoteStart, onLobbyTick, onHostSettingsSync, addToast]);

  // Setup connection when roomId changes
  useEffect(() => {
    if (!roomId) {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      if (mqttClientRef.current) {
        mqttClientRef.current.end(true);
        mqttClientRef.current = null;
      }
      return;
    }

    // 1. Setup local BroadcastChannel
    const channelName = `typothon_room_${roomId.toLowerCase()}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<MultiTabMessage>) => {
      handleIncomingMessage(event.data);
    };

    // 2. Setup Global MQTT over WebSocket
    const topic = `typothon/rooms/${roomId.toLowerCase()}`;
    const clientId = `pilot_${userId}_${Math.random().toString(36).substring(2, 6)}`;

    const client = mqtt.connect(MQTT_BROKER_PRIMARY, {
      clientId,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2500,
      keepalive: 20,
    });
    mqttClientRef.current = client;

    client.on('connect', () => {
      setNetworkStatus('connected');
      client.subscribe(topic, { qos: 0 }, (err) => {
        if (!err) {
          broadcastMessage('PLAYER_JOIN', {
            avatar: userAvatar,
            color: userColor,
            isReady,
            isHost,
            hostId: isHost ? userId : hostId,
            includeBots,
          });
        }
      });
    });

    client.on('message', (_t, payload) => {
      try {
        const parsed = JSON.parse(payload.toString()) as MultiTabMessage;
        handleIncomingMessage(parsed);
      } catch (e) {
        console.warn('Failed to parse MQTT message:', e);
      }
    });

    client.on('error', (err) => {
      console.warn('Primary MQTT error, attempting fallback...', err);
      if (mqttClientRef.current === client) {
        client.end(true);
        const fallbackClient = mqtt.connect(MQTT_BROKER_FALLBACK, {
          clientId,
          clean: true,
          connectTimeout: 5000,
          reconnectPeriod: 3000,
        });
        mqttClientRef.current = fallbackClient;

        fallbackClient.on('connect', () => {
          setNetworkStatus('connected');
          fallbackClient.subscribe(topic, { qos: 0 }, () => {
            broadcastMessage('PLAYER_JOIN', {
              avatar: userAvatar,
              color: userColor,
              isReady,
              isHost,
              hostId: isHost ? userId : hostId,
              includeBots,
            });
          });
        });

        fallbackClient.on('message', (_t, fallbackPayload) => {
          try {
            const parsed = JSON.parse(fallbackPayload.toString()) as MultiTabMessage;
            handleIncomingMessage(parsed);
          } catch (e) {
            console.warn('Fallback MQTT parse error:', e);
          }
        });
      }
    });

    client.on('offline', () => setNetworkStatus('offline'));
    client.on('reconnect', () => setNetworkStatus('connecting'));

    return () => {
      broadcastMessage('PLAYER_LEAVE');
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      if (mqttClientRef.current) {
        mqttClientRef.current.end(true);
        mqttClientRef.current = null;
      }
    };
  }, [roomId, userId, userAvatar, userColor, isReady, isHost, hostId, includeBots, broadcastMessage, handleIncomingMessage]);

  // Window AFK listener
  useEffect(() => {
    const handleVisibility = () => {
      const hidden = document.hidden;
      setIsAfk(hidden);
      if (roomId) {
        broadcastMessage('PLAYER_AFK', { isAfk: hidden });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [roomId, broadcastMessage]);

  // 10-second lobby countdown interval runner
  useEffect(() => {
    if (!lobbyTargetTimeRef.current) return;

    const interval = setInterval(() => {
      if (!lobbyTargetTimeRef.current) {
        clearInterval(interval);
        return;
      }
      const now = Date.now();
      const diff = lobbyTargetTimeRef.current - now;
      const remainingSec = Math.max(0, Math.ceil(diff / 1000));

      setLobbyCountdown(remainingSec);
      if (remainingSec > 0) {
        onLobbyTick?.(remainingSec);
      }

      if (diff <= 0) {
        clearInterval(interval);
        const payload = lobbyPayloadRef.current;
        lobbyTargetTimeRef.current = null;
        lobbyPayloadRef.current = null;
        setLobbyCountdown(null);
        onRemoteStart?.(payload || undefined);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [lobbyCountdown, onLobbyTick, onRemoteStart]);

  // Broadcast race update when user progress or WPM changes (throttled)
  useEffect(() => {
    if (!roomId) return;
    const now = Date.now();
    if (now - lastProgressSentRef.current >= 120 || userProgress >= 100) {
      lastProgressSentRef.current = now;
      broadcastMessage('RACE_UPDATE', {
        progress: userProgress,
        currentWpm: userWpm,
        avatar: userAvatar,
        color: userColor,
      });
    }
  }, [roomId, userProgress, userWpm, userAvatar, userColor, broadcastMessage]);

  // Broadcast finish event
  useEffect(() => {
    if (!roomId || !isUserFinished) return;
    broadcastMessage('PLAYER_FINISH', {
      finishTime: Date.now(),
      currentWpm: userWpm,
    });
  }, [roomId, isUserFinished, userWpm, broadcastMessage]);

  const createRoom = useCallback(() => {
    const code = 'NEO-' + Math.floor(1000 + Math.random() * 9000);
    setRoomId(code);
    setIsReady(false);
    setIsHost(true);
    setHostId(userId);
    setNetworkStatus('connecting');
    addToast(`Room ${code} created. You are the host 👑`, 'success');
    return code;
  }, [userId, addToast]);

  const joinRoom = useCallback((code: string) => {
    const formatted = code.trim().toUpperCase();
    setRoomId(formatted);
    setIsReady(false);
    setIsHost(false);
    setNetworkStatus('connecting');
    addToast(`Connecting to room ${formatted}...`, 'info');
  }, [addToast]);

  const leaveRoom = useCallback(() => {
    broadcastMessage('PLAYER_LEAVE');
    setRoomId(null);
    setRemoteParticipants({});
    setIsReady(false);
    setIsHost(false);
    setHostId(null);
    setNetworkStatus('offline');
    lobbyTargetTimeRef.current = null;
    lobbyPayloadRef.current = null;
    setLobbyCountdown(null);
    addToast('Left multiplayer room', 'info');
  }, [broadcastMessage, addToast]);

  const toggleReady = useCallback(() => {
    setIsReady(prev => {
      const next = !prev;
      broadcastMessage('PLAYER_READY', { isReady: next });
      if (!next) {
        cancelLobbyCountdown('Local pilot unreadied');
      }
      return next;
    });
  }, [broadcastMessage, cancelLobbyCountdown]);

  // Host match settings updater (bots, mode, difficulty)
  const updateHostSettings = useCallback((newSettings: { includeBots?: boolean; mode?: RaceMode; difficulty?: DifficultyLevel }) => {
    const nextIncludeBots = newSettings.includeBots !== undefined ? newSettings.includeBots : includeBots;
    const nextMode = newSettings.mode || currentMode;
    const nextDifficulty = newSettings.difficulty || currentDifficulty;

    if (newSettings.includeBots !== undefined) {
      setIncludeBots(nextIncludeBots);
    }
    broadcastMessage('HOST_SETTINGS', {
      includeBots: nextIncludeBots,
      mode: nextMode,
      difficulty: nextDifficulty,
    });
    addToast(`Match rules: ${nextMode.type.toUpperCase()} [${nextDifficulty.toUpperCase()}]`, 'info');
  }, [includeBots, currentMode, currentDifficulty, broadcastMessage, addToast]);

  // Host toggle bots
  const toggleIncludeBots = useCallback((enabled: boolean) => {
    updateHostSettings({ includeBots: enabled });
  }, [updateHostSettings]);

  // Send tactical quick-chat
  const sendQuickChat = useCallback((message: string) => {
    setChatBubbles(prev => ({
      ...prev,
      [userId]: { message, timestamp: Date.now() }
    }));
    broadcastMessage('QUICK_CHAT', { message });
  }, [userId, broadcastMessage]);

  // Start 10-second lobby countdown
  const startLobbyCountdown = useCallback((racePayload: { text: string; source?: string; mode: RaceMode; difficulty?: DifficultyLevel }) => {
    const targetStartTime = Date.now() + 10000;
    lobbyTargetTimeRef.current = targetStartTime;
    lobbyPayloadRef.current = racePayload;
    setLobbyCountdown(10);
    onLobbyTick?.(10);

    broadcastMessage('LOBBY_COUNTDOWN_START', {
      ...racePayload,
      targetStartTime,
    });
  }, [broadcastMessage, onLobbyTick]);

  // Skip 10s wait and launch race now
  const forceLaunchNow = useCallback((racePayload?: { text: string; source?: string; mode: RaceMode; difficulty?: DifficultyLevel }) => {
    lobbyTargetTimeRef.current = null;
    lobbyPayloadRef.current = null;
    setLobbyCountdown(null);
    broadcastMessage('START_COUNTDOWN', racePayload);
    onRemoteStart?.(racePayload);
  }, [broadcastMessage, onRemoteStart]);

  // Trigger rematch
  const requestRematch = useCallback(() => {
    broadcastMessage('RESET_RACE');
    setIsReady(false);
    lobbyTargetTimeRef.current = null;
    lobbyPayloadRef.current = null;
    setLobbyCountdown(null);
    addToast('Rematch initiated! Click READY to race again.', 'success');
  }, [broadcastMessage, addToast]);

  // Award round win
  const recordWinner = useCallback((winnerName: string) => {
    setSeriesScores(prev => ({
      ...prev,
      [winnerName]: (prev[winnerName] || 0) + 1,
    }));
  }, []);

  // Direct invite link helper
  const getInviteLink = useCallback(() => {
    if (!roomId) return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?room=${roomId}`;
  }, [roomId]);

  // Convert remote participants to Racer format
  const remoteRacers: Racer[] = Object.values(remoteParticipants).map(p => ({
    id: p.id,
    name: p.name,
    isUser: false,
    color: p.color,
    avatar: p.avatar,
    progress: p.progress,
    currentWpm: p.currentWpm,
    finishTime: p.finishTime,
    isHost: p.id === hostId,
    isAfk: p.isAfk,
    isDnf: p.isDnf,
    chatBubble: chatBubbles[p.id],
  }));

  // Has all participants ready
  const remoteList = Object.values(remoteParticipants);
  const hasRemotePilots = remoteList.length > 0;
  const allReady = hasRemotePilots && isReady && remoteList.every(p => p.isReady && !p.isAfk);

  return {
    roomId,
    userId,
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    userColor,
    setUserColor,
    isReady,
    toggleReady,
    createRoom,
    joinRoom,
    leaveRoom,
    remoteRacers,
    remotePilots: remoteList,
    remoteCount: remoteList.length,
    networkStatus,
    allReady,
    lobbyCountdown,
    startLobbyCountdown,
    cancelLobbyCountdown,
    forceLaunchNow,
    isHost,
    hostId,
    includeBots,
    toggleIncludeBots,
    isAfk,
    toasts,
    dismissToast,
    addToast,
    sendQuickChat,
    chatBubbles,
    seriesScores,
    recordWinner,
    requestRematch,
    getInviteLink,
    updateHostSettings,
  };
}
