'use client'

interface VideoPlayerProps {
  src: string
  className?: string
}

export default function VideoPlayer({ src, className }: VideoPlayerProps) {
  return (
    <video
      src={src}
      controls
      playsInline
      className={`w-full rounded-xl bg-black ${className ?? ''}`}
      style={{ maxHeight: '60vh' }}
    />
  )
}
