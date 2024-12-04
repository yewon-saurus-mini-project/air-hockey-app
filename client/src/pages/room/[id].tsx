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

    const hostStageRef = useRef<HTMLDivElement | null>(null);
    const hostPaddleRef = useRef<HTMLDivElement | null>(null);
    const guestStageRef = useRef<HTMLDivElement | null>(null);
    const guestPaddleRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const hostStage = hostStageRef.current;
        const hostPaddle = hostPaddleRef.current;
        const guestStage = guestStageRef.current;
        const guestPaddle = guestPaddleRef.current;
        
        let stageRect: DOMRect | null = null;
        let paddle: HTMLDivElement | null = null;
        let opponentPaddle: HTMLDivElement | null = null;

        const handleMouseMove = (e) => {
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

            socketInstance.emit("sendOpponentLocation", { id, paddleX, paddleY });
        }
        window?.addEventListener("mousemove", handleMouseMove);

        if (isHost === 'false') {
            stageRect = guestStage!.getBoundingClientRect();
            [paddle, opponentPaddle] = [guestPaddle, hostPaddle];
            
            socketInstance.emit('playerEntered', id);
            setIsReady(true);
        }
        else {
            stageRect = hostStage!.getBoundingClientRect();
            [paddle, opponentPaddle] = [hostPaddle, guestPaddle];
        }

        socketInstance.on('roomReady', () => {
            setIsReady(true);
        });

        socketInstance.on('reciveOpponentLocation', ({ paddleX, paddleY }) => {          
            console.log(paddleX, paddleY);
            opponentPaddle!.style.left = paddleX;
            opponentPaddle!.style.top = paddleY;
        });

        return () => {
            window?.removeEventListener("mousemove", handleMouseMove);
        };
    }, [isReady]);

    return (
        <>
            <div className='absolute left-3 top-3 z-10'>
                {
                    isReady
                    ?
                    <div className="text-center">
                        <div>Black : White</div>
                        <div>0 : 0</div>
                    </div>
                    :
                    <Button name={'나가기'} onClick={() => {
                        router.push('/')
                        socketInstance.disconnect();
                    }} />
                }
            </div>
            <div>
                <div ref={hostStageRef} className="bg-red-100 h-[399px] relative">
                    <div ref={hostPaddleRef} className="w-14 h-14 bg-black border-white border rounded-full absolute pointer-events-none"></div>
                </div>
                <div ref={guestStageRef} className="bg-blue-100 h-[399px] relative">
                    <div ref={guestPaddleRef} className="w-14 h-14 bg-white border-black border rounded-full absolute pointer-events-none"></div>
                </div>
            </div>
        </>
    );
}

export default Room;