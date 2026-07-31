"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Crown, Circle, Zap } from "lucide-react";
import { getSocket } from "@/lib/socket";

interface Member {
  id: string;
  displayName: string;
  joinedAt: string;
  lastSeenAt: string;
  isHost: boolean;
}

interface MemberListProps {
  code: string;
  hostName?: string;
}

export function MemberList({ code, hostName }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/classroom/${code}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchMembers();

    // Socket realtime listener for member joins & leaves
    const socket = getSocket();

    const handleMemberChange = () => {
      fetchMembers();
    };

    socket.on("member-joined", handleMemberChange);
    socket.on("member-left", handleMemberChange);

    // Fallback Polling every 5s
    const interval = setInterval(fetchMembers, 5000);

    return () => {
      socket.off("member-joined", handleMemberChange);
      socket.off("member-left", handleMemberChange);
      clearInterval(interval);
    };
  }, [code, fetchMembers]);

  return (
    <div className="glass-card p-4 rounded-2xl border border-zinc-800/80 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 font-bold text-sm text-zinc-100">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Thành viên ({members.length})</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
          <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Socket Realtime</span>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-zinc-500 animate-pulse">
          Đang tải danh sách thành viên...
        </div>
      ) : members.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-500">
          Chưa có thành viên trực tuyến
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {members.map((member) => {
            const initial = member.displayName.charAt(0).toUpperCase();
            return (
              <div
                key={member.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700/60 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-xs">
                    {initial}
                  </div>
                  <span className="font-semibold text-zinc-200">
                    {member.displayName}
                  </span>
                </div>

                {member.isHost && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
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
