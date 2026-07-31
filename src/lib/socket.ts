"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io({
      path: "/api/socket/io",
      addTrailingSlash: false,
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};
