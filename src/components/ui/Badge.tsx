import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'topic' | 'due' | 'flagged' | 'new'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

const styles: Record<BadgeVariant, string> = {
  default: 'bg-zinc-100 text-zinc-600',
  topic: 'bg-indigo-50 text-indigo-700',
  due: 'bg-amber-50 text-amber-700',
  flagged: 'bg-red-50 text-red-700',
  new: 'bg-emerald-50 text-emerald-700',
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  )
}
