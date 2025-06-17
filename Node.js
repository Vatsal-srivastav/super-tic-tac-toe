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
