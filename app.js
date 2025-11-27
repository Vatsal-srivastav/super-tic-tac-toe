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

function evaluateBoard(boards, boardWinners) {
  // Heuristic scoring function to evaluate board state
  let score = 0;
  for (let bi = 0; bi < 9; bi++) {
    const b = boards[bi];
    const w = boardWinners[bi];
    if (w === "X") score += 10;
    else if (w === "O") score -= 10;
    else {
      const center = b[4];
      if (center === "X") score += 1;
      else if (center === "O") score -= 1;
    }
  }
  return score;
}

function minimax(boards, boardWinners, activeBoard, player, depth, maxDepth, alpha, beta) {
  const winner = checkWin(boardWinners);
  if (winner === "X") return { score: 1000 - depth };
  if (winner === "O") return { score: depth - 1000 };

  const validMoves = getValidMoves(boards, boardWinners, activeBoard);
  if (validMoves.length === 0 || depth >= maxDepth) {
    return { score: evaluateBoard(boards, boardWinners) };
  }

  let bestMove = null;

  for (let move of validMoves) {
    const prevCell = boards[move.bi][move.ci];
    const prevWinner = boardWinners[move.bi];

    boards[move.bi][move.ci] = player;
    const localWinner = checkWin(boards[move.bi]);
    if (localWinner) boardWinners[move.bi] = localWinner;

    const nextActive = (!boardWinners[move.ci] && boards[move.ci].some(c => !c)) ? move.ci : -1;
    const result = minimax(
      boards,
      boardWinners,
      nextActive,
      player === "X" ? "O" : "X",
      depth + 1,
      maxDepth,
      alpha,
      beta
    );

    boards[move.bi][move.ci] = prevCell;
    boardWinners[move.bi] = prevWinner;

    if (player === "O") {
      if (result.score < beta) {
        beta = result.score;
        bestMove = move;
      }
    } else {
      if (result.score > alpha) {
        alpha = result.score;
        bestMove = move;
      }
    }

    if (alpha >= beta) break;
  }

  return { score: player === "O" ? beta : alpha, move: bestMove };
}

function botMove() {
  const { move } = minimax(boards, boardWinners, activeBoard, "O", 0, 15, -Infinity, Infinity);
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

    // ➤ ADD THIS: highlight the active board
    if (activeBoard === -1) {
      // All boards open → highlight all un-won boards
      if (!boardWinners[bi]) {
        boardDiv.classList.add("active-board");
      }
    } else if (activeBoard === bi) {
      boardDiv.classList.add("active-board");
    }

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
