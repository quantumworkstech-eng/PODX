"use client";

import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  studioName: string;
  videoUrl?: string;
}

export function VideoModal({ isOpen, onClose, studioName, videoUrl }: VideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  if (!isOpen) return null;

  const demoVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoUrl || demoVideoUrl}
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            playsInline
          />

          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
            </button>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </button>

              <div
                className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-[#D9FC67] rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <button
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6 text-white" />
                ) : (
                  <Volume2 className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#0a0a0a]">
          <h3 className="text-lg font-semibold text-white">{studioName} Studio Tour</h3>
          <p className="text-white/60 text-sm mt-1">1 min video preview</p>
        </div>
      </div>
    </div>
  );
}
