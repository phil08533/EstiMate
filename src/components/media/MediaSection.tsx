'use client'

import { useState } from 'react'
import { useMedia } from '@/lib/hooks/useMedia'
import MediaUploader from './MediaUploader'
import MediaGrid from './MediaGrid'

interface MediaSectionProps {
  estimateId: string
  teamId: string
}

export default function MediaSection({ estimateId, teamId }: MediaSectionProps) {
  const { media, loading, addMedia, updateMediaComment, saveAnnotation, removeMedia } = useMedia(estimateId)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(files: File[]) {
    setUploading(true)
    try {
      for (const file of files) {
        await addMedia(file, teamId)
      }
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="py-4 text-center text-gray-400 text-sm">Loading media...</div>
  }

  return (
    <div className="space-y-4">
      <MediaUploader onUpload={handleUpload} uploading={uploading} />
      {media.length > 0 && (
        <MediaGrid
          media={media}
          onDelete={removeMedia}
          onSaveAnnotation={saveAnnotation}
          onSaveComment={updateMediaComment}
        />
      )}
      {media.length === 0 && !uploading && (
        <p className="text-center text-gray-400 text-sm py-4">
          No photos yet. Tap Camera or Gallery to add.
        </p>
      )}
    </div>
  )
}
