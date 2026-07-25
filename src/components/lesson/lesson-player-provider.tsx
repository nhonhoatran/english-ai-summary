// path/to/src/components/lesson/lesson-player-provider.tsx
"use client";

import { createContext, useContext, useRef, ReactNode, useCallback } from "react";
import YouTube, { YouTubePlayer, YouTubeProps } from "react-youtube";

interface PlayerContextType {
  seekTo: (seconds: number) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a LessonPlayerProvider");
  }
  return context;
}

interface LessonPlayerProviderProps {
  videoId: string;
  children: ReactNode;
}

export function LessonPlayerProvider({
  videoId,
  children,
}: LessonPlayerProviderProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(seconds, true);
        playerRef.current.playVideo();
      } catch (err) {
        console.error("Failed to seek YouTube player:", err);
      }
    }
  }, []);

  const onReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;
  };

  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <PlayerContext.Provider value={{ seekTo }}>
      <div className="space-y-6">
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl">
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onReady}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        </div>
        {children}
      </div>
    </PlayerContext.Provider>
  );
}
