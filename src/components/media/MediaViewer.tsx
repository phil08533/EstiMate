'use client'

import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import VideoPlayer from './VideoPlayer'
import PhotoAnnotator from './PhotoAnnotator'
import MediaCommentForm from './MediaCommentForm'
import type { EstimateMedia } from '@/lib/types'

interface MediaViewerProps {
  media: EstimateMedia
  signedUrl: string
  onClose: () => void
  onSaveAnnotation: (data: object) => Promise<void>
  onSaveComment: (comment: string) => Promise<void>
}

export default function MediaViewer({ media, signedUrl, onClose, onSaveAnnotation, onSaveComment }: MediaViewerProps) {
  const [annotating, setAnnotating] = useState(false)

  if (annotating && media.media_type === 'photo') {
    return (
      <PhotoAnnotator
        photoUrl={signedUrl}
        annotationData={media.annotation_data}
        onSave={onSaveAnnotation}
        onClose={() => setAnnotating(false)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <button onClick={onClose} className="p-2 text-gray-300 active:bg-gray-700 rounded-xl">
          <X className="w-5 h-5" />
        </button>
        {media.media_type === 'photo' && (
          <button
            onClick={() => setAnnotating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold active:bg-blue-700"
          >
            <Pencil className="w-4 h-4" />
            Draw
          </button>
        )}
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
        {media.media_type === 'photo' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signedUrl}
            alt="Estimate photo"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <VideoPlayer src={signedUrl} className="max-h-[60vh]" />
        )}
      </div>

      {/* Comment */}
      <div className="p-4 bg-gray-900">
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase">Comment</p>
        <MediaCommentForm
          initialComment={media.comment}
          onSave={onSaveComment}
        />
      </div>
    </div>
  )
}
