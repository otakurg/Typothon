import { useState, useEffect, useRef, useCallback } from 'react';
import type { Racer, MultiTabMessage, RaceMode } from '../types/race';
import mqtt, { type MqttClient } from 'mqtt';

export interface RoomParticipant {
  id: string;
  name: string;
  color: string;
  avatar: string;
  progress: number;
  currentWpm: number;
  isReady: boolean;
  finishTime?: number;
  lastSeen?: number;
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
  onRemoteStart?: (payload?: { text: string; source?: string; mode: RaceMode }) => void,
  onLobbyTick?: (sec: number) => void
) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userId] = useState(() => 'pilot_' + Math.random().toString(36).substring(2, 7));
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('typothon_username') || `CyberPilot_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [userAvatar, setUserAvatar] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [userColor, setUserColor] = useState(() => COLORS[0]);
  const [isReady, setIsReady] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'connecting' | 'offline'>('offline');

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

    // 1. Post to local tabs via BroadcastChannel
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(message);
      } catch (e) {
        console.warn('BroadcastChannel post error:', e);
      }
    }

    // 2. Publish to global internet via MQTT WSS
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

  // Handle incoming message from either transport
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
        // Reply with our presence so newcomer discovers us
        broadcastMessage('PLAYER_PONG', {
          avatar: userAvatar,
          color: userColor,
          isReady,
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
            lastSeen: Date.now(),
          }
        }));
        break;

      case 'PLAYER_PONG':
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
        // If a player unreadies, abort any active countdown!
        if (!msg.payload?.isReady) {
          lobbyTargetTimeRef.current = null;
          lobbyPayloadRef.current = null;
          setLobbyCountdown(null);
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

      case 'PLAYER_FINISH':
        setRemoteParticipants(prev => {
          if (!prev[msg.senderId]) return prev;
          return {
            ...prev,
            [msg.senderId]: {
              ...prev[msg.senderId],
              progress: 100,
              currentWpm: msg.payload?.currentWpm ?? prev[msg.senderId].currentWpm,
              finishTime: msg.payload?.finishTime,
              lastSeen: Date.now(),
            }
          };
        });
        break;

      case 'PLAYER_LEAVE':
        setRemoteParticipants(prev => {
          const next = { ...prev };
          delete next[msg.senderId];
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
  }, [userId, userAvatar, userColor, isReady, broadcastMessage, onRemoteStart, onLobbyTick]);

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
          // Announce join to the room!
          broadcastMessage('PLAYER_JOIN', {
            avatar: userAvatar,
            color: userColor,
            isReady,
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
      console.warn('Primary MQTT broker error, attempting fallback...', err);
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

    client.on('offline', () => {
      setNetworkStatus('offline');
    });

    client.on('reconnect', () => {
      setNetworkStatus('connecting');
    });

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
  }, [roomId, userId, userAvatar, userColor, isReady, broadcastMessage, handleIncomingMessage]);

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
    setNetworkStatus('connecting');
    return code;
  }, []);

  const joinRoom = useCallback((code: string) => {
    const formatted = code.trim().toUpperCase();
    setRoomId(formatted);
    setIsReady(false);
    setNetworkStatus('connecting');
  }, []);

  const leaveRoom = useCallback(() => {
    broadcastMessage('PLAYER_LEAVE');
    setRoomId(null);
    setRemoteParticipants({});
    setIsReady(false);
    setNetworkStatus('offline');
    lobbyTargetTimeRef.current = null;
    lobbyPayloadRef.current = null;
    setLobbyCountdown(null);
  }, [broadcastMessage]);

  const toggleReady = useCallback(() => {
    setIsReady(prev => {
      const next = !prev;
      broadcastMessage('PLAYER_READY', { isReady: next });
      if (!next) {
        // If unreadying, cancel countdown
        cancelLobbyCountdown('Local pilot unreadied');
      }
      return next;
    });
  }, [broadcastMessage, cancelLobbyCountdown]);

  // Start 10-second lobby countdown
  const startLobbyCountdown = useCallback((racePayload: { text: string; source?: string; mode: RaceMode }) => {
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
  const forceLaunchNow = useCallback((racePayload?: { text: string; source?: string; mode: RaceMode }) => {
    lobbyTargetTimeRef.current = null;
    lobbyPayloadRef.current = null;
    setLobbyCountdown(null);
    broadcastMessage('START_COUNTDOWN', racePayload);
    onRemoteStart?.(racePayload);
  }, [broadcastMessage, onRemoteStart]);

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
  }));

  // Has all participants ready
  const remoteList = Object.values(remoteParticipants);
  const hasRemotePilots = remoteList.length > 0;
  const allReady = hasRemotePilots && isReady && remoteList.every(p => p.isReady);

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
  };
}
