# 에어 하키 (v.1)

웹에서 플레이할 수 있는 에어 하키입니다.

## 사용 기술
- client
    - Next.js
    - TypeScript
    - Tailwind CSS
- server
    - Express.js
    - Socket.IO

## 실행

- 클라이언트 실행
```shell
cd client/
npm run dev
```

- 서버 실행
```shell
cd server/
node app.js
```

## UI 설계

- UI 설계도 작성에는 디자인 툴 Figma를 사용했습니다.

![UI 설계도](/img/ui-design.png);

## 실행 화면
[메인 화면](#메인-화면방-목록)
[게임방 생성, 참가](#게임방-생성-참가)
[게임 진행](#게임-진행)

### 메인 화면(방 목록)

![메인 화면(방 목록)](/img/screen-main.JPG)

### 게임방 생성, 참가

#### 비밀방
![비밀번호가 설정된 게임방 생성 및 참가 시연](/img/screen-create-private-room.gif)
- 방 생성 시, 기본값으로 설정되는 방 제목이 있어 빠른 생성이 가능합니다.
- 방 참가 시, 비밀번호를 입력할 수 있는 모달 창이 나타납니다.
- 비밀번호가 일치하지 않는 경우, 브라우저의 alert으로 알림이 나타나게 됩니다.

#### 공개방
![비밀번호를 설정하지 않은 게임방(공개방) 생성 및 참가 시연](/img/screen-create-public-room.gif)
- 비밀번호를 설정하지 않는다면, 해당 방은 '공개방'으로 설정되어 비밀번호 입력 없이 참가할 수 있게 됩니다.

### 게임 진행
![게임 진행 시연](/img/screen-goal.gif)
- host와 guest 각자의 paddle이 각자의 마우스 움직임과 동기화 되고, 소켓 통신을 통해 위치가 공유됩니다.
- 위 화면에서는 black 측의 골대에 puck이 충돌하게 되면서, white paddle이 득점한 상황입니다.

### 승리 판정
![게임 오버 화면](/img/screen-gameover.gif)

- white 측이 먼저 기준 점수(여기서는 10점)을 달성하게 되어, 화면에 'White Win'이라는 알림이 나타납니다.
- 참가자의 원활한 퇴장 및 재시작을 위해 '나가기' 버튼을 제공합니다.