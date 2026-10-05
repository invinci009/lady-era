'use client'

import { useState } from 'react'
import { Star, Sparkles } from 'lucide-react'

interface StarRatingQuestionProps {
  value: number | null
  onChange: (value: number) => void
}

const RATING_LABELS: Record<number, string> = {
  1: 'Disappointing visit',
  2: 'Could have been better',
  3: 'Good / Average',
  4: 'Very pleasant & lovely!',
  5: 'Outstanding boutique experience!',
}

export default function StarRatingQuestion({ value, onChange }: StarRatingQuestionProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const activeRating = hovered ?? value ?? 0

  const handleKeyDown = (e: React.KeyboardEvent, star: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(5, (value ?? star) + 1)
      onChange(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(1, (value ?? star) - 1)
      onChange(prev)
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(1)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(5)
    }
  }

  return (
    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-rose-900">
            Question 1 of 6
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[11px] text-rose-800 font-medium">Required</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          How was your{' '}
          <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
            shopping experience
          </span>{' '}
          today?
        </h2>
        <p className="text-sm text-stone-600">
          Tap a star to rate your visit to Lady’s Era
        </p>
      </div>

      {/* Interactive Stars */}
      <div
        role="radiogroup"
        aria-label="Overall experience rating"
        className="py-4 sm:py-6 flex items-center justify-center gap-1.5 sm:gap-3.5"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating
          const isSelected = star === value

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!value && star === 1) ? 0 : -1}
              onClick={() => onChange(star)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}: ${RATING_LABELS[star]}`}
              className={`relative min-w-[44px] min-h-[44px] sm:min-w-[54px] sm:min-h-[54px] p-2 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-95 flex items-center justify-center shrink-0 ${
                isSelected
                  ? 'bg-amber-50 scale-105 sm:scale-110 shadow-lg shadow-amber-500/15 border border-amber-300'
                  : 'hover:bg-stone-50 hover:scale-105 border border-transparent'
              }`}
            >
              <Star
                className={`w-8 h-8 sm:w-10 sm:h-10 transition-all duration-200 ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_3px_10px_rgba(251,191,36,0.45)]'
                    : 'text-stone-300 fill-transparent hover:text-stone-400'
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* Verbal Feedback Label */}
      <div className="h-6" aria-live="polite">
        {activeRating > 0 ? (
          <p className="text-sm font-semibold text-amber-800 animate-in fade-in duration-200">
            {RATING_LABELS[activeRating]}
          </p>
        ) : (
          <p className="text-xs text-stone-500">Select 1 to 5 stars</p>
        )}
      </div>
    </div>
  )
}
