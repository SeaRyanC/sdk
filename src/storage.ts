// LocalStorage persistence for game state

import type { Grid, Difficulty } from './sudoku.js';

export interface GameState {
  puzzle: Grid;
  solution: Grid;
  current: Grid;
  fixedCells: boolean[][];
  difficulty: Difficulty;
  highlightInvalid: boolean;
  darkMode: boolean;
}

const STORAGE_KEY = 'sudoku-game-state';

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage might be full or unavailable
    console.warn('Failed to save game state to localStorage');
  }
}

export function loadState(): GameState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as GameState;
    }
  } catch {
    console.warn('Failed to load game state from localStorage');
  }
  return null;
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn('Failed to clear game state from localStorage');
  }
}
