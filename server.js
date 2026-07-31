const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);

  const io = new Server(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
    },
  });

  // Attach global io instance for API route usage if needed
  global.io = io;

  io.on("connection", (socket) => {
    // Member / Host joins classroom room
    socket.on("join-room", ({ code, displayName }) => {
      if (!code) return;
      const roomCode = code.toUpperCase();
      socket.join(roomCode);
      socket.data = { roomCode, displayName };

      // Broadcast to room that a member joined
      io.to(roomCode).emit("member-joined", {
        displayName,
        socketId: socket.id,
      });
    });

    // Host syncs tab / segment in real-time
    socket.on("sync-state", ({ code, currentTab, currentSegment }) => {
      if (!code) return;
      const roomCode = code.toUpperCase();
      socket.to(roomCode).emit("state-updated", {
        currentTab,
        currentSegment,
        lastSyncAt: new Date().toISOString(),
      });
    });

    // Host ends room
    socket.on("end-room", ({ code }) => {
      if (!code) return;
      const roomCode = code.toUpperCase();
      io.to(roomCode).emit("room-ended");
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      if (socket.data?.roomCode) {
        io.to(socket.data.roomCode).emit("member-left", {
          displayName: socket.data.displayName,
          socketId: socket.id,
        });
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Classroom Socket.io server running on http://${hostname}:${port}`);
  });
});
