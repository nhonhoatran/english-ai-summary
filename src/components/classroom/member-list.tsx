"use client";

import { useEffect, useState } from "react";
import { Users, Crown, Zap } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { initialOf } from "@/lib/classroom/display-name";

interface PresenceMember {
  userId: string | null;
  memberId: string | null;
  displayName: string;
}

interface MemberListProps {
  code: string;
  hostUserId: string;
  currentUserId: string;
}

/**
 * Who is in the room right now, straight from socket presence.
 *
 * The old version polled /members every 5s and the API only counted members
 * whose lastSeenAt was inside a 10s window while the client heartbeat was also
 * 10s — so people constantly flickered out of the list. Socket connections are
 * the ground truth for "connected", so presence is derived from them instead.
 */
export function MemberList({ code, hostUserId, currentUserId }: MemberListProps) {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onPresence = (payload: { members?: PresenceMember[] }) => {
      setMembers(payload?.members ?? []);
    };
    const onConnect = () => {
      setConnected(true);
      socket.emit("request-presence", { code });
    };
    const onDisconnect = () => setConnected(false);

    socket.on("presence-updated", onPresence);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) onConnect();

    return () => {
      socket.off("presence-updated", onPresence);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [code]);

  return (
    <div className="glass-card p-4 rounded-2xl border border-zinc-800/80 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 font-bold text-sm text-zinc-100">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Đang online ({members.length})</span>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            connected
              ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/40"
              : "text-zinc-500 bg-zinc-900 border-zinc-800"
          }`}
        >
          <Zap className={`w-3 h-3 ${connected ? "animate-pulse" : ""}`} />
          <span>{connected ? "Realtime" : "Mất kết nối"}</span>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-500">
          {connected ? "Chưa có ai trực tuyến" : "Đang kết nối..."}
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {members.map((member) => {
            const isHost = !!member.userId && member.userId === hostUserId;
            const isMe = !!member.userId && member.userId === currentUserId;

            return (
              <div
                key={member.userId ?? member.memberId ?? member.displayName}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-xs ${
                  isMe
                    ? "bg-blue-950/30 border-blue-500/30"
                    : "bg-zinc-900/60 border-zinc-800/50 hover:border-zinc-700/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                    {initialOf(member.displayName)}
                  </div>
                  <span className="font-semibold text-zinc-200 truncate">
                    {member.displayName}
                    {isMe && <span className="ml-1 text-blue-400">(bạn)</span>}
                  </span>
                </div>

                {isHost && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Host
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
