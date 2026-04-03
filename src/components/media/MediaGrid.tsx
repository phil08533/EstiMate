'use client'

import { useState, useEffect } from 'react'
import { Trash2, Pencil, Play } from 'lucide-react'
import { getSignedUrl } from '@/lib/supabase/storage'
import MediaViewer from './MediaViewer'
import type { EstimateMedia } from '@/lib/types'

interface MediaGridProps {
  media: EstimateMedia[]
  onDelete: (id: string, path: string) => Promise<void>
  onSaveAnnotation: (id: string, data: object) => Promise<void>
  onSaveComment: (id: string, comment: string) => Promise<void>
}

interface MediaWithUrl extends EstimateMedia {
  signedUrl: string
}

export default function MediaGrid({ media, onDelete, onSaveAnnotation, onSaveComment }: MediaGridProps) {
  const [withUrls, setWithUrls] = useState<MediaWithUrl[]>([])
  const [viewing, setViewing] = useState<MediaWithUrl | null>(null)

  useEffect(() => {
    async function loadUrls() {
      const results = await Promise.all(
        media.map(async m => ({
          ...m,
          signedUrl: await getSignedUrl(m.storage_path),
        }))
      )
      setWithUrls(results)
    }
    if (media.length > 0) loadUrls()
    else setWithUrls([])
  }, [media])

  if (withUrls.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {withUrls.map(m => (
          <div key={m.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 group">
            {m.media_type === 'photo' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.signedUrl}
                alt="Media"
                className="w-full h-full object-cover"
                onClick={() => setViewing(m)}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center bg-gray-900 cursor-pointer"
                onClick={() => setViewing(m)}
              >
                <Play className="w-8 h-8 text-white" />
              </div>
            )}
            {/* Annotation indicator */}
            {m.annotation_data && (
              <div className="absolute top-1 left-1 bg-blue-600 rounded-full p-1">
                <Pencil className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            {/* Comment indicator */}
            {m.comment && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                <p className="text-white text-xs truncate">{m.comment}</p>
              </div>
            )}
            {/* Delete button */}
            <button
              onClick={() => onDelete(m.id, m.storage_path)}
              className="absolute top-1 right-1 bg-black/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        ))}
      </div>

      {viewing && (
        <MediaViewer
          media={viewing}
          signedUrl={viewing.signedUrl}
          onClose={() => setViewing(null)}
          onSaveAnnotation={data => onSaveAnnotation(viewing.id, data)}
          onSaveComment={comment => onSaveComment(viewing.id, comment)}
        />
      )}
    </>
  )
}
