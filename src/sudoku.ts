// Sudoku core logic - puzzle generation, validation, and solving

export type Cell = number | null; // 1-9 or null for empty
export type Grid = Cell[][];
export type Difficulty = 'easy' | 'medium' | 'hard';

// Create a 9x9 grid initialized with null
export function createEmptyGrid(): Grid {
  return Array(9).fill(null).map(() => Array(9).fill(null));
}

// Deep clone a grid
export function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

// Check if a number is valid in a specific position
export function isValidPlacement(grid: Grid, row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row]?.[c] === num) return false;
  }
  
  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r]?.[col] === num) return false;
  }
  
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r]?.[c] === num) return false;
    }
  }
  
  return true;
}

// Get all violations for the current grid state
export function getViolations(grid: Grid): Set<string> {
  const violations = new Set<string>();
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = grid[row]?.[col];
      if (num !== null && num !== undefined && !isValidPlacement(grid, row, col, num)) {
        violations.add(`${row},${col}`);
      }
    }
  }
  
  return violations;
}

// Check if the puzzle is completely solved
export function isSolved(grid: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = grid[row]?.[col];
      if (cell === null || cell === undefined) return false;
      if (!isValidPlacement(grid, row, col, cell)) return false;
    }
  }
  return true;
}

// Get candidates (possible numbers) for a cell
export function getCandidates(grid: Grid, row: number, col: number): number[] {
  if (grid[row]?.[col] !== null) return [];
  const candidates: number[] = [];
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      candidates.push(num);
    }
  }
  return candidates;
}

// Shuffle array in-place
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
  return array;
}

// Solve the puzzle using backtracking (returns solved grid or null if unsolvable)
export function solve(grid: Grid): Grid | null {
  const workGrid = cloneGrid(grid);
  if (solveInPlace(workGrid)) {
    return workGrid;
  }
  return null;
}

// Solve in-place (modifies the grid)
function solveInPlace(grid: Grid): boolean {
  // Find the first empty cell
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row]?.[col] === null) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, row, col, num)) {
            const rowArr = grid[row];
            if (rowArr) rowArr[col] = num;
            if (solveInPlace(grid)) {
              return true;
            }
            if (rowArr) rowArr[col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Count solutions (up to maxCount)
function countSolutions(grid: Grid, maxCount: number = 2): number {
  const workGrid = cloneGrid(grid);
  let count = 0;
  
  function backtrack(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (workGrid[row]?.[col] === null) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(workGrid, row, col, num)) {
              const rowArr = workGrid[row];
              if (rowArr) rowArr[col] = num;
              if (backtrack()) {
                if (rowArr) rowArr[col] = null;
                return true;
              }
              if (rowArr) rowArr[col] = null;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= maxCount;
  }
  
  backtrack();
  return count;
}

// Generate a complete solved grid
function generateSolvedGrid(): Grid {
  const grid = createEmptyGrid();
  
  // Fill diagonal boxes first (they don't affect each other)
  for (let box = 0; box < 3; box++) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const startRow = box * 3;
    const startCol = box * 3;
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const rowArr = grid[startRow + r];
        if (rowArr) rowArr[startCol + c] = nums[idx++] ?? null;
      }
    }
  }
  
  // Solve the rest
  solveInPlace(grid);
  return grid;
}

// Apply naked singles technique - if a cell has only one candidate, fill it
function applyNakedSingles(grid: Grid): boolean {
  let changed = false;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row]?.[col] === null) {
        const candidates = getCandidates(grid, row, col);
        if (candidates.length === 1) {
          const rowArr = grid[row];
          if (rowArr) rowArr[col] = candidates[0] ?? null;
          changed = true;
        }
      }
    }
  }
  return changed;
}

// Apply hidden singles technique - if a number can only go in one place in a unit, fill it
function applyHiddenSingles(grid: Grid): boolean {
  let changed = false;
  
  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      const positions: number[] = [];
      for (let col = 0; col < 9; col++) {
        if (grid[row]?.[col] === null && isValidPlacement(grid, row, col, num)) {
          positions.push(col);
        }
      }
      if (positions.length === 1) {
        const col = positions[0]!;
        const rowArr = grid[row];
        if (rowArr) rowArr[col] = num;
        changed = true;
      }
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      const positions: number[] = [];
      for (let row = 0; row < 9; row++) {
        if (grid[row]?.[col] === null && isValidPlacement(grid, row, col, num)) {
          positions.push(row);
        }
      }
      if (positions.length === 1) {
        const row = positions[0]!;
        const rowArr = grid[row];
        if (rowArr) rowArr[col] = num;
        changed = true;
      }
    }
  }
  
  // Check boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let num = 1; num <= 9; num++) {
        const positions: [number, number][] = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            if (grid[row]?.[col] === null && isValidPlacement(grid, row, col, num)) {
              positions.push([row, col]);
            }
          }
        }
        if (positions.length === 1) {
          const [row, col] = positions[0]!;
          const rowArr = grid[row];
          if (rowArr) rowArr[col] = num;
          changed = true;
        }
      }
    }
  }
  
  return changed;
}

