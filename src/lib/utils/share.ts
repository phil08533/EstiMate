import { v4 as uuidv4 } from 'uuid'

export function generateShareToken(): string {
  return uuidv4().replace(/-/g, '')
}

export function getShareUrl(token: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return `${base}/shared/${token}`
}
