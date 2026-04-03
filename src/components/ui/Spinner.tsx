import { clsx } from 'clsx'

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <div
      className={clsx(
        'border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin',
        { 'w-4 h-4': size === 'sm', 'w-6 h-6': size === 'md', 'w-10 h-10': size === 'lg' },
        className
      )}
    />
  )
}
