import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { QuizQuestion } from '../lib/quiz'
import { buildAnswerOptions } from '../lib/quiz'

export type QuizPhase = 'setup' | 'quiz' | 'finished'

interface UseQuizSessionOptions {
  questions: QuizQuestion[]
  answerPool: QuizQuestion[]
}

export function useQuizSession({ questions, answerPool }: UseQuizSessionOptions) {
  const [phase, setPhase] = useState<QuizPhase>('setup')
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(30)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [timeoutCount, setTimeoutCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const advancingRef = useRef(false)

  const current = questions[index]
  const timed = secondsPerQuestion > 0

  const options = useMemo(() => {
    if (!current) return []
    return buildAnswerOptions(current, answerPool)
  }, [current, answerPool])

  const advance = useCallback(() => {
    if (advancingRef.current) return
    advancingRef.current = true

    if (index < questions.length - 1) {
      setIndex((i) => i + 1)
      setSelected(null)
    } else {
      setPhase('finished')
    }

    window.setTimeout(() => {
      advancingRef.current = false
    }, 0)
  }, [index, questions.length])

  const handleTimeout = useCallback(() => {
    if (selected || advancingRef.current) return
    setTimeoutCount((c) => c + 1)
    setSelected('__timeout__')
  }, [selected])

  useEffect(() => {
    if (phase !== 'quiz' || !timed || selected) return

    setTimeLeft(secondsPerQuestion)
    const interval = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(interval)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [phase, timed, secondsPerQuestion, index, selected, handleTimeout])

  const startQuiz = useCallback(() => {
    setPhase('quiz')
    setIndex(0)
    setSelected(null)
    setScore(0)
    setTimeoutCount(0)
    setTimeLeft(secondsPerQuestion)
  }, [secondsPerQuestion])

  const selectOption = useCallback(
    (option: string) => {
      if (selected || !current) return
      setSelected(option)
      if (option === current.back) setScore((s) => s + 1)
    },
    [selected, current]
  )

  return {
    phase,
    secondsPerQuestion,
    setSecondsPerQuestion,
    index,
    selected,
    score,
    timeoutCount,
    timeLeft,
    current,
    options,
    timed,
    startQuiz,
    selectOption,
    advance,
    questionCount: questions.length,
  }
}