// Check if puzzle can be solved with basic deduction only
function canSolveWithBasicDeduction(grid: Grid): boolean {
  const workGrid = cloneGrid(grid);
  let progress = true;
  
  while (progress) {
    progress = false;
    progress = applyNakedSingles(workGrid) || progress;
    progress = applyHiddenSingles(workGrid) || progress;
  }
  
  return isSolved(workGrid);
}

// Check if puzzle requires depth-1 lookahead
function requiresLookahead(grid: Grid): boolean {
  // First check if basic deduction can solve it
  if (canSolveWithBasicDeduction(grid)) {
    return false;
  }
  
  // Try depth-1 lookahead to see if it helps
  const workGrid = cloneGrid(grid);
  let progress = true;
  
  while (progress) {
    progress = false;
    progress = applyNakedSingles(workGrid) || progress;
    progress = applyHiddenSingles(workGrid) || progress;
    
    if (!progress) {
      // Try depth-1 lookahead: for each empty cell with 2 candidates,
      // try each candidate and see if it leads to a contradiction
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (workGrid[row]?.[col] === null) {
            const candidates = getCandidates(workGrid, row, col);
            if (candidates.length === 2) {
              for (const candidate of candidates) {
                const testGrid = cloneGrid(workGrid);
                const rowArr = testGrid[row];
                if (rowArr) rowArr[col] = candidate;
                
                // Apply basic techniques and see if we reach a contradiction
                let testProgress = true;
                let contradiction = false;
                while (testProgress && !contradiction) {
                  testProgress = applyNakedSingles(testGrid) || applyHiddenSingles(testGrid);
                  // Check for contradiction: empty cell with no candidates
                  for (let r = 0; r < 9 && !contradiction; r++) {
                    for (let c = 0; c < 9 && !contradiction; c++) {
                      if (testGrid[r]?.[c] === null && getCandidates(testGrid, r, c).length === 0) {
                        contradiction = true;
                      }
                    }
                  }
                }
                
                if (contradiction) {
                  // This candidate leads to contradiction, eliminate it
                  const otherCandidate = candidates.find(c => c !== candidate)!;
                  const mainRowArr = workGrid[row];
                  if (mainRowArr) mainRowArr[col] = otherCandidate;
                  progress = true;
                  break;
                }
              }
            }
          }
          if (progress) break;
        }
        if (progress) break;
      }
    }
  }
  
  return isSolved(workGrid);
}

// Generate a puzzle with a given difficulty
export function generatePuzzle(difficulty: Difficulty): { puzzle: Grid; solution: Grid } {
  // Generate solved grid first
  const solution = generateSolvedGrid();
  const puzzle = cloneGrid(solution);
  
  // Number of cells to remove based on difficulty
  const targetClues = difficulty === 'easy' ? 45 : difficulty === 'medium' ? 35 : 28;
  
  // Create list of all positions and shuffle
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);
  
  let clues = 81;
  
  for (const [row, col] of positions) {
    if (clues <= targetClues) break;
    
    const backup = puzzle[row]?.[col];
    const rowArr = puzzle[row];
    if (rowArr) rowArr[col] = null;
    
    // Check if puzzle still has unique solution
    if (countSolutions(puzzle, 2) !== 1) {
      if (rowArr) rowArr[col] = backup ?? null;
      continue;
    }
    
    // Check difficulty constraints
    if (difficulty === 'easy') {
      if (!canSolveWithBasicDeduction(puzzle)) {
        if (rowArr) rowArr[col] = backup ?? null;
        continue;
      }
    } else if (difficulty === 'medium') {
      if (!canSolveWithBasicDeduction(puzzle)) {
        if (rowArr) rowArr[col] = backup ?? null;
        continue;
      }
    } else if (difficulty === 'hard') {
      // For hard, we allow puzzles that require lookahead
      // but still want unique solution
    }
    
    clues--;
  }
  
  return { puzzle, solution };
}
