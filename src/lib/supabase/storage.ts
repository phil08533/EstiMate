import { createClient } from './client'
import { v4 as uuidv4 } from 'uuid'

const BUCKET = 'estimate-media'

export async function uploadMedia(
  file: File,
  teamId: string,
  estimateId: string
): Promise<{ path: string; error: string | null }> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${teamId}/${estimateId}/${uuidv4()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) return { path: '', error: error.message }
  return { path, error: null }
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const supabase = createClient()
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  return data?.signedUrl ?? ''
}

export async function deleteMedia(path: string): Promise<void> {
  const supabase = createClient()
  await supabase.storage.from(BUCKET).remove([path])
}
