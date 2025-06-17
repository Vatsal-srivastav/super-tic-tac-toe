// Super Tic Tac Toe with Minimax Bot

const menu = document.getElementById("menu");
const gameContainer = document.getElementById("game-container");
const game = document.getElementById("game");
const statusText = document.getElementById("status");

let currentPlayer = "X";
let activeBoard = -1;
let gameMode = "local";
let socket, room, mySymbol, isMyTurn;

const boards = Array(9).fill(null).map(() => Array(9).fill(""));
const boardWinners = Array(9).fill(null);

function checkWin(cells) {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of wins) {
    if (cells[a] && cells[a] === cells[b] && cells[b] === cells[c]) {
      return cells[a];
    }
  }
  return null;
}

function getValidMoves(boards, boardWinners, activeBoard) {
  const moves = [];
  if (activeBoard === -1) {
    for (let bi = 0; bi < 9; bi++) {
      if (!boardWinners[bi] && boards[bi].some(c => !c)) {
        for (let ci = 0; ci < 9; ci++) {
          if (!boards[bi][ci]) moves.push({ bi, ci });
        }
      }
    }
  } else {
    if (!boardWinners[activeBoard] && boards[activeBoard].some(c => !c)) {
      for (let ci = 0; ci < 9; ci++) {
        if (!boards[activeBoard][ci]) moves.push({ bi: activeBoard, ci });
      }
    }
  }
  return moves;
}

function minimax(boards, boardWinners, activeBoard, player, depth, maxDepth) {
  const winner = checkWin(boardWinners);
  if (winner === "X") return { score: 10 - depth };
  if (winner === "O") return { score: depth - 10 };

  const validMoves = getValidMoves(boards, boardWinners, activeBoard);
  if (validMoves.length === 0 || depth >= maxDepth) return { score: 0 };

  let bestMove = null;
  let bestScore = player === "O" ? Infinity : -Infinity;

  for (let move of validMoves) {
    const prevCell = boards[move.bi][move.ci];
    const prevWinner = boardWinners[move.bi];

    boards[move.bi][move.ci] = player;
    const localWinner = checkWin(boards[move.bi]);
    if (localWinner) boardWinners[move.bi] = localWinner;

    const nextActive = (!boardWinners[move.ci] && boards[move.ci].some(c => !c)) ? move.ci : -1;
    const result = minimax(boards, boardWinners, nextActive, player === "X" ? "O" : "X", depth + 1, maxDepth);

    boards[move.bi][move.ci] = prevCell;
    boardWinners[move.bi] = prevWinner;

    if (player === "O") {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    } else {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    }
  }

  return { score: bestScore, move: bestMove };
}

function botMove() {
  const { move } = minimax(boards, boardWinners, activeBoard, "O", 0, 9);
  if (move) makeMove(move.bi, move.ci);
}

function makeMove(boardIndex, cellIndex) {
  if (boards[boardIndex][cellIndex]) return;
  boards[boardIndex][cellIndex] = currentPlayer;
  const winner = checkWin(boards[boardIndex]);
  if (winner) boardWinners[boardIndex] = winner;

  const gameWinner = checkWin(boardWinners);
  if (gameWinner) {
    statusText.textContent = `Player ${gameWinner} wins the game!`;
    renderGame();
    return;
  }

  activeBoard = (!boardWinners[cellIndex] && boards[cellIndex].some(c => !c)) ? cellIndex : -1;
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusText.textContent = `Player ${currentPlayer}'s turn`;
  renderGame();

  if (gameMode === "bot" && currentPlayer === "O") {
    setTimeout(botMove, 300);
  }
}

function renderGame() {
  game.innerHTML = "";
  boards.forEach((board, bi) => {
    const boardDiv = document.createElement("div");
    boardDiv.classList.add("board");
    board.forEach((cell, ci) => {
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");
      if (boardWinners[bi]) {
        cellDiv.classList.add(`won-${boardWinners[bi]}`);
      }
      cellDiv.textContent = cell;
      if (!cell && !boardWinners[bi] && (activeBoard === -1 || activeBoard === bi)) {
        cellDiv.onclick = () => makeMove(bi, ci);
      }
      boardDiv.appendChild(cellDiv);
    });
    game.appendChild(boardDiv);
  });
}

function resetGame(mode) {
  gameMode = mode;
  menu.style.display = "none";
  gameContainer.style.display = "block";
  currentPlayer = "X";
  activeBoard = -1;
  for (let i = 0; i < 9; i++) {
    boards[i] = Array(9).fill("");
    boardWinners[i] = null;
  }
  statusText.textContent = `Player X's turn`;
  renderGame();
}

document.getElementById("play-vs-bot").onclick = () => resetGame("bot");
document.getElementById("play-vs-human-local").onclick = () => resetGame("local");
document.getElementById("reset").onclick = () => {
  menu.style.display = "block";
  gameContainer.style.display = "none";
};
