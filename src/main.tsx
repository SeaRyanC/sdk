import { render } from 'preact';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { 
  generatePuzzle, 
  cloneGrid, 
  getViolations, 
  isSolved,
  findEasiestCell,
  type Grid,
  type Difficulty
} from './sudoku.js';
import { saveState, loadState, type GameState } from './storage.js';

function App() {
  const [puzzle, setPuzzle] = useState<Grid>([]);
  const [solution, setSolution] = useState<Grid>([]);
  const [current, setCurrent] = useState<Grid>([]);
  const [fixedCells, setFixedCells] = useState<boolean[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [highlightInvalid, setHighlightInvalid] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [showHint, setShowHint] = useState(false);
  const [hasEasyCell, setHasEasyCell] = useState(false);
  const inactivityTimerRef = useRef<number | null>(null);

  // Initialize game
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setPuzzle(saved.puzzle);
      setSolution(saved.solution);
      setCurrent(saved.current);
      setFixedCells(saved.fixedCells);
      setDifficulty(saved.difficulty);
      setHighlightInvalid(saved.highlightInvalid);
      setDarkMode(saved.darkMode);
    } else {
      startNewGame('easy');
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    if (puzzle.length > 0) {
      const state: GameState = {
        puzzle,
        solution,
        current,
        fixedCells,
        difficulty,
        highlightInvalid,
        darkMode
      };
      saveState(state);
    }
  }, [puzzle, solution, current, fixedCells, difficulty, highlightInvalid, darkMode]);

  // Apply dark mode to body
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Check for completion
  useEffect(() => {
    if (current.length > 0 && isSolved(current)) {
      setShowCongrats(true);
    }
  }, [current]);

  // Check if an easy cell exists and update hasEasyCell state
  useEffect(() => {
    if (current.length > 0 && fixedCells.length > 0) {
      const easyCell = findEasiestCell(current, fixedCells);
      setHasEasyCell(easyCell !== null);
    }
  }, [current, fixedCells]);

  // Reset inactivity timer on any user activity
  const resetInactivityTimer = useCallback(() => {
    setShowHint(false);
    if (inactivityTimerRef.current !== null) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = window.setTimeout(() => {
      setShowHint(true);
    }, 20000); // 20 seconds
  }, []);

  // Set up inactivity timer on mount and cleanup
  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current !== null) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  // Handle hint button click
  const handleHint = useCallback(() => {
    const easyCell = findEasiestCell(current, fixedCells);
    if (easyCell) {
      setSelectedCell(easyCell);
    }
    resetInactivityTimer();
  }, [current, fixedCells, resetInactivityTimer]);

  const hasUserEntries = useCallback(() => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!fixedCells[r]?.[c] && current[r]?.[c] !== null) {
          return true;
        }
      }
    }
    return false;
  }, [current, fixedCells]);

  const startNewGame = useCallback((diff: Difficulty) => {
    const { puzzle: newPuzzle, solution: newSolution } = generatePuzzle(diff);
    setPuzzle(newPuzzle);
    setSolution(newSolution);
    setCurrent(cloneGrid(newPuzzle));
    
    // Mark fixed cells
    const fixed = newPuzzle.map(row => row.map(cell => cell !== null));
    setFixedCells(fixed);
    setDifficulty(diff);
    setSelectedCell(null);
    setShowCongrats(false);
    setShowSettings(false);
  }, []);

  const resetGame = useCallback(() => {
    setCurrent(cloneGrid(puzzle));
    setSelectedCell(null);
  }, [puzzle]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!fixedCells[row]?.[col]) {
      setSelectedCell([row, col]);
    }
    resetInactivityTimer();
  }, [fixedCells, resetInactivityTimer]);

  const handleNumberInput = useCallback((num: number | null) => {
    if (selectedCell) {
      const [row, col] = selectedCell;
      if (!fixedCells[row]?.[col]) {
        const newCurrent = cloneGrid(current);
        const rowArr = newCurrent[row];
        if (rowArr) {
          rowArr[col] = num;
        }
        setCurrent(newCurrent);
      }
    }
    resetInactivityTimer();
  }, [selectedCell, fixedCells, current, resetInactivityTimer]);

  const handleNewGame = useCallback((diff: Difficulty) => {
    if (hasUserEntries()) {
      if (confirm('Start a new game? Your current progress will be lost.')) {
        startNewGame(diff);
      }
    } else {
      startNewGame(diff);
    }
  }, [hasUserEntries, startNewGame]);

  const handleReset = useCallback(() => {
    if (confirm('Reset the puzzle? All your entries will be cleared.')) {
      resetGame();
    }
  }, [resetGame]);

  const violations = highlightInvalid ? getViolations(current) : new Set<string>();

  if (puzzle.length === 0) {
    return <div class="loading">Loading...</div>;
  }

  return (
    <div class="app">
      <header>
        <h1>Sudoku</h1>
        <button class="settings-btn" onClick={() => setShowSettings(!showSettings)}>
          ⚙️
        </button>
      </header>

      {showSettings && (
        <div class="settings-panel">
          <label class="toggle">
            <input
              type="checkbox"
              checked={highlightInvalid}
              onChange={(e) => setHighlightInvalid((e.target as HTMLInputElement).checked)}
            />
            Highlight invalid entries
          </label>
          <label class="toggle">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode((e.target as HTMLInputElement).checked)}
            />
            Dark mode
          </label>
          <div class="settings-section">
            <h3>New Game</h3>
            <div class="difficulty-buttons">
              <button onClick={() => handleNewGame('easy')}>Easy</button>
              <button onClick={() => handleNewGame('medium')}>Medium</button>
              <button onClick={() => handleNewGame('hard')}>Hard</button>
            </div>
          </div>
          <button class="reset-btn" onClick={handleReset}>Reset Current Game</button>
        </div>
      )}

      <div class="grid">
        {current.map((row, r) => (
          <div class="row" key={r}>
            {row.map((cell, c) => {
              const isFixed = fixedCells[r]?.[c];
              const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
              const isViolation = violations.has(`${r},${c}`);
              
              return (
                <div
                  key={c}
                  class={`cell ${isFixed ? 'fixed' : ''} ${isSelected ? 'selected' : ''} ${isViolation ? 'violation' : ''}`}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell ?? ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div class="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handleNumberInput(num)}>{num}</button>
        ))}
        <button class="clear-btn" onClick={() => handleNumberInput(null)}>✕</button>
        <button key={0} onClick={() => handleNumberInput(0)}>0</button>
        <button 
          class={`hint-btn ${showHint && hasEasyCell ? 'visible' : ''}`} 
          onClick={handleHint}
          disabled={!showHint || !hasEasyCell}
        >
          ?
        </button>
      </div>

      {showCongrats && (
        <div class="congrats-overlay">
          <div class="congrats-modal">
            <h2>🎉 Congratulations!</h2>
            <p>You solved the puzzle!</p>
            <h3>Play Again?</h3>
            <div class="difficulty-buttons">
              <button onClick={() => startNewGame('easy')}>Easy</button>
              <button onClick={() => startNewGame('medium')}>Medium</button>
              <button onClick={() => startNewGame('hard')}>Hard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

render(<App />, document.getElementById('app')!);
