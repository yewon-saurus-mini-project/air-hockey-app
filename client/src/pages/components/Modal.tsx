import { ModalState } from "../model";

export const Modal: React.FC<ModalState> = ({ title, description, content, handleClickConfirm, handleClickCancle }) => {
    return (
        <div
            className="fixed top-0 left-0 w-full h-full bg-black/40 flex justify-center items-center z-20"
            onClick={handleClickCancle}
        >
            <div
                className="p-4 w-96 flex flex-col bg-gray-200 rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            > {/* e.stopPropagation(): 모달을 닫는 state 함수가 아래로 전파되는 것을 막아줌 */}
                <div>
                    <div className="text-xl">{title}</div>
                    <div className="text-sm">{description}</div>
                </div>
                <br />
                {
                    content
                }
                <br />
                <div className="flex flex-col">
                    <button className="bg-black text-white p-2 rounded-full hover:bg-gray-700 border border-white" onClick={handleClickConfirm}>확인</button>
                    <button className="bg-white text-black p-2 rounded-full hover:bg-gray-300 border border-black mt-1" onClick={handleClickCancle}>취소</button>
                </div>
            </div>
        </div>
    );
}