import { clsx } from 'clsx'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-semibold rounded-xl transition-colors active:scale-[0.98] disabled:opacity-50',
          {
            'bg-blue-600 text-white active:bg-blue-700': variant === 'primary',
            'bg-gray-100 text-gray-900 active:bg-gray-200': variant === 'secondary',
            'text-gray-600 active:bg-gray-100': variant === 'ghost',
            'bg-red-600 text-white active:bg-red-700': variant === 'danger',
          },
          {
            'text-sm px-3 py-2': size === 'sm',
            'text-base px-4 py-3': size === 'md',
            'text-lg px-6 py-4': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </span>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
