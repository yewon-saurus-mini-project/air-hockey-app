export default interface ModalState {
    title: string;
    description: string;
    content: React.ReactNode;
    handleClickConfirm: () => void;
    handleClickCancle: () => void;
}