import React, { useState, useEffect } from "react";
import "../styles/minesweeper.css";

// --- Game Configuration ---
const ROWS = 9;
const COLS = 9;
const MINES = 10;

// --- Cell State Type ---
interface CellState {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

// --- Helper Functions ---

/**
 * Creates a new game board, places mines, and calculates adjacent mine counts.
 */
const createBoard = (): CellState[][] => {
  // 1. Create a blank grid
  const board: CellState[][] = Array(ROWS)
    .fill(null)
    .map((_, y) =>
      Array(COLS)
        .fill(null)
        .map((_, x) => ({
          x,
          y,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        }))
    );

  // 2. Randomly place mines
  let minesPlaced = 0;
  while (minesPlaced < MINES) {
    const y = Math.floor(Math.random() * ROWS);
    const x = Math.floor(Math.random() * COLS);
    if (!board[y][x].isMine) {
      board[y][x].isMine = true;
      minesPlaced++;
    }
  }

  // 3. Calculate adjacent mines for each cell
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x].isMine) continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = y + dy;
          const nx = x + dx;
          if (
            ny >= 0 &&
            ny < ROWS &&
            nx >= 0 &&
            nx < COLS &&
            board[ny][nx].isMine
          ) {
            count++;
          }
        }
      }
      board[y][x].adjacentMines = count;
    }
  }
  return board;
};

// --- Main Component ---
const Minesweeper: React.FC = () => {
  const [board, setBoard] = useState(createBoard());
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: number | null = null;
    if (gameStarted && !isGameOver && !isWin) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStarted, isGameOver, isWin]);

  // Win condition check
  useEffect(() => {
    if (isGameOver) return;
    const nonMines = board.flat().filter((cell) => !cell.isMine);
    const revealedCount = nonMines.filter((cell) => cell.isRevealed).length;
    if (revealedCount === nonMines.length) {
      setIsWin(true);
      setGameStarted(false);
    }
  }, [board, isGameOver]);

  const resetGame = () => {
    setBoard(createBoard());
    setIsGameOver(false);
    setIsWin(false);
    setFlagCount(0);
    setTime(0);
    setGameStarted(false);
  };

  /**
   * Recursively reveals cells when an empty one is clicked.
   */
  const floodFill = (y: number, x: number, newBoard: CellState[][]) => {
    if (
      y < 0 ||
      y >= ROWS ||
      x < 0 ||
      x >= COLS ||
      newBoard[y][x].isRevealed ||
      newBoard[y][x].isFlagged
    ) {
      return;
    }

    newBoard[y][x].isRevealed = true;

    if (newBoard[y][x].adjacentMines === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          floodFill(y + dy, x + dx, newBoard);
        }
      }
    }
  };

  /**
   * Handles a left-click on a cell.
   */
  const handleCellClick = (cell: CellState) => {
    if (isGameOver || isWin || cell.isRevealed || cell.isFlagged) {
      return;
    }

    if (!gameStarted) {
      setGameStarted(true);
    }

    if (cell.isMine) {
      setIsGameOver(true);
      setGameStarted(false);
      // Reveal all mines
      const newBoard = board.map((row) =>
        row.map((c) => (c.isMine ? { ...c, isRevealed: true } : c))
      );
      setBoard(newBoard);
      return;
    }

    const newBoard = [...board.map((row) => [...row])];
    floodFill(cell.y, cell.x, newBoard);
    setBoard(newBoard);
  };

  /**
   * Handles a right-click (context menu) on a cell.
   */
  const handleCellContext = (
    e: React.MouseEvent<HTMLDivElement>,
    cell: CellState
  ) => {
    e.preventDefault();
    if (isGameOver || isWin || cell.isRevealed) {
      return;
    }

    if (!gameStarted) {
      setGameStarted(true);
    }

    const newBoard = [...board];
    const targetCell = newBoard[cell.y][cell.x];

    if (targetCell.isFlagged) {
      targetCell.isFlagged = false;
      setFlagCount((c) => c - 1);
    } else {
      targetCell.isFlagged = true;
      setFlagCount((c) => c + 1);
    }
    setBoard(newBoard);
  };

  const getCellDisplay = (cell: CellState) => {
    if (cell.isFlagged) return "🚩";
    if (!cell.isRevealed) return null;
    if (cell.isMine) return "💣";
    if (cell.adjacentMines > 0) return cell.adjacentMines;
    return null;
  };

  const getFace = () => {
    if (isWin) return "😎";
    if (isGameOver) return "😵";
    return "😊";
  };

  return (
    // Add the outer flex container
    <div className="minesweeper-game">
      {/* Add the inner container */}
      <div className="minesweeper-container">
        <div className="game-header">
          <div className="mine-count">{MINES - flagCount}</div>
          <button className="reset-button" onClick={resetGame}>
            {getFace()}
          </button>
          <div className="timer">{String(time).padStart(3, "0")}</div>
        </div>
        <div
          className="game-board"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {board.flat().map((cell) => (
            <div
              key={`${cell.x}-${cell.y}`}
              className={`cell ${!cell.isRevealed ? "hidden" : ""} ${
                cell.isRevealed && cell.isMine ? "mine" : ""
              } adj-${cell.adjacentMines}`}
              onClick={() => handleCellClick(cell)}
              onContextMenu={(e) => handleCellContext(e, cell)}
            >
              {getCellDisplay(cell)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Minesweeper;
