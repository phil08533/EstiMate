import { clsx } from 'clsx'

interface BadgeProps {
  className?: string
  children: React.ReactNode
}

export default function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        className
      )}
    >
      {children}
    </span>
  )
}
