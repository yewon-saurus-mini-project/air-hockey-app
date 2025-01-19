interface AlertProps {
    message: string | number;
}

export const Alert: React.FC<AlertProps> = ({ message }) => {
    return (
        <div className="absolute z-40 -left-3 -top-3 bg-black text-white text-6xl w-[450px] h-[798px] leading-[798px] text-center">
            {message}
        </div>
    );
}