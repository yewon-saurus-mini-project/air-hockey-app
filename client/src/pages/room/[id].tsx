import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { Button } from "../components/Button";

import { useSocket } from "../_lib/useSocket";

const Room: NextPage<{}> = () => {
    const router = useRouter();
    const {id, isHost} = router.query;
    const socketInstance = useSocket();

    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (isHost === 'false') {
            setIsReady(true);
            socketInstance.emit('playerEntered', id);
        }

        socketInstance.on('roomReady', () => {
            setIsReady(true);
        });
    }, []);

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
                    <Button name={'나가기'} onClick={() => {router.push('/')}} />
                }
            </div>
            <div>
                <div className="bg-red-100 h-[399px]">
                    {/* TODO */}
                </div>
                <div className="bg-blue-100 h-[399px]">
                    {/* TODO */}
                </div>
            </div>
        </>
    );
}

export default Room;