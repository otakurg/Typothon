import { useState, useEffect, useRef, useCallback } from 'react';
import type { Racer, MultiTabMessage } from '../types/race';

export interface RoomParticipant {
  id: string;
  name: string;
  color: string;
  avatar: string;
  progress: number;
  currentWpm: number;
  isReady: boolean;
  finishTime?: number;
}

const AVATARS = ['🚀', '⚡', '🛸', '👾', '🏎️', '🏍️', '🤖', '🔥'];
const COLORS = ['#00F5FF', '#39FF14', '#BD00FF', '#FFB000', '#FF3366', '#8BE9FD'];

export function useRaceRoom(
  userProgress: number,
  userWpm: number,
  isUserFinished: boolean,
  onRemoteStart?: () => void
) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userId] = useState(() => 'pilot_' + Math.random().toString(36).substring(2, 7));
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('typeracer_username') || `CyberPilot_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [userAvatar, setUserAvatar] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [userColor, setUserColor] = useState(() => COLORS[0]);
  const [isReady, setIsReady] = useState(false);
  
  const [remoteParticipants, setRemoteParticipants] = useState<Record<string, RoomParticipant>>({});
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Save username
  useEffect(() => {
    localStorage.setItem('typeracer_username', userName);
  }, [userName]);

  // Setup BroadcastChannel when roomId changes
  useEffect(() => {
    if (!roomId) {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      return;
    }

    const channelName = `typeracer_room_${roomId}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    // Announce join
    channel.postMessage({
      type: 'PLAYER_JOIN',
      roomId,
      senderId: userId,
      senderName: userName,
      payload: {
        avatar: userAvatar,
        color: userColor,
        isReady
      }
    } as MultiTabMessage);

    const handleMessage = (event: MessageEvent<MultiTabMessage>) => {
      const msg = event.data;
      if (!msg || msg.senderId === userId) return;

      switch (msg.type) {
        case 'PLAYER_JOIN':
          // Reply to new player with our presence
          channel.postMessage({
            type: 'PLAYER_JOIN',
            roomId,
            senderId: userId,
            senderName: userName,
            payload: {
              avatar: userAvatar,
              color: userColor,
              isReady
            }
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
              isReady: !!msg.payload?.isReady
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
                isReady: msg.payload?.isReady
              }
            };
          });
          break;

        case 'START_COUNTDOWN':
          onRemoteStart?.();
          break;

        case 'RACE_UPDATE':
          setRemoteParticipants(prev => {
            if (!prev[msg.senderId]) return prev;
            return {
              ...prev,
              [msg.senderId]: {
                ...prev[msg.senderId],
                progress: msg.payload?.progress ?? prev[msg.senderId].progress,
                currentWpm: msg.payload?.currentWpm ?? prev[msg.senderId].currentWpm,
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
                finishTime: msg.payload?.finishTime
              }
            };
          });
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
          break;
      }
    };

    channel.onmessage = handleMessage;

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [roomId, userId, userName, userAvatar, userColor, onRemoteStart, isReady]);

  // Broadcast race update when user moves
  useEffect(() => {
    if (!roomId || !channelRef.current) return;
    channelRef.current.postMessage({
      type: 'RACE_UPDATE',
      roomId,
      senderId: userId,
      senderName: userName,
      payload: {
        progress: userProgress,
        currentWpm: userWpm
      }
    } as MultiTabMessage);
  }, [roomId, userId, userName, userProgress, userWpm]);

  // Broadcast finish
  useEffect(() => {
    if (!roomId || !channelRef.current || !isUserFinished) return;
    channelRef.current.postMessage({
      type: 'PLAYER_FINISH',
      roomId,
      senderId: userId,
      senderName: userName,
      payload: {
        finishTime: Date.now(),
        currentWpm: userWpm
      }
    } as MultiTabMessage);
  }, [roomId, userId, userName, isUserFinished, userWpm]);

  const createRoom = useCallback(() => {
    const code = 'NEO-' + Math.floor(1000 + Math.random() * 9000);
    setRoomId(code);
    setIsReady(false);
    return code;
  }, []);

  const joinRoom = useCallback((code: string) => {
    const formatted = code.trim().toUpperCase();
    setRoomId(formatted);
    setIsReady(false);
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomId(null);
    setRemoteParticipants({});
    setIsReady(false);
  }, []);

  const toggleReady = useCallback(() => {
    setIsReady(prev => {
      const next = !prev;
      if (channelRef.current && roomId) {
        channelRef.current.postMessage({
          type: 'PLAYER_READY',
          roomId,
          senderId: userId,
          senderName: userName,
          payload: { isReady: next }
        } as MultiTabMessage);
      }
      return next;
    });
  }, [roomId, userId, userName]);

  const broadcastStartCountdown = useCallback(() => {
    if (channelRef.current && roomId) {
      channelRef.current.postMessage({
        type: 'START_COUNTDOWN',
        roomId,
        senderId: userId,
        senderName: userName
      } as MultiTabMessage);
    }
  }, [roomId, userId, userName]);

  // Convert remote participants to Racer format
  const remoteRacers: Racer[] = Object.values(remoteParticipants).map(p => ({
    id: p.id,
    name: p.name,
    isUser: false,
    color: p.color,
    avatar: p.avatar,
    progress: p.progress,
    currentWpm: p.currentWpm,
    finishTime: p.finishTime
  }));

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
    broadcastStartCountdown,
    remoteRacers,
    remoteCount: Object.keys(remoteParticipants).length
  };
}
