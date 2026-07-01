import { useEffect, useId, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'

interface TopicTagEditorProps {
  value: string
  suggestions?: string[]
  onCommit: (value: string) => void
  ariaLabel?: string
}

export function TopicTagEditor({
  value,
  suggestions = [],
  onCommit,
  ariaLabel = 'Card topic',
}: TopicTagEditorProps) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) {
      setDraft(value)
    }
  }, [value, editing])

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  const commit = () => {
    const next = draft.trim() || 'General'
    setEditing(false)
    if (next !== value) {
      onCommit(next)
    }
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex max-w-full items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-left text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-200 hover:bg-indigo-100"
        title="Click to edit topic"
        aria-label={`${ariaLabel}: ${value || 'General'}. Click to edit.`}
      >
        <span className="truncate">{value || 'General'}</span>
        <Pencil className="h-3 w-3 shrink-0 opacity-50" />
      </button>
    )
  }

  return (
    <>
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((topic) => (
            <option key={topic} value={topic} />
          ))}
        </datalist>
      )}
      <input
        ref={inputRef}
        type="text"
        list={suggestions.length > 0 ? listId : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
        className="w-44 max-w-full rounded-full border border-indigo-300 bg-white px-2.5 py-0.5 text-xs font-medium text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        aria-label={ariaLabel}
        placeholder="Topic name"
      />
    </>
  )
}

interface TopicPickerProps {
  value: string
  topics: string[]
  onChange: (value: string) => void
  label?: string
}

export function TopicPicker({ value, topics, onChange, label = 'Topic' }: TopicPickerProps) {
  const listId = useId()
  const quickTopics = [...new Set(['General', ...topics])]

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {quickTopics.map((topic) => (
          <button
            key={topic}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(topic)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              value === topic
                ? 'bg-indigo-600 text-white'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            {topic}
          </button>
        ))}
      </div>
      <datalist id={listId}>
        {quickTopics.map((topic) => (
          <option key={topic} value={topic} />
        ))}
      </datalist>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a topic or pick one above"
        className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  )
}
