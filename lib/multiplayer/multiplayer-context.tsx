import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { MultiplayerWebSocketClient, GameMessage } from './websocket-client';
import { Card } from '../game/types';
import Constants from 'expo-constants';

// ─── State ────────────────────────────────────────────────────────────────────

export interface RoundResult {
  roundIndex: number;
  p1Card: any;
  p2Card: any;
  winner: 'player1' | 'player2' | 'draw';
  p1Score: number;
  p2Score: number;
  advantage: 'element' | 'attack' | 'draw';
}

interface MultiplayerState {
  isConnected: boolean;
  roomId: string | null;
  playerId: string;
  playerName: string;
  opponentId: string | null;
  opponentName: string | null;
  isHost: boolean;
  isPlayerReady: boolean;
  isOpponentReady: boolean;
  playerCards: Card[];
  opponentCards: Card[];
  currentRound: number;
  totalRounds: number;
  playerScore: number;
  opponentScore: number;
  opponentRevealedThisRound: boolean;
  lastRoundResult: RoundResult | null;
  gameOverWinner: 'player' | 'opponent' | 'draw' | null;
  status: 'idle' | 'waiting' | 'ready' | 'playing' | 'revealing' | 'result' | 'finished';
  reconnectGraceSeconds: number;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type MultiplayerAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ROOM'; payload: { roomId: string; isHost: boolean } }
  | { type: 'SET_OPPONENT'; payload: { opponentId: string; opponentName: string } }
  | { type: 'SET_PLAYER_READY'; payload: boolean }
  | { type: 'SET_OPPONENT_READY'; payload: boolean }
  | { type: 'SET_PLAYER_CARDS'; payload: Card[] }
  | { type: 'START_BATTLE'; payload: { totalRounds: number; p1Score: number; p2Score: number; isHost: boolean; p1Cards: Card[]; p2Cards: Card[] } }
  | { type: 'OPPONENT_REVEALED' }
  | { type: 'ROUND_RESULT'; payload: RoundResult }
  | { type: 'NEXT_ROUND' }
  | { type: 'GAME_OVER'; payload: { winner: 'player1' | 'player2' | 'draw'; p1Score: number; p2Score: number } }
  | { type: 'OPPONENT_DISCONNECTED'; payload: { grace: number } }
  | { type: 'TICK_GRACE' }
  | { type: 'OPPONENT_RECONNECTED' }
  | { type: 'SET_STATUS'; payload: MultiplayerState['status'] }
  | { type: 'RESET' };

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: MultiplayerState = {
  isConnected: false,
  roomId: null,
  playerId: '',
  playerName: '',
  opponentId: null,
  opponentName: null,
  isHost: false,
  isPlayerReady: false,
  isOpponentReady: false,
  playerCards: [],
  opponentCards: [],
  currentRound: 0,
  totalRounds: 0,
  playerScore: 3,
  opponentScore: 3,
  opponentRevealedThisRound: false,
  lastRoundResult: null,
  gameOverWinner: null,
  status: 'idle',
  reconnectGraceSeconds: 0,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function multiplayerReducer(state: MultiplayerState, action: MultiplayerAction): MultiplayerState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };

    case 'SET_ROOM':
      return { ...state, roomId: action.payload.roomId, isHost: action.payload.isHost, status: 'waiting' };

    case 'SET_OPPONENT':
      return { ...state, opponentId: action.payload.opponentId, opponentName: action.payload.opponentName };

    case 'SET_PLAYER_READY':
      return { ...state, isPlayerReady: action.payload };

    case 'SET_OPPONENT_READY':
      return { ...state, isOpponentReady: action.payload };

    case 'SET_PLAYER_CARDS':
      return { ...state, playerCards: action.payload };

    case 'START_BATTLE': {
      const { totalRounds, p1Score, p2Score, isHost, p1Cards, p2Cards } = action.payload;
      return {
        ...state,
        status: 'playing',
        currentRound: 0,
        totalRounds,
        playerScore: isHost ? p1Score : p2Score,
        opponentScore: isHost ? p2Score : p1Score,
        playerCards: isHost ? p1Cards : p2Cards,
        opponentCards: isHost ? p2Cards : p1Cards,
        opponentRevealedThisRound: false,
        lastRoundResult: null,
      };
    }

    case 'OPPONENT_REVEALED':
      return { ...state, opponentRevealedThisRound: true };

    case 'ROUND_RESULT': {
      const r = action.payload;
      const playerIsP1 = state.isHost;
      const playerScore = playerIsP1 ? r.p1Score : r.p2Score;
      const opponentScore = playerIsP1 ? r.p2Score : r.p1Score;
      return {
        ...state,
        lastRoundResult: r,
        playerScore,
        opponentScore,
        status: 'result',
        opponentRevealedThisRound: false,
      };
    }

