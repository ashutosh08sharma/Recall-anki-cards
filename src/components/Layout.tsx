import {
  BookOpen,
  PlusCircle,
  Library,
  Bell,
} from 'lucide-react'
import type { AppView } from '../types'

interface LayoutProps {
  view: AppView
  onNavigate: (view: AppView) => void
  dueCount: number
  revisitCount: number
  children: React.ReactNode
}

const navItems: { view: AppView; label: string; icon: typeof BookOpen }[] = [
  { view: 'import', label: 'Import', icon: PlusCircle },
  { view: 'library', label: 'Library', icon: Library },
  { view: 'reminders', label: 'Reminders', icon: Bell },
]

export function Layout({
  view,
  onNavigate,
  dueCount,
  revisitCount,
  children,
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-zinc-900">
              Recall
            </span>
          </button>

          <nav className="flex items-center gap-1">
            {navItems.map(({ view: v, label, icon: Icon }) => (
              <button
                key={v}
                type="button"
                onClick={() => onNavigate(v)}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  view === v || (view === 'study' && v === 'library') || (view === 'quiz' && v === 'library') || (view === 'edit' && v === 'library')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                {v === 'reminders' && (dueCount + revisitCount) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {dueCount + revisitCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400">
        Recall — smart flashcards, spaced repetition, local-first
      </footer>
    </div>
  )
}
