'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { RoomItem } from './components/RoomItem';

import { ModalState, NewRoomState } from './interface';

const dummyList = [
  {
    id: "kj9g7v5yq3kx",
    title: "안녕하세요. 한 수 부탁드립니다. ^^",
    pw: 1234,
  },
  {
    id: "asdf11asdf11",
    title: "안녕하세요. 두 수 부탁드립니다. ^^",
    pw: null,
  },
];

export default function Home() {
  const [roomList, setRoomList] = useState(dummyList);
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
    return (
      <div>
        <div>
          <div>* 방 제목</div>
          <input className='p-2 w-full' onChange={(e) => setNewRoomInfo((prev) => ({...prev, title: e.target.value}))} />
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
    console.log(newRoomInfo);
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
          roomList.map(item => 
            <RoomItem
              id={item.id} title={item.title} pw={item.pw}
              setModalContent={setModalContent}
              handleClickModal={handleClickModal}
            />
          )
        }
        <div className='absolute right-6 bottom-6 z-10 grid grid-rows-2 gap-2'>
          <Button name={'방 생성'} onClick={handleClickCreateRoom} />
          <Button name={'새로고침'} onClick={() => {window.location.reload()}} />
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