    case 'NEXT_ROUND':
      return {
        ...state,
        currentRound: state.currentRound + 1,
        status: 'playing',
        lastRoundResult: null,
        opponentRevealedThisRound: false,
      };

    case 'GAME_OVER': {
      const { winner, p1Score, p2Score } = action.payload;
      const myWinner = state.isHost
        ? winner === 'player1' ? 'player' : winner === 'player2' ? 'opponent' : 'draw'
        : winner === 'player2' ? 'player' : winner === 'player1' ? 'opponent' : 'draw';
      return {
        ...state,
        status: 'finished',
        gameOverWinner: myWinner as any,
        playerScore: state.isHost ? p1Score : p2Score,
        opponentScore: state.isHost ? p2Score : p1Score,
      };
    }

    case 'OPPONENT_DISCONNECTED':
      return { ...state, reconnectGraceSeconds: action.payload.grace };

    case 'TICK_GRACE':
      return { ...state, reconnectGraceSeconds: Math.max(0, state.reconnectGraceSeconds - 1) };

    case 'OPPONENT_RECONNECTED':
      return { ...state, reconnectGraceSeconds: 0 };

    case 'SET_STATUS':
      return { ...state, status: action.payload };

    case 'RESET':
      return { ...initialState, playerId: state.playerId, playerName: state.playerName };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface MultiplayerContextType {
  state: MultiplayerState;
  wsClient: MultiplayerWebSocketClient | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  createRoom: (playerName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  leaveRoom: () => void;
  setPlayerCards: (cards: Card[], rounds: number) => void;
  setPlayerReady: (isReady: boolean) => void;
  revealCard: (roundIndex: number, card: Card) => void;
  advanceToNextRound: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(multiplayerReducer, {
    ...initialState,
    playerId: generatePlayerId(),
  });
  const wsClientRef = useRef<MultiplayerWebSocketClient | null>(null);
  const graceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getServerUrl = () => {
    const apiUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3001';
    return apiUrl.replace(/^http/, 'ws') + '/multiplayer';
  };

  const connect = useCallback(async () => {
    if (wsClientRef.current?.isConnected()) return;
    const serverUrl = getServerUrl();
    wsClientRef.current = new MultiplayerWebSocketClient(serverUrl);
    wsClientRef.current.onMessage(handleMessage);
    try {
      await wsClientRef.current.connect();
      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch {
      dispatch({ type: 'SET_CONNECTED', payload: false });
      throw new Error('Connection failed');
    }
  }, []);

  const disconnect = useCallback(() => {
    wsClientRef.current?.disconnect();
    wsClientRef.current = null;
    dispatch({ type: 'SET_CONNECTED', payload: false });
  }, []);

  // ─── Message Handler ───────────────────────────────────────────────────────

  const handleMessage = useCallback((message: GameMessage) => {
    const { type, payload } = message;

    switch (type) {
      case 'ROOM_CREATED':
        dispatch({ type: 'SET_ROOM', payload: { roomId: payload.roomId, isHost: true } });
        break;

      case 'ROOM_JOINED':
        dispatch({ type: 'SET_ROOM', payload: { roomId: payload.roomId, isHost: false } });
        if (payload.player1) {
          dispatch({ type: 'SET_OPPONENT', payload: { opponentId: payload.player1.id, opponentName: payload.player1.name } });
        }
        break;

      case 'PLAYER_JOINED':
        dispatch({ type: 'SET_OPPONENT', payload: { opponentId: payload.player.id, opponentName: payload.player.name } });
        break;

      case 'OPPONENT_READY':
        dispatch({ type: 'SET_OPPONENT_READY', payload: payload.isReady });
        break;

      case 'BATTLE_START': {
        // Cannot read state.playerId inside handleMessage — use pendingBattleStart
        // A useEffect below reads state.playerId and dispatches START_BATTLE
        setPendingBattleStart(message.payload);
        break;
      }

      case 'OPPONENT_CARD_REVEALED':
        dispatch({ type: 'OPPONENT_REVEALED' });
        break;

      case 'ROUND_RESULT':
        dispatch({ type: 'ROUND_RESULT', payload: payload as RoundResult });
        break;

      case 'GAME_OVER':
        dispatch({ type: 'GAME_OVER', payload });
        break;

      case 'OPPONENT_DISCONNECTED':
        dispatch({ type: 'OPPONENT_DISCONNECTED', payload: { grace: payload.grace ?? 30 } });
        // Start ticking countdown
        if (graceTimerRef.current) clearInterval(graceTimerRef.current);
        graceTimerRef.current = setInterval(() => {
          dispatch({ type: 'TICK_GRACE' });
        }, 1000);
        break;

      case 'OPPONENT_RECONNECTED':
        dispatch({ type: 'OPPONENT_RECONNECTED' });
        if (graceTimerRef.current) {
          clearInterval(graceTimerRef.current);
          graceTimerRef.current = null;
        }
        break;

      case 'OPPONENT_LEFT_PERMANENTLY':
        if (graceTimerRef.current) {
          clearInterval(graceTimerRef.current);
          graceTimerRef.current = null;
        }
        Alert.alert('المنافس غادر', 'غادر خصمك اللعبة. أنت الفائز!');
        dispatch({ type: 'GAME_OVER', payload: { winner: 'player2', p1Score: 0, p2Score: 3 } });
        break;

      case 'RECONNECTED':
        dispatch({ type: 'SET_CONNECTED', payload: true });
        break;

      case 'PLAYER_LEFT':
      case 'ERROR':
        console.warn('[Multiplayer]', type, payload);
        break;
    }
  }, []);

  // ─── BATTLE_START fix: re-dispatch with correct isHost ───────────────────

  const [pendingBattleStart, setPendingBattleStart] = React.useState<any>(null);

  useEffect(() => {
    if (!pendingBattleStart) return;
    const isHost = state.playerId === pendingBattleStart.player1.id;
    dispatch({
      type: 'START_BATTLE',
      payload: {
        totalRounds: pendingBattleStart.totalRounds,
        p1Score: pendingBattleStart.p1Score,
        p2Score: pendingBattleStart.p2Score,
        isHost,
        p1Cards: pendingBattleStart.player1.cards ?? [],
        p2Cards: pendingBattleStart.player2.cards ?? [],
      },
    });
    setPendingBattleStart(null);
  }, [pendingBattleStart]);

  // Override handleMessage to use pendingBattleStart for BATTLE_START
  const handleMessageWithBattle = useCallback((message: GameMessage) => {
    if (message.type === 'BATTLE_START') {
      setPendingBattleStart(message.payload);
      return;
    }
    handleMessage(message);
  }, [handleMessage]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const send = useCallback((msg: GameMessage) => {
    wsClientRef.current?.send(msg);
  }, []);

  const createRoom = useCallback((playerName: string) => {
    dispatch({ type: 'SET_PLAYER_READY', payload: false });
    send({ type: 'CREATE_ROOM', payload: { playerId: state.playerId, playerName } });
  }, [state.playerId, send]);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    send({ type: 'JOIN_ROOM', payload: { roomId, playerId: state.playerId, playerName } });
  }, [state.playerId, send]);

  const leaveRoom = useCallback(() => {
    send({ type: 'LEAVE_ROOM', payload: { playerId: state.playerId } });
    dispatch({ type: 'RESET' });
  }, [state.playerId, send]);

  const setPlayerCards = useCallback((cards: Card[], rounds: number) => {
    dispatch({ type: 'SET_PLAYER_CARDS', payload: cards });
    send({ type: 'SET_CARDS', payload: { playerId: state.playerId, cards, rounds } });
  }, [state.playerId, send]);

  const setPlayerReady = useCallback((isReady: boolean) => {
    dispatch({ type: 'SET_PLAYER_READY', payload: isReady });
    send({ type: 'PLAYER_READY', payload: { playerId: state.playerId, isReady } });
  }, [state.playerId, send]);

  const revealCard = useCallback((roundIndex: number, card: Card) => {
    dispatch({ type: 'SET_STATUS', payload: 'revealing' });
    send({ type: 'REVEAL_CARD', payload: { playerId: state.playerId, roundIndex, card } });
  }, [state.playerId, send]);

  const advanceToNextRound = useCallback(() => {
    dispatch({ type: 'NEXT_ROUND' });
  }, []);

  // ─── Setup onMessage with battle handler ────────────────────────────────────

  useEffect(() => {
    if (wsClientRef.current) {
      wsClientRef.current.onMessage(handleMessageWithBattle);
    }
  }, [handleMessageWithBattle]);

  // Cleanup
  useEffect(() => {
    return () => {
      disconnect();
      if (graceTimerRef.current) clearInterval(graceTimerRef.current);
    };
  }, []);

  return (
    <MultiplayerContext.Provider value={{
      state,
      wsClient: wsClientRef.current,
      connect,
      disconnect,
      createRoom,
      joinRoom,
      leaveRoom,
      setPlayerCards,
      setPlayerReady,
      revealCard,
      advanceToNextRound,
    }}>
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer() {
  const ctx = useContext(MultiplayerContext);
  if (!ctx) throw new Error('useMultiplayer must be within MultiplayerProvider');
  return ctx;
}

function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
