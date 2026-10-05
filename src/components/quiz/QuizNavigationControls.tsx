'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

interface QuizNavigationControlsProps {
  isOptional: boolean
  isLastQuestion: boolean
  canAdvance: boolean
  isSubmitting: boolean
  onNext: () => void
  onSkip?: () => void
}

export default function QuizNavigationControls({
  isOptional,
  isLastQuestion,
  canAdvance,
  isSubmitting,
  onNext,
  onSkip,
}: QuizNavigationControlsProps) {
  return (
    <div className="w-full max-w-lg mx-auto pt-4 sm:pt-6 flex items-center justify-between gap-3">
      {/* Skip Button for optional questions */}
      <div>
        {isOptional && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-900 py-2.5 px-3 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        )}
      </div>

      {/* Primary Next / Finish Button */}
      <Button
        type="button"
        onClick={onNext}
        disabled={!canAdvance || isSubmitting}
        className="ml-auto bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white font-bold h-12 px-5 sm:px-7 rounded-xl shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 cursor-pointer min-w-[130px] sm:min-w-[150px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Finishing...
          </>
        ) : isLastQuestion ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Review Draft
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </>
        )}
      </Button>
    </div>
  )
}
