'use client'

import { useRef } from 'react'
import { Camera, Upload } from 'lucide-react'

interface MediaUploaderProps {
  onUpload: (files: File[]) => Promise<void>
  uploading: boolean
}

export default function MediaUploader({ onUpload, uploading }: MediaUploaderProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    await onUpload(files)
    // Reset inputs
    if (cameraRef.current) cameraRef.current.value = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      {uploading && (
        <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-700">Uploading...</span>
        </div>
      )}
      <div className="flex gap-2">
        {/* Camera button */}
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex flex-col items-center gap-1.5 py-4 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 active:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <Camera className="w-6 h-6" />
          <span className="text-sm font-medium">Camera</span>
        </button>
        {/* Gallery button */}
        <button
          onClick={() => galleryRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex flex-col items-center gap-1.5 py-4 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 active:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <Upload className="w-6 h-6" />
          <span className="text-sm font-medium">Gallery</span>
        </button>
      </div>
      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleFiles}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  )
}
