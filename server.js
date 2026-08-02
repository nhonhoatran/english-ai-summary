const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

/**
 * Live presence per room, derived from actual socket connections.
 *
 * Presence used to be inferred from ClassMember.lastSeenAt within a 10s window
 * while the client only pinged every 10s, so members constantly blinked in and
 * out of the list. Sockets already know exactly who is connected.
 *
 * Shape: Map<roomCode, Map<socketId, { userId, memberId, displayName }>>
 */
const presenceByRoom = new Map();

function roomPresence(roomCode) {
  const sockets = presenceByRoom.get(roomCode);
  if (!sockets) return [];

  // One entry per user — a student with two tabs open is still one person.
  const byUser = new Map();
  for (const info of sockets.values()) {
    const key = info.userId || info.memberId || info.displayName;
    if (!byUser.has(key)) byUser.set(key, info);
  }
  return Array.from(byUser.values());
}

function broadcastPresence(io, roomCode) {
  io.to(roomCode).emit("presence-updated", {
    members: roomPresence(roomCode),
  });
}

function leaveRoom(io, socket) {
  const info = socket.data && socket.data.presence;
  if (!info) return;

  const { roomCode } = info;
  const sockets = presenceByRoom.get(roomCode);
  if (sockets) {
    sockets.delete(socket.id);
    if (sockets.size === 0) presenceByRoom.delete(roomCode);
  }

  socket.leave(roomCode);
  socket.data.presence = null;

  io.to(roomCode).emit("member-left", {
    userId: info.userId,
    displayName: info.displayName,
  });
  broadcastPresence(io, roomCode);
}

app.prepare().then(() => {
  const httpServer = createServer(handle);

  const io = new Server(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
    },
  });

  // Route handlers and server actions broadcast through this instance.
  global.io = io;

  io.on("connection", (socket) => {
    socket.data = { presence: null };

    socket.on("join-room", ({ code, userId, memberId, displayName }) => {
      if (!code) return;
      const roomCode = String(code).toUpperCase();

      // Re-joining (reconnect, lesson switch) must not leave a stale entry.
      if (socket.data.presence && socket.data.presence.roomCode !== roomCode) {
        leaveRoom(io, socket);
      }

      const info = {
        roomCode,
        userId: userId || null,
        memberId: memberId || null,
        displayName: displayName || "Học viên",
      };

      socket.join(roomCode);
      socket.data.presence = info;

      if (!presenceByRoom.has(roomCode)) presenceByRoom.set(roomCode, new Map());
      presenceByRoom.get(roomCode).set(socket.id, info);

      socket.to(roomCode).emit("member-joined", {
        userId: info.userId,
        displayName: info.displayName,
      });
      broadcastPresence(io, roomCode);
    });

    // Anyone can ask for the current roster (used right after mount).
    socket.on("request-presence", ({ code }) => {
      if (!code) return;
      const roomCode = String(code).toUpperCase();
      socket.emit("presence-updated", { members: roomPresence(roomCode) });
    });

    // Host syncs the active tab. The DB write and the authoritative broadcast
    // both happen in /api/classroom/[code]/sync; this is the low-latency path.
    socket.on("sync-state", ({ code, currentTab, currentSegment }) => {
      if (!code) return;
      const roomCode = String(code).toUpperCase();
      socket.to(roomCode).emit("state-updated", {
        currentTab,
        currentSegment,
        lastSyncAt: new Date().toISOString(),
      });
    });

    socket.on("leave-room", () => leaveRoom(io, socket));

    socket.on("disconnect", () => leaveRoom(io, socket));
  });

  httpServer.listen(port, () => {
    console.log(`> Classroom Socket.io server running on http://${hostname}:${port}`);
  });
});
