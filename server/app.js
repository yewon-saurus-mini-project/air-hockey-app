const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const PORT = 8000;
const CLIENT_URL = 'http://localhost:3000';

const app = express();
const server = http.createServer(app);
const socketio = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
        // credentials: true, // 인증 정보 필요할 시 true
    }
});

// CORS 미들웨어 설정
app.use(cors({ origin: CLIENT_URL }));

let rooms = {};

// 기본 라우팅
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

// socket이 연결되었을 때
socketio.on('connection', (socket) => {
    console.log('클라이언트 연결됨: ', socket.id);

    // 방 목록
    socket.on('getRooms', () => {
        socketio.emit('roomList', rooms);
    });

    // 방 생성
    socket.on('createRoom', ({ title, pw }) => {
        rooms[socket.id] = { 
            title,
            pw,
        };
        socket.join(title);
        console.log(`created room: ${socket.id}`);
        socket.emit('roomCreated', socket.id);
        socket.broadcast.emit('roomCreateOtherUser', rooms);
    });

    // 방 참가
    socket.on('joinRoom', (hostId) => {
        socket.join(hostId);
        console.log(`${socket.id} joined room: ${hostId}`);
        io.to(hostId).emit('playerJoined', socket.id);
    });

    // 클라이언트가 연결 해제 시 방에서 제거
    socket.on('disconnect', () => {
        delete rooms[socket.id]; // 빈 방 삭제
        console.log('User disconnected:', socket.id);
    });
});

// 서버 시작
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
