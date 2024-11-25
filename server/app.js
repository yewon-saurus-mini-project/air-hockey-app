const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const socketio = new Server(server);

// 포트 설정
const PORT = 8000;

// 기본 라우팅
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

// socket이 연결되었을 때
socketio.on('connection', (socket) => {
    console.log('클라이언트 연결됨: ', socket.id);
});

// 서버 시작
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
