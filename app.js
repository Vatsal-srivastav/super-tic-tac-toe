const menu = document.getElementById("menu");
const gameContainer = document.getElementById("game-container");
const game = document.getElementById("game");
const statusText = document.getElementById("status");
let currentPlayer = "X";
let activeBoard = -1;
let gameMode = "local"; 

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
      if (
        !cell &&
        !boardWinners[bi] &&
        (
          (activeBoard === -1 && boards[bi].some(c => !c)) ||
          activeBoard === bi
        )
      ) {
        cellDiv.onclick = () => makeMove(bi, ci);
      }
      boardDiv.appendChild(cellDiv);
    });
    game.appendChild(boardDiv);
  });
}

function makeMove(boardIndex, cellIndex) {
  if (gameMode === "online") {
    if (!isMyTurn || boards[boardIndex][cellIndex]) return;
    boards[boardIndex][cellIndex] = mySymbol;
    const winner = checkWin(boards[boardIndex]);
    if (winner) boardWinners[boardIndex] = winner;
    const gameWinner = checkWin(boardWinners);
    let nextActive = (!boardWinners[cellIndex] && boards[cellIndex].some(c => !c)) ? cellIndex : -1;
    socket.emit('move', {
      room,
      boardIndex,
      cellIndex,
      symbol: mySymbol,
      winner,
      nextActiveBoard: nextActive
    });
    activeBoard = nextActive;
    currentPlayer = mySymbol === "X" ? "O" : "X";
    isMyTurn = false;
    if (gameWinner) {
      statusText.textContent = `You ${gameWinner === mySymbol ? "win!" : "lose!"}`;
      document.getElementById("reset").style.display = "block";
    } else {
      statusText.textContent = "Opponent's turn";
    }
    renderGame();
    return;
  }
  if (boards[boardIndex][cellIndex]) return;
  boards[boardIndex][cellIndex] = currentPlayer;
  const winner = checkWin(boards[boardIndex]);
  if (winner) {
    boardWinners[boardIndex] = winner;
  }
  const gameWinner = checkWin(boardWinners);
  if (gameWinner) {
    statusText.textContent = `Player ${gameWinner} wins the game!`;
    renderGame();
    return;
  }
  if (!boardWinners[cellIndex] && boards[cellIndex].some(c => !c)) {
    activeBoard = cellIndex;
  } else {
    activeBoard = -1;
  }
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusText.textContent = `Player ${currentPlayer}'s turn`;
  renderGame();

  if (gameMode === "bot" && currentPlayer === "O") {
    setTimeout(botMove, 500);
  }
}

function botMove() {
  let {move} = minimax(boards, boardWinners, activeBoard, "O", 0, 12);
  if (move) {
    makeMove(move.bi, move.ci);
  }
}

document.getElementById("play-vs-bot").onclick = () => {
  gameMode = "bot";
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
};

document.getElementById("play-vs-human-local").onclick = () => {
  gameMode = "local";
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
};

document.getElementById("play-vs-human-online").onclick = () => {
  gameMode = "online";
  menu.style.display = "none";
  gameContainer.style.display = "block";
  statusText.textContent = "Connecting to server...";
  document.getElementById("reset").style.display = "none";
  for (let i = 0; i < 9; i++) {
    boards[i] = Array(9).fill("");
    boardWinners[i] = null;
  }
  currentPlayer = "X";
  activeBoard = -1;
  renderGame();

  socket = io("http://localhost:3000");

  socket.on('waiting', () => {
    statusText.textContent = "Waiting for another player...";
  });

  socket.on('start', (data) => {
    room = data.room;
    mySymbol = data.symbol;
    isMyTurn = (mySymbol === "X");
    statusText.textContent = isMyTurn ? "Your turn (You are X)" : "Opponent's turn (You are O)";
    renderGame();
  });

  socket.on('move', (data) => {
    boards[data.boardIndex][data.cellIndex] = data.symbol;
    if (data.winner) boardWinners[data.boardIndex] = data.symbol;
    activeBoard = data.nextActiveBoard;
    currentPlayer = data.symbol === "X" ? "O" : "X";
    isMyTurn = true;
    const gameWinner = checkWin(boardWinners);
    if (gameWinner) {
      statusText.textContent = `You ${gameWinner === mySymbol ? "win!" : "lose!"}`;
      document.getElementById("reset").style.display = "block";
    } else {
      statusText.textContent = "Your turn";
    }
    renderGame();
  });
};

document.getElementById("reset").onclick = () => {
  menu.style.display = "block";
  gameContainer.style.display = "none";
};

let botNN = null;

fetch('bot_weights.json')
  .then(res => res.json())
  .then(weights => {
    botNN = new BotNN(weights);
  });

function getValidMoves(boards, boardWinners, activeBoard) {
  let moves = [];
  if (activeBoard === -1) {
    for (let bi = 0; bi < 9; bi++) {
      if (!boardWinners[bi] && boards[bi].some(c => !c)) {
        for (let ci = 0; ci < 9; ci++) {
          if (!boards[bi][ci]) moves.push({bi, ci});
        }
      }
    }
  } else {
    if (!boardWinners[activeBoard] && boards[activeBoard].some(c => !c)) {
      for (let ci = 0; ci < 9; ci++) {
        if (!boards[activeBoard][ci]) moves.push({bi: activeBoard, ci});
      }
    }
  }
  return moves;
}

function minimax(boards, boardWinners, activeBoard, player, depth, maxDepth) {
  const winner = checkWin(boardWinners);
  if (winner === "X") return {score: 10 - depth};
  if (winner === "O") return {score: depth - 10};
  if (getValidMoves(boards, boardWinners, activeBoard).length === 0 || depth >= maxDepth) return {score: 0};

  let bestMove = null;
  let bestScore = (player === "O") ? Infinity : -Infinity;
  let moves = getValidMoves(boards, boardWinners, activeBoard);

  for (let move of moves) {
    boards[move.bi][move.ci] = player;
    let prevWinner = boardWinners[move.bi];
    let localWinner = checkWin(boards[move.bi]);
    if (localWinner) boardWinners[move.bi] = localWinner;

    let nextActive = (!boardWinners[move.ci] && boards[move.ci].some(c => !c)) ? move.ci : -1;
    let result = minimax(boards, boardWinners, nextActive, player === "X" ? "O" : "X", depth + 1, maxDepth);

    boards[move.bi][move.ci] = "";
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
  return {score: bestScore, move: bestMove};
}
