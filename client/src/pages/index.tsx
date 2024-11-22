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

  const handleClickModal = () => setShowModal(!showModal);

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
          <Button name={'방 생성'} onClick={handleClickModal} />
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
