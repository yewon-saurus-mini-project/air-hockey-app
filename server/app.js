const express = require('express');
const app = express();

// 포트 설정
const PORT = 8000;

// 기본 라우팅
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
