export interface Deck {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  isCustom?: boolean;
  cards: string[];
}

export type GamePhase =
  | 'home'
  | 'countdown'
  | 'playing'
  | 'gameover'
  | 'create-deck'
  | 'json-editor'
  | 'settings';

export interface CardResult {
  text: string;
  status: 'correct' | 'passed';
  timestamp: number;
}

export interface GameSettings {
  roundDuration: number; // in seconds (30, 60, 90, 120)
  soundEnabled: boolean;
  tiltSensitivity: 'low' | 'medium' | 'high';
  hapticsEnabled: boolean;
}

export type TiltAction = 'correct' | 'pass' | 'neutral';

export interface OrientationState {
  isSupported: boolean;
  hasPermission: boolean;
  tiltAction: TiltAction;
  beta: number | null;
  gamma: number | null;
  requestPermission: () => Promise<boolean>;
}
