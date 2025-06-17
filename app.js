const board = Array(9).fill(null);
let currentPlayer = 'X';
let gameActive = true;

const statusDisplay = document.querySelector('.game-status');
const cells = document.querySelectorAll('.cell');

function handleCellClick(clickedCell, clickedCellIndex) {
    if (board[clickedCellIndex] || !gameActive) {
        return;
    }

    board[clickedCellIndex] = currentPlayer;
    clickedCell.textContent = currentPlayer;
    checkResult();
}

function checkResult() {
    const winningConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    let roundWon = false;
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusDisplay.textContent = `Player ${currentPlayer} has won!`;
        gameActive = false;
        return;
    }

    if (!board.includes(null)) {
        statusDisplay.textContent = 'It\'s a draw!';
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusDisplay.textContent = `It's ${currentPlayer}'s turn`;
}

function restartGame() {
    gameActive = true;
    currentPlayer = 'X';
    board.fill(null);
    cells.forEach(cell => cell.textContent = '');
    statusDisplay.textContent = `It's ${currentPlayer}'s turn`;
}


const boardContainer = document.querySelector('.game-board');
boardContainer.innerHTML = '';
for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    boardContainer.appendChild(cell);
}

cells.forEach((cell, index) => {
    cell.addEventListener('click', () => handleCellClick(cell, index));
});

document.querySelector('.restart-button').addEventListener('click', restartGame);

statusDisplay.textContent = `It's ${currentPlayer}'s turn`;
