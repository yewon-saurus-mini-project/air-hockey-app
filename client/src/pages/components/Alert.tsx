interface AlertProps {
    message: string | number;
}

export const Alert: React.FC<AlertProps> = ({ message }) => {
    return (
        <div className="absolute -left-3 -top-3 bg-black bg-opacity-30 text-white text-9xl w-[450px] h-[798px] leading-[798px] text-center">
            {message}
        </div>
    );
}