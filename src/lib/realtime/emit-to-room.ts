import "server-only";

import type { Server } from "socket.io";

/**
 * server.js attaches the Socket.io server to globalThis after boot, so route
 * handlers and server actions running in the same Node process can broadcast
 * without the client having to be trusted to emit privileged events.
 *
 * Returns null under `next build`, unit tests, or any serverless runtime where
 * the custom server never ran — callers must treat emitting as best-effort.
 */
function getIo(): Server | null {
  const io = (globalThis as { io?: Server }).io;
  return io ?? null;
}

/** Broadcast an event to everyone in a classroom room. Never throws. */
export function emitToRoom(code: string, event: string, payload?: unknown): void {
  try {
    const io = getIo();
    if (!io) return;
    io.to(code.toUpperCase()).emit(event, payload);
  } catch (err) {
    console.error(`[emitToRoom] failed to emit "${event}" to ${code}:`, err);
  }
}
