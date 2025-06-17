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
      restartBtn.style.display = "block";
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
  let moveMade = false;
  if (activeBoard === -1) {
    for (let bi = 0; bi < 9 && !moveMade; bi++) {
      if (!boardWinners[bi] && boards[bi].some(c => !c)) {
        for (let ci = 0; ci < 9; ci++) {
          if (!boards[bi][ci]) {
            makeMove(bi, ci);
            moveMade = true;
            break;
          }
        }
      }
    }
  } else {
    for (let ci = 0; ci < 9; ci++) {
      if (!boards[activeBoard][ci]) {
        makeMove(activeBoard, ci);
        break;
      }
    }
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

document.getElementById("reset").onclick = () => {
  menu.style.display = "block";
  gameContainer.style.display = "none";
};

// server.js
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

let waitingPlayer = null;

io.on('connection', (socket) => {
  if (waitingPlayer) {
    const room = `room-${waitingPlayer.id}-${socket.id}`;
    socket.join(room);
    waitingPlayer.join(room);
    io.to(room).emit('start', { room, symbol: 'O' });
    waitingPlayer.emit('start', { room, symbol: 'X' });
    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.emit('waiting');
  }

  socket.on('move', (data) => {
    socket.to(data.room).emit('move', data);
  });

  socket.on('disconnect', () => {
    if (waitingPlayer === socket) waitingPlayer = null;
  });
});

server.listen(3000, () => console.log('Server running on port 3000'));
