"use client";

import React from "react";

interface VideoPlayerProps {
  videoId: string;
  videoUrl: string;
}

const VideoPlayer = React.memo(({ videoId, videoUrl }: VideoPlayerProps) => {
  return (
    <div className="w-full aspect-video bg-black" style={{ contain: 'content' }}>
      <iframe
        key={videoId}
        style={{ width: '100%', height: '100%', border: 'none' }}
        src={`${videoUrl}?autoplay=1&rel=0`}
        title="Live Performance"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}, (prevProps, nextProps) => prevProps.videoId === nextProps.videoId);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;