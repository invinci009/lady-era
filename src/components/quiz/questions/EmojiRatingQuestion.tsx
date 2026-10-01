'use client'

import { Sparkles } from 'lucide-react'

interface EmojiRatingQuestionProps {
  value: number | null
  onChange: (value: number) => void
}

const EMOJI_OPTIONS = [
  { rating: 1, emoji: '😞', label: 'Bad' },
  { rating: 2, emoji: '😕', label: 'Fair' },
  { rating: 3, emoji: '😐', label: 'Okay' },
  { rating: 4, emoji: '🙂', label: 'Good' },
  { rating: 5, emoji: '😍', label: 'Amazing!' },
]

export default function EmojiRatingQuestion({ value, onChange }: EmojiRatingQuestionProps) {
  const handleKeyDown = (e: React.KeyboardEvent, rating: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(5, (value ?? rating) + 1)
      onChange(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(1, (value ?? rating) - 1)
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-900">
            Question 2 of 6
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[11px] text-amber-800 font-medium">Required</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          How did you find the{' '}
          <span className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            food &amp; flavors
          </span>
          ?
        </h2>
        <p className="text-sm text-stone-600">
          Taste, aroma, spices, and tenderness
        </p>
      </div>

      {/* 5 Emoji Face Buttons */}
      <div
        role="radiogroup"
        aria-label="Food and drink rating"
        className="py-4 sm:py-6 flex items-center justify-center gap-1 sm:gap-3.5 flex-nowrap overflow-x-auto no-scrollbar"
      >
        {EMOJI_OPTIONS.map((opt) => {
          const isSelected = value === opt.rating

          return (
            <button
              key={opt.rating}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!value && opt.rating === 1) ? 0 : -1}
              onClick={() => onChange(opt.rating)}
              onKeyDown={(e) => handleKeyDown(e, opt.rating)}
              aria-label={`${opt.label} (${opt.rating} of 5)`}
              className={`group flex flex-col items-center justify-center w-[58px] h-20 sm:w-18 sm:h-24 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0 ${
                isSelected
                  ? 'border-amber-500 bg-amber-50 scale-105 sm:scale-110 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/40'
                  : 'border-stone-200 bg-stone-50/60 hover:bg-white hover:border-amber-300'
              }`}
            >
              <span className="text-2xl sm:text-4xl transition-transform group-hover:scale-115 group-active:scale-95 duration-200" aria-hidden="true">
                {opt.emoji}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-semibold mt-1 sm:mt-2 transition-colors truncate px-1 ${
                  isSelected ? 'text-amber-900 font-bold' : 'text-stone-500 group-hover:text-stone-800'
                }`}
              >
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="h-6" aria-live="polite">
        {value ? (
          <p className="text-sm font-semibold text-amber-800 animate-in fade-in duration-200">
            {EMOJI_OPTIONS.find((o) => o.rating === value)?.label}
          </p>
        ) : (
          <p className="text-xs text-stone-500">Select how satisfied you were</p>
        )}
      </div>
    </div>
  )
}
