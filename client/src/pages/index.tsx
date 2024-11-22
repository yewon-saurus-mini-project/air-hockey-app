'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { ModalState } from './interface/ModalState';

const dummyList = [
  {
    id: "kj9g7v5yq3kx",
    title: "안녕하세요. 한 수 부탁드립니다. ^^",
    private: 1234,
  },
  {
    id: "asdf11asdf11",
    title: "안녕하세요. 두 수 부탁드립니다. ^^",
    private: null,
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
  const [newRoomInfo, setNewRoomInfo] = useState({
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
          <input type='number' className='p-2 w-full' onChange={(e) => setNewRoomInfo((prev) => ({...prev, pw: e.target.value}))} />
        </div>
      </div>
    );
  }

  const handleClickCinfirmButtonOfCreateRoom = () => {
    // console.log(newRoomInfo); console에서는 최신 값이 아니라 전 값이 나오는데.. console 출력에만 문제가 있는 걸까? => 네
  }

  return (
    <>
      <div>
        {
          roomList.map(item => 
            <Link href={`room/${item.id}?isHost=false`}>
              <div className='p-3 border'>
                <div className='text-xs text-gray-400'>{item.id}</div>
                <div>{item.title}</div>
                <div className='text-xl'>
                  {
                    item.private ? '🔒' : '🔓'
                  }
                </div>
              </div>
            </Link>
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