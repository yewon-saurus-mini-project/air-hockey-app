import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";

import { Button } from "../components/Button";

import { useSocket } from "../_lib/useSocket";

const Room: NextPage<{}> = () => {
    const router = useRouter();
    const {id, isHost} = router.query; // id: roomName
    const socketInstance = useSocket();

    const [isReady, setIsReady] = useState(false);
    const [countdownTime, setCountdownTime] = useState(5);

    const wholeStageRef = useRef<HTMLDivElement | null>(null);
    const hostStageRef = useRef<HTMLDivElement | null>(null);
    const hostPaddleRef = useRef<HTMLDivElement | null>(null);
    const guestStageRef = useRef<HTMLDivElement | null>(null);
    const guestPaddleRef = useRef<HTMLDivElement | null>(null);
    const puckRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const hostStage = hostStageRef.current;
        const hostPaddle = hostPaddleRef.current;
        const guestStage = guestStageRef.current;
        const guestPaddle = guestPaddleRef.current;
        
        let stageRect: DOMRect | null = null;
        let paddle: HTMLDivElement | null = null;
        let opponentPaddle: HTMLDivElement | null = null;

        // 마우스 조작 시, 마우스 커서 위치와 paddle 위치 동기화
        const handleMouseMove = (e: any) => {
            let mouseX = e.clientX - stageRect!.left;
            let mouseY = e.clientY - stageRect!.top;

            const minX = 28;
            const maxX = stageRect!.width - 28;
            const minY = 28;
            const maxY = stageRect!.height - 28;

            mouseX = Math.max(minX, Math.min(maxX, mouseX));
            mouseY = Math.max(minY, Math.min(maxY, mouseY));

            const [paddleX, paddleY] = [`${mouseX - 28}px`, `${mouseY - 28}px`];

            paddle!.style.left = paddleX;
            paddle!.style.top = paddleY;

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
            opponentPaddle!.style.left = paddleX;
            opponentPaddle!.style.top = paddleY;
        });

        return () => {
            window?.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    useEffect(() => {
        // 게스트 입장 시, 카운트 다운
        if (countdownTime <= 0) return;

        if (isReady) {
            if (isHost === 'true') {
                const remainingTime = countdownTime - 1;

                setTimeout(() => {
                    setCountdownTime(remainingTime);
                    socketInstance.emit('startCountdown', remainingTime);
                }, 1000);
            }
    
            socketInstance.on('syncCountdown', (countdownTime) => {
                // 상대방과 카운트 상황 동기화
                setCountdownTime(countdownTime);
            });
        }
    }, [isReady, countdownTime]);

    return (
        <>
            <div className='absolute left-3 top-3 z-10'>
                {
                    countdownTime === 0
                    ?
                    <div className="text-center">
                        <div>Black : White</div>
                        <div>0 : 0</div>
                    </div>
                    : isReady
                    ?
                    <div className="absolute -left-3 -top-3 bg-black text-white text-9xl w-[450px] h-[798px] leading-[798px] text-center">
                        {countdownTime}
                    </div>
                    :
                    <Button name={'나가기'} onClick={() => {
                        router.push('/')
                        socketInstance.disconnect();
                    }} />
                }
            </div>
            <div ref={wholeStageRef}>
                <div ref={hostStageRef} className="bg-red-100 h-[399px] relative">
                    <div ref={hostPaddleRef} className="w-14 h-14 bg-black border-white border rounded-full absolute pointer-events-none"></div>
                    <div className="top-[391px] left-[95px] absolute w-60 h-1 bg-red-300 rounded-full"></div>
                </div>
                <div ref={guestStageRef} className="bg-blue-100 h-[399px] relative">
                    <div ref={guestPaddleRef} className="w-14 h-14 bg-white border-black border rounded-full absolute pointer-events-none"></div>
                    <div className="top-[391px] left-[95px] absolute w-60 h-1 bg-blue-300 rounded-full"></div>
                </div>
                {
                    countdownTime === 0
                    ?
                    <div ref={puckRef} className="left-[204px] top-[378px] w-10 h-10 bg-gray-400 border-black border rounded-full absolute pointer-events-none">
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