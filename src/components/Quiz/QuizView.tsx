import { useMemo } from 'react'
import {
  collectDeckQuestions,
  collectGlobalQuestions,
  DECK_QUIZ_SIZE,
  GLOBAL_QUIZ_SIZE,
  MIN_GLOBAL_QUIZ_POOL,
  pickQuizQuestions,
} from '../../lib/quiz'
import { useQuizSession } from '../../hooks/useQuizSession'
import { QuizEmptyState } from './QuizEmptyState'
import { QuizSetup } from './QuizSetup'
import { QuizResults } from './QuizResults'
import { QuizQuestionPanel } from './QuizQuestionPanel'
import type { Deck } from '../../types'

export type QuizMode = 'deck' | 'global'

interface QuizViewProps {
  mode: QuizMode
  deck?: Deck
  decks?: Deck[]
  onExit: () => void
}

export function QuizView({ mode, deck, decks = [], onExit }: QuizViewProps) {
  const { questions, answerPool, title, subtitle, showDeckSource } = useMemo(() => {
    if (mode === 'global') {
      const pool = collectGlobalQuestions(decks)
      return {
        questions: pickQuizQuestions(pool, GLOBAL_QUIZ_SIZE),
        answerPool: pool,
        title: 'Mix Quiz',
        subtitle: 'Random cards from all your decks',
        showDeckSource: true,
      }
    }

    const pool = deck ? collectDeckQuestions(deck) : []

    return {
      questions: pickQuizQuestions(pool, DECK_QUIZ_SIZE),
      answerPool: pool,
      title: deck ? `${deck.title} — Quiz` : 'Quiz',
      subtitle: 'Choose your mode',
      showDeckSource: false,
    }
  }, [mode, deck, decks])

  const session = useQuizSession({ questions, answerPool })

  if (mode === 'global' && answerPool.length < MIN_GLOBAL_QUIZ_POOL) {
    return (
      <QuizEmptyState
        title="Not enough cards for Mix Quiz"
        description={`You need at least ${MIN_GLOBAL_QUIZ_POOL} cards across your decks. Add more decks or cards to unlock the mix quiz.`}
        onExit={onExit}
      />
    )
  }

  if (questions.length === 0) {
    return (
      <QuizEmptyState
        title="No cards to quiz"
        description="Add at least one card to this deck before starting a quiz."
        onExit={onExit}
      />
    )
  }

  if (session.phase === 'setup') {
    return (
      <QuizSetup
        title={title}
        subtitle={subtitle}
        questionCount={session.questionCount}
        secondsPerQuestion={session.secondsPerQuestion}
        onSecondsChange={session.setSecondsPerQuestion}
        onStart={session.startQuiz}
        onCancel={onExit}
      />
    )
  }

  if (session.phase === 'finished') {
    return (
      <QuizResults
        score={session.score}
        total={session.questionCount}
        timed={session.timed}
        timeoutCount={session.timeoutCount}
        onExit={onExit}
      />
    )
  }

  if (!session.current) return null

  return (
    <QuizQuestionPanel
      title={title}
      question={session.current}
      questionIndex={session.index}
      questionTotal={session.questionCount}
      options={session.options}
      selected={session.selected}
      timed={session.timed}
      timeLeft={session.timeLeft}
      secondsPerQuestion={session.secondsPerQuestion}
      showDeckSource={showDeckSource}
      onSelect={session.selectOption}
      onAdvance={session.advance}
      onExit={onExit}
    />
  )
}
