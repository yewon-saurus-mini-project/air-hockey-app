import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";

import { Button } from "../components/Button";
import { Alert } from "../components/Alert";

import { useSocket } from "../_lib/useSocket";
import { getCircleInfo, areCirclesColliding } from "../_lib/collision";

const STAGE_PADDING = 5;
const MINIMUM_SPEED = 2;
const MAXIMUM_SPEED = 8;
const INITIAL_PUCK_PHYSICS = {
    position: {
        x: 204,
        y: 378,
    },
    velocity: {
        x: Math.floor(Math.random() * 10) - 5,  // -5 ~ 5 사이에서 랜덤 정수 추출하기
        y: Math.floor(Math.random() * 10) - 5,
    },
};
const INITIAL_COUNT_TIME = 5;
const SCORING_COUNT_TIME = 3;
const POINT_NEEDED_TO_WIN = 10;

const Room: NextPage<{}> = () => {
    const router = useRouter();
    const {id, isHost} = router.query; // id: roomName
    const socketInstance = useSocket();

    const [realMouse, setRealMouse] = useState({
        x: 0,
        y: 0,
    });
    const [isReady, setIsReady] = useState(false);
    const [gameover, setGameover] = useState(false);
    const [countdownTime, setCountdownTime] = useState(INITIAL_COUNT_TIME);
    const [puckPhysics, setPuckPhysics] = useState(INITIAL_PUCK_PHYSICS);
    const [points, setPoints] = useState({
        black: 0,
        white: 0,
    });

    const wholeStageRef = useRef<HTMLDivElement>(null);
    const hostStageRef = useRef<HTMLDivElement>(null);
    const hostPaddleRef = useRef<HTMLDivElement>(null);
    const guestStageRef = useRef<HTMLDivElement>(null);
    const guestPaddleRef = useRef<HTMLDivElement>(null);
    const puckRef = useRef<HTMLDivElement | null>(null);
    const hostGoalPostRef = useRef<HTMLDivElement>(null);
    const guestGoalPostRef = useRef<HTMLDivElement>(null);

    let stageRect: DOMRect | null = null;
    let paddle: HTMLDivElement | null = null;
    let opponentPaddle: HTMLDivElement | null = null;

    useEffect(() => {
        const hostStage = hostStageRef.current;
        const hostPaddle = hostPaddleRef.current;
        const guestStage = guestStageRef.current;
        const guestPaddle = guestPaddleRef.current;

        // 마우스 조작 시, 마우스 커서 위치와 paddle 위치 동기화
        const handleMouseMove = (e: any) => {
            const minX = 28;
            const maxX = stageRect!.width - 28;
            const minY = 28;
            const maxY = stageRect!.height - 28;
            
            setRealMouse({
                x: e.clientX,
                y: e.clientY,
            });

            let mouseX = e.clientX - stageRect!.left;
            let mouseY = e.clientY - stageRect!.top;

            mouseX = Math.max(minX, Math.min(maxX, mouseX));
            mouseY = Math.max(minY, Math.min(maxY, mouseY));

            const [paddleX, paddleY] = [mouseX - 28, mouseY - 28];

            paddle!.style.transform = `translate(${paddleX}px, ${paddleY}px)`;

            // 상대방에 paddle 위치 전송
            socketInstance.emit("sendOpponentLocation", { id, paddleX, paddleY });
        }
        window?.addEventListener("mousemove", handleMouseMove);

        // 호스트 여부에 따른 기준 paddle 설정
        if (isHost === 'false') {
            stageRect = guestStage!.getBoundingClientRect();
            [paddle, opponentPaddle] = [guestPaddle, hostPaddle];
            
            socketInstance.emit('playerEntered', id);
            setIsReady(true);

            // 플레이어 기준 자신의 stage가 아래에 향하도록 조치 (1/2)
            if (hostStageRef.current) {
                hostStageRef.current.style.transform = `rotate(-180deg)`;
            }
        }
        else {
            stageRect = hostStage!.getBoundingClientRect();
            [paddle, opponentPaddle] = [hostPaddle, guestPaddle];

            // 플레이어 기준 자신의 stage가 아래에 향하도록 조치 (2/2)
            if (wholeStageRef.current && hostStageRef.current) {
                wholeStageRef.current.style.transform = `rotate(180deg)`;
                hostStageRef.current.style.transform = `rotate(-180deg)`;
            }
        }

        // ready 완료
        socketInstance.on('roomReady', () => {
            setIsReady(true);
        });

        // 상대방 paddle 위치 동기화
        socketInstance.on('reciveOpponentLocation', ({ paddleX, paddleY }) => {
            opponentPaddle!.style.transform = `translate(${paddleX}px, ${paddleY}px)`;
        });

        return () => {
            window?.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    useEffect(() => {
        // 승부가 결정되지 않은 상황에서만 실행
        if (points.white < POINT_NEEDED_TO_WIN && points.black < POINT_NEEDED_TO_WIN) {
            // 게스트 입장 시, 카운트 다운
            if (countdownTime <= 0) {
                // puck 나타나기
                const puck = puckRef.current;
                puck!.style.left = `${puckPhysics.position.x}px`;
                puck!.style.top = `${puckPhysics.position.y}px`;
    
                return;
            };
    
            if (isReady) {
                if (isHost === 'true') {
                    const remainingTime = countdownTime - 1;
    
                    setTimeout(() => {
                        setCountdownTime(remainingTime);
                        socketInstance.emit('startCountdown', { id, countdownTime: remainingTime });
                    }, 1000);
                }
        
                socketInstance.on('syncCountdown', (countdownTime) => {
                    // 상대방과 카운트 상황 동기화
                    setCountdownTime(countdownTime);
                });
            }
        }
    }, [isReady, countdownTime]);

    useEffect(() => {
        // 게임 준비가 완료되어 puck이 생성된 시점
        const [hostPaddle, guestPaddle] = [hostPaddleRef.current, guestPaddleRef.current];
        if (isHost === 'false') return; // puck의 움직임, 충돌 처리는 모두 host에서 관리 및 전달

        const position = { x: puckPhysics.position.x, y: puckPhysics.position.y };
        const velocity = { x: puckPhysics.velocity.x, y: puckPhysics.velocity.y };
        let collisionCooldown = false; // 충돌 처리 쿨다운
        
        const update = () => {
            if (hostPaddle && puckRef.current) {
                const puck = puckRef.current;
                let [puckX, puckY] = [`${position.x}px`, `${position.y}px`];

                if (collisionCooldown) {
                    // 충돌 쿨다운 중이라면 위치만 갱신
                    puck!.style.left = puckX;
                    puck!.style.top = puckY;
                    socketInstance.emit("sendPuckLocation", { id, puckX, puckY }); // host - puck 위치 동기화(보냄)
                    setTimeout(() => {
                        collisionCooldown = false;
                    }, 50);
                    requestAnimationFrame(update);
                    return;
                }
                
                // puck 위치 업데이트
                position.x += velocity.x;
                position.y += velocity.y;
                [puckX, puckY] = [`${position.x}px`, `${position.y}px`];
                puck!.style.left = puckX;
                puck!.style.top = puckY;
                socketInstance.emit("sendPuckLocation", { id, puckX, puckY }); // host - puck 위치 동기화(보냄)
    
                setPuckPhysics({
                    position: {
                        x: position.x,
                        y: position.y,
                    },
                    velocity: {
                        x: velocity.x,
                        y: velocity.y,
                    },
                });

                // 요소의 위치와 크기 계산
                const hostCircle = getCircleInfo(hostPaddle);
                const guestCircle = getCircleInfo(guestPaddle);
                const puckCircle = getCircleInfo(puckRef.current);
                const wholeStageRect = wholeStageRef.current?.getBoundingClientRect();
                const puckRect = puckRef.current?.getBoundingClientRect();
                const hostGoalPostRect = hostGoalPostRef.current?.getBoundingClientRect();
                const guestGoalPostRect = guestGoalPostRef.current?.getBoundingClientRect();

                // 충돌 여부 확인
                const isCollidingWithPlayer = areCirclesColliding(hostCircle!, puckCircle!);
                const isCollidingWithOpponent = areCirclesColliding(guestCircle!, puckCircle!);
                const isCollidingWithHostGoalPost = (puckRect!.left <= hostGoalPostRect!.right && puckRect!.right >= hostGoalPostRect!.left && puckRect.bottom >= hostGoalPostRect!.top);
                const isCollidingWithGuestGoalPost = (puckRect!.left <= guestGoalPostRect!.right && puckRect!.right >= guestGoalPostRect!.left && puckRect.top <= guestGoalPostRect!.bottom);
                const isCollidingWithWall = {
                    left: puckRect!.left <= wholeStageRect!.left + STAGE_PADDING,
                    right: puckRect!.right >= wholeStageRect!.right - STAGE_PADDING,
                    top: puckRect!.top <= wholeStageRect!.top + STAGE_PADDING,
                    bottom: puckRect!.bottom >= wholeStageRect!.bottom - STAGE_PADDING,
                };
        
                if (isCollidingWithPlayer) {
                    velocity.x += (hostCircle!.centerX - position.x < 0 ? position.x - hostCircle!.centerX : hostCircle!.centerX - position.x) * 0.01;
                    velocity.y += (hostCircle!.centerY - position.y < 0 ? position.y - hostCircle!.centerY : hostCircle!.centerY - position.y) * 0.01;

                    if (Math.abs(velocity.x) > MAXIMUM_SPEED) {
                        if (velocity.x > 0) velocity.x = MAXIMUM_SPEED;
                        else velocity.x = -MAXIMUM_SPEED;
                    }
                    if (Math.abs(velocity.y) > MAXIMUM_SPEED) {
                        if (velocity.y > 0) velocity.y = MAXIMUM_SPEED;
                        else velocity.y = -MAXIMUM_SPEED;
                    }
                }
                else if (isCollidingWithOpponent) {
                    velocity.x += (guestCircle!.centerX - position.x > 0 ? position.x - guestCircle!.centerX : guestCircle!.centerX - position.x) * 0.01;
                    velocity.y += (guestCircle!.centerY - position.y > 0 ? position.y - guestCircle!.centerY : guestCircle!.centerY - position.y) * 0.01;

                    if (Math.abs(velocity.x) > MAXIMUM_SPEED) {
                        if (velocity.x > 0) velocity.x = MAXIMUM_SPEED;
                        else velocity.x = -MAXIMUM_SPEED;
                    }
                    if (Math.abs(velocity.y) > MAXIMUM_SPEED) {
                        if (velocity.y > 0) velocity.y = MAXIMUM_SPEED;
                        else velocity.y = -MAXIMUM_SPEED;
                    }
                }
                else if (isCollidingWithHostGoalPost) {
                    // guest(white) 득점
                    collisionCooldown = true;
                    setPuckPhysics(INITIAL_PUCK_PHYSICS);

                    let updatedPoints = points;
                    if (points.black === 0 && points.white === 0) updatedPoints = {black: 0, white: 1}; // TODO: 첫 골에서 점수 카운팅이 '2'씩 됨.. 임시 조치
                    else updatedPoints = { ...updatedPoints, white: updatedPoints.white + 1 };
                    setPoints(updatedPoints);
                    socketInstance.emit("sendPoints", { id, updatedPoints });
                    
                    setCountdownTime(SCORING_COUNT_TIME);
                    socketInstance.emit('startCountdown', { id, countdownTime: SCORING_COUNT_TIME });
                    return;
                }
                else if (isCollidingWithGuestGoalPost) {
                    // host(black) 득점
                    collisionCooldown = true;
                    setPuckPhysics(INITIAL_PUCK_PHYSICS);
                    
                    let updatedPoints = points;
                    if (points.black === 0 && points.white === 0) updatedPoints = {black: 1, white: 0}; // TODO: 첫 골에서 점수 카운팅이 '2'씩 됨.. 임시 조치
                    else updatedPoints = { ...updatedPoints, black: updatedPoints.black + 1 };
                    setPoints(updatedPoints);
                    socketInstance.emit("sendPoints", { id, updatedPoints });

                    setCountdownTime(SCORING_COUNT_TIME);
                    socketInstance.emit('startCountdown', { id, countdownTime: SCORING_COUNT_TIME });
                    return;
                }
                else if (isCollidingWithWall.left) {
                    collisionCooldown = true;
                    velocity.x = velocity.x + velocity.x * 0.3;
                    velocity.x *= -1;

                    // 위치, 속도 보정
                    if (position.x < wholeStageRect!.left) position.x = wholeStageRect!.left + STAGE_PADDING;
                    if (Math.abs(velocity.x) < MINIMUM_SPEED) {
                        if (velocity.x > 0) velocity.x = MINIMUM_SPEED;
                        else velocity.x = -MINIMUM_SPEED;
                    }
                }
                else if (isCollidingWithWall.right) {
                    collisionCooldown = true;
                    velocity.x = velocity.x - velocity.x * 0.3;
                    velocity.x *= -1;

                    // 위치, 속도 보정
                    if (position.x > wholeStageRect!.right) position.x = wholeStageRect!.right - STAGE_PADDING;
                    if (Math.abs(velocity.x) < MINIMUM_SPEED) {
                        if (velocity.x > 0) velocity.x = MINIMUM_SPEED;
                        else velocity.x = -MINIMUM_SPEED;
                    }
                }
                else if (isCollidingWithWall.top) {
                    collisionCooldown = true;
                    velocity.y = velocity.y - velocity.y * 0.3;
                    velocity.y *= -1;

                    // 위치, 속도 보정
                    if (position.y < wholeStageRect!.top) position.y = wholeStageRect!.top + STAGE_PADDING;
                    if (Math.abs(velocity.y) < MINIMUM_SPEED) {
                        if (velocity.y > 0) velocity.y = MINIMUM_SPEED;
                        else velocity.y = -MINIMUM_SPEED;
                    }
                }
                else if (isCollidingWithWall.bottom) {
                    collisionCooldown = true;
                    velocity.y = velocity.y + velocity.y * 0.3;
                    velocity.y *= -1;

                    // 위치, 속도 보정
                    if (position.y > wholeStageRect!.bottom) position.y = wholeStageRect!.bottom - STAGE_PADDING;
                    if (Math.abs(velocity.y) < MINIMUM_SPEED) {
                        if (velocity.y > 0) velocity.y = MINIMUM_SPEED;
                        else velocity.y = -MINIMUM_SPEED;
                    }
                }
            }
            requestAnimationFrame(update);
        }
        update();

        return () => {
            cancelAnimationFrame(update as unknown as number);
        }
    }, [puckRef, points]);

    useEffect(() => {
        if (isHost === 'true') return;

        const update = () => {
            if (puckRef.current) {
                const puck = puckRef.current;
    
                // guest - puck 위치 동기화(받음)
                socketInstance.on('recivePuckLocation', ({ puckX, puckY }) => {          
                    puck!.style.left = puckX;
                    puck!.style.top = puckY;
                });
            }
            requestAnimationFrame(update);
        }
        update();

        return () => {
            cancelAnimationFrame(update as unknown as number);
        }
    }, [puckRef]);

    useEffect(() => {
        if (isHost === 'true') return;

        socketInstance.on('recivePoints', ({ updatedPoints }) => {
            setPoints(updatedPoints);
        });
    }, [points]);

    useEffect(() => {
        if (points.white >= POINT_NEEDED_TO_WIN || points.black >= POINT_NEEDED_TO_WIN) {
            setGameover(true);
            setIsReady(false);
        }
    }, [points]);

    return (
        <>
            <div className='absolute left-3 top-3 z-10'>
                {
                    isReady && countdownTime > 0 && !gameover ? <Alert message={countdownTime} /> : ''
                }
                {
                    points.black >= POINT_NEEDED_TO_WIN ? <Alert message={'Black Win'} /> : ''
                }
                {
                    points.white >= POINT_NEEDED_TO_WIN ? <Alert message={'White Win'} /> : ''
                }
                {
                    isReady
                    ?
                    <div className="text-center">
                        <div>Black : White</div>
                        <div>{`${points.black} : ${points.white}`}</div>
                    </div>
                    :
                    <Button name={'나가기'} onClick={() => {
                        router.push('/')
                        socketInstance.disconnect();
                    }} />
                }
                {
                    gameover
                    ?
                    <Button name={'나가기'} onClick={() => {
                        router.push('/')
                        socketInstance.disconnect();
                    }} />
                    :
                    ''
                }
            </div>
            <div ref={wholeStageRef}>
                <div ref={hostStageRef} className="bg-red-100 h-[399px] relative">
                    <div ref={hostPaddleRef} className="w-14 h-14 bg-black border-white border rounded-full absolute pointer-events-none will-change-transform"></div>
                    <div ref={hostGoalPostRef} className="top-[391px] left-[95px] absolute w-60 h-1 bg-red-300 rounded-full"></div>
                </div>
                <div ref={guestStageRef} className="bg-blue-100 h-[399px] relative">
                    <div ref={guestPaddleRef} className="w-14 h-14 bg-white border-black border rounded-full absolute pointer-events-none will-change-transform"></div>
                    <div ref={guestGoalPostRef} className="top-[391px] left-[95px] absolute w-60 h-1 bg-blue-300 rounded-full"></div>
                </div>
                {
                    countdownTime === 0 && !gameover
                    ?
                    <div ref={puckRef} className="w-10 h-10 bg-gray-400 border-black border rounded-full absolute pointer-events-none">
                        <div className="w-6 h-6 bg-gray-300 border-black border rounded-full absolute pointer-events-none m-[7px]">
                            {/* 퍽 */}
                        </div>
                    </div>
                    :
                    ''
                }
            </div>
        </>
    );
}

export default Room;