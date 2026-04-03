'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadMedia, deleteMedia } from '@/lib/supabase/storage'
import type { EstimateMedia, EstimateMediaInsert } from '@/lib/types'

export function useMedia(estimateId: string) {
  const [media, setMedia] = useState<EstimateMedia[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('estimate_media')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
    setMedia(data ?? [])
    setLoading(false)
  }, [estimateId])

  useEffect(() => { load() }, [load])

  async function addMedia(
    file: File,
    teamId: string,
    comment?: string
  ): Promise<EstimateMedia> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { path, error } = await uploadMedia(file, teamId, estimateId)
    if (error) throw new Error(error)

    const mediaType = file.type.startsWith('video/') ? 'video' : 'photo'
    const { data, error: insertError } = await supabase
      .from('estimate_media')
      .insert({
        estimate_id: estimateId,
        uploaded_by: user.id,
        storage_path: path,
        media_type: mediaType,
        comment: comment ?? null,
        display_order: media.length,
      } as EstimateMediaInsert)
      .select()
      .single()

    if (insertError) throw insertError
    setMedia(prev => [...prev, data])
    return data
  }

  async function updateMediaComment(mediaId: string, comment: string) {
    const supabase = createClient()
    await supabase.from('estimate_media').update({ comment }).eq('id', mediaId)
    setMedia(prev => prev.map(m => m.id === mediaId ? { ...m, comment } : m))
  }

  async function saveAnnotation(mediaId: string, annotationData: object) {
    const supabase = createClient()
    await supabase.from('estimate_media').update({ annotation_data: annotationData }).eq('id', mediaId)
    setMedia(prev => prev.map(m => m.id === mediaId ? { ...m, annotation_data: annotationData } : m))
  }

  async function removeMedia(mediaId: string, storagePath: string) {
    const supabase = createClient()
    await supabase.from('estimate_media').delete().eq('id', mediaId)
    await deleteMedia(storagePath)
    setMedia(prev => prev.filter(m => m.id !== mediaId))
  }

  return { media, loading, addMedia, updateMediaComment, saveAnnotation, removeMedia, reload: load }
}
