import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const useSocket = () => {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_API_URL);
    }

    return socket;
}