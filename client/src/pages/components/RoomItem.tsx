import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

import { ModalState } from "../interface";
import { Socket } from "socket.io-client";

interface RoomItemProps {
    id: String;
    title: String;
    pw: Number | null;
    setModalContent: React.Dispatch<React.SetStateAction<ModalState>>;
    handleClickModal: () => Promise<void>;
    socketInstance: Socket,
}

export const RoomItem: React.FC<RoomItemProps> = ({ id, title, pw, setModalContent, handleClickModal, socketInstance }) => {
    const [pwValue, setPwValue] = useState(0);
    
    const router = useRouter();

    const handleClickRoomItem = async () => {
        if (pw) {
            setModalContent(prev => ({
                ...prev,
                title: "방 입장",
                description: `(${id})${title}`,
                content: <EnterPrivateRoomForm />,
                handleClickConfirm: handleClickCinfirmButtonOfEnterPrivateRoom,
              }));

            setTimeout(async () => {
                await handleClickModal();
            }, 0);
        }
        else {
            socketInstance.emit("joinRoom", id);
            router.push(`room/${id}?isHost=false`);
        }
    }

    const EnterPrivateRoomForm: React.FC = () => {
        return (
            <div>
                <div>
                    <div>비밀방입니다. 비밀번호를 입력하세요. (숫자)</div>
                    <input type="number" className='p-2 w-full' onChange={(e) => {setPwValue(Number(e.target.value))}} />
                </div>
            </div>
        );
    }

    const handleClickCinfirmButtonOfEnterPrivateRoom = () => {
        if (pwValue === pw) {
            socketInstance.emit("joinRoom", title);
            router.push(`room/${id}?isHost=false`);
        }
        else alert('비밀번호가 일치하지 않습니다. 다시 시도해 주세요.');
    };

    useEffect(() => {
        setModalContent(prev => ({
            ...prev,
            handleClickConfirm: handleClickCinfirmButtonOfEnterPrivateRoom,
          }));
    }, [pwValue]);

    return (
        <div className="cursor-pointer hover:bg-gray-100" onClick={handleClickRoomItem}>
            <div className='p-3 border'>
            <div className='text-xs text-gray-400'>{id}</div>
            <div>{title}</div>
            <div className='text-xl'>
                {
                pw ? '🔒' : '🔓'
                }
            </div>
            </div>
        </div>
    );
}