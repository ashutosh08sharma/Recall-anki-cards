import { HelpCircle } from 'lucide-react'
import { Button } from '../ui/Button'

interface QuizEmptyStateProps {
  title: string
  description: string
  onExit: () => void
}

export function QuizEmptyState({ title, description, onExit }: QuizEmptyStateProps) {
  return (
    <div className="py-24 text-center" role="status">
      <div className="mb-4 inline-flex rounded-full bg-indigo-50 p-4">
        <HelpCircle className="h-8 w-8 text-indigo-400" />
      </div>
      <h2 className="text-lg font-medium text-zinc-900">{title}</h2>
      <p className="mt-1 max-w-sm mx-auto text-sm text-zinc-500">{description}</p>
      <Button className="mt-6" variant="secondary" onClick={onExit}>
        Back
      </Button>
    </div>
  )
}
