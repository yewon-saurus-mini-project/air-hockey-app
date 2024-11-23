export default interface ModalState {
    title: String;
    description: String;
    content: React.ReactNode;
    handleClickConfirm: () => void;
    handleClickCancle: () => void;
}