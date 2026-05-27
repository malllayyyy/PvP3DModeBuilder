const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all for dev
    methods: ["GET", "POST"]
  }
});

const BUILDING_TIME_SECONDS = 60;

// simple state to hold waiting user and active rooms
let waitingSocket = null;
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Matchmaking
  if (waitingSocket) {
    const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;
    const player1 = waitingSocket;
    const player2 = socket;

    // Join both to room
    player1.join(roomId);
    player2.join(roomId);
    
    // reset waiting
    waitingSocket = null;

    // Store room state
    rooms.set(roomId, {
      players: [player1.id, player2.id],
      timerInterval: null
    });

    console.log(`Room created: ${roomId} with players ${player1.id} and ${player2.id}`);

    // Notify players they are matched
    player1.emit('GAME_STARTED', { roomId, timeLimit: BUILDING_TIME_SECONDS, isInitiator: true });
    player2.emit('GAME_STARTED', { roomId, timeLimit: BUILDING_TIME_SECONDS, isInitiator: false });

    // Start countdown timer
    let timeLeft = BUILDING_TIME_SECONDS;
    const interval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(interval);
        io.to(roomId).emit('TIMER_EXPIRED');
      } else {
        io.to(roomId).emit('TIMER_TICK', { timeLeft });
      }
    }, 1000);

    rooms.get(roomId).timerInterval = interval;
  } else {
    // wait for another player
    waitingSocket = socket;
    socket.emit('WAITING_FOR_OPPONENT');
  }

  // WebRTC Signaling Relay
  socket.on('webrtc_offer', (data) => {
    socket.to(data.roomId).emit('webrtc_offer', {
      sdp: data.sdp,
      senderId: socket.id
    });
  });

  socket.on('webrtc_answer', (data) => {
    socket.to(data.roomId).emit('webrtc_answer', {
      sdp: data.sdp,
      senderId: socket.id
    });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    socket.to(data.roomId).emit('webrtc_ice_candidate', {
      candidate: data.candidate,
      senderId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (waitingSocket && waitingSocket.id === socket.id) {
      waitingSocket = null;
    }

    // Check if player was in a room, notify opponent and cleanup
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.includes(socket.id)) {
        socket.to(roomId).emit('OPPONENT_DISCONNECTED');
        if (room.timerInterval) clearInterval(room.timerInterval);
        rooms.delete(roomId);
        break;
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
