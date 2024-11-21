interface ButtonProps {
    name: String;
    onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ name, onClick }) => {
    return (
        <button
            className='bg-gray-300 w-20 h-20 rounded-full text-center content-center hover:bg-gray-400'
            onClick={onClick}
        >
            {name}
        </button>
    );
}