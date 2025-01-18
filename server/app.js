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
        const roomName = `room-${socket.id}`
        rooms[roomName] = { 
            title,
            pw,
        };
        socket.join(roomName);
        console.log(`created room: ${roomName}`);
        socket.emit('roomCreated', roomName);
        socket.broadcast.emit('roomCreateOtherUser', rooms);
    });

    // 방 참가
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined roomId: ${roomId}`);
    });

    // 플레어아 참가 시, 호스트 상태 변화
    socket.on('playerEntered', (roomId) => {
        socket.to(roomId).emit('roomReady');
        console.log(`room ready ${roomId}`);

        delete rooms[roomId]; // 빈 방 삭제(플레이어 2명 모집 완료된 상황에서, 더이상 모집 목록에 보이지 않게)
        socket.broadcast.emit('roomList', rooms);
    });

    // 카운트 다운
    socket.on('startCountdown', (countdownTime) => {
        socket.broadcast.emit('syncCountdown', countdownTime);
    });

    // 상대방 paddle 위치 동기화
    socket.on('sendOpponentLocation', ({ id, paddleX, paddleY }) => {
        // id: roomId
        socket.broadcast.in(id).emit("reciveOpponentLocation", { paddleX, paddleY });
    });

    // 클라이언트가 연결 해제 시 방에서 제거
    socket.on('disconnect', () => {
        const roomName = `room-${socket.id}`;
        delete rooms[roomName]; // 빈 방 삭제
        socket.broadcast.emit('roomList', rooms);
        console.log('User disconnected:', socket.id);
    });
});

// 서버 시작
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
