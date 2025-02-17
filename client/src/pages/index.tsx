'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { RoomItem } from './components/RoomItem';

import { ModalState, NewRoomState } from './model';

import { useSocket } from './_lib/useSocket';

export default function Home() {
  const [roomList, setRoomList] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<ModalState>({
    title: "제목",
    description: "설명",
    content: <div>내용</div>,
    handleClickConfirm: () => {},
    handleClickCancle: () => {}
  });
  const [newRoomInfo, setNewRoomInfo] = useState<NewRoomState>({
    title: "안녕하세요. 한 수 부탁드립니다. ^^",
    pw: null,
  });
  const socketInstance = useSocket();

  const router = useRouter();

  useEffect(() => {
    socketInstance.connect();

    socketInstance.emit('getRooms');

    socketInstance.on('roomList', (updatedRooms) => {
      setRoomList(updatedRooms);
    });

    socketInstance.on('roomCreateOtherUser', (updatedRooms) => {
      setRoomList(updatedRooms);
    });

    // return () => {
    //   socketInstance.disconnect();
    // }
  }, []);

  const handleClickModal = async () => setShowModal(!showModal);

  const handleClickCreateRoom = async () => {
    setModalContent(prev => ({
      ...prev,
      title: "방 생성",
      description: "*는 필수 입력 사항입니다.",
      content: <CreateRoomForm />,
      handleClickConfirm: handleClickCinfirmButtonOfCreateRoom,
    }));

    setTimeout(async () => {
      await handleClickModal();
    }, 0); // setTimeout 0: 비동기적인 방식으로 이벤트 루프의 다음 실행 queue로 작업을 지연 시킴!! 권장되는 방법은 아니라는 듯
  }

  const CreateRoomForm: React.FC = () => {
    const titleRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (titleRef.current) titleRef.current.value = newRoomInfo.title;
    });

    return (
      <div>
        <div>
          <div>* 방 제목</div>
          <input ref={titleRef} className='p-2 w-full' onChange={(e) => setNewRoomInfo((prev) => ({...prev, title: e.target.value}))} />
        </div>
        <div className='mt-1'>
          <div>비밀번호 설정</div>
          <input type='number' className='p-2 w-full' onChange={(e) => setNewRoomInfo((prev) => ({...prev, pw: Number(e.target.value)}))} />
        </div>
      </div>
    );
  }

  const handleClickCinfirmButtonOfCreateRoom = () => {
    // console.log(newRoomInfo); console에서는 최신 값이 아니라 전 값이 나오는데.. console 출력에만 문제가 있는 걸까? => 아님.. 클로저에 대해 잘 생각해 보시길
    // useCallback 이용해 봤다가, 그 시점에서의 문제가 아니라는 것을 깨달음
    // useEffect 이용해서 의도한대로 작동하도록 수정..
    // TODO: 더 좋은 방법을 생각해 보자
    const { title, pw } = newRoomInfo;
    socketInstance.emit('createRoom', { title, pw });

    socketInstance.on('roomCreated', (createdRoomId) => {
      router.push(`room/${createdRoomId}?isHost=true`);
    });

      socketInstance.on('error', (errorMessage) => {
        alert(`에러가 발생했습니다. 다시 시도해 주세요.\n\n${errorMessage}`);
    });
  };

  useEffect(() => {
    setModalContent(prev => ({
      ...prev,
      handleClickConfirm: handleClickCinfirmButtonOfCreateRoom,
    }));
  }, [newRoomInfo]);

  return (
    <>
      <div>
        {
          Object.entries(roomList).map(([key, value]) => (
            <RoomItem key={key}
              id={key} title={value.title} pw={value.pw}
              setModalContent={setModalContent}
              handleClickModal={handleClickModal}
              socketInstance={socketInstance}
            />
          ))
        }
        <div className='absolute right-28 bottom-28 z-10'>
          <Button name={'방 생성'} onClick={handleClickCreateRoom} />
        </div>
      </div>
      {
        showModal
        &&
        <Modal
          title={modalContent.title}
          description={modalContent.description}
          content={modalContent.content}
          handleClickConfirm={modalContent.handleClickConfirm}
          handleClickCancle={handleClickModal}
        />
      }
    </>
  );
}