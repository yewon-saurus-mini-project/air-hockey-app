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

// 기본 라우팅
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

// socket이 연결되었을 때
socketio.on('connection', (socket) => {
    console.log('클라이언트 연결됨: ', socket.id);

    socket.on('disconnect', () => {
        console.log('클라이언트 연결 종료:', socket.id);
    });
});

// 서버 시작
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
