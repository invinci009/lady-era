'use client'

import { CheckCircle2, MessageSquareHeart, Sparkles } from 'lucide-react'

interface QuizCompletedViewProps {
  restaurantName: string
  onContinueToDraft?: () => void
}

export default function QuizCompletedView({
  restaurantName,
  onContinueToDraft,
}: QuizCompletedViewProps) {
  return (
    <div className="w-full max-w-md mx-auto py-10 px-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-400">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md animate-bounce">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Thank you!
        </h2>
        <p className="text-sm text-slate-300 font-medium">
          We&apos;ve recorded your feedback for {restaurantName || "Lady's Era"}.
        </p>
        <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1">
          Your authentic feedback helps our team curate better collections and elevate your boutique shopping experience every day.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-3">
        <div className="flex items-center justify-center gap-2 text-rose-400 font-medium">
          <MessageSquareHeart className="w-4 h-4" />
          <span>Next: Optional Google Review Draft</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Based on your answers, an editable review draft will be prepared. Posting on Google is completely optional.
        </p>
      </div>

      {onContinueToDraft && (
        <button
          type="button"
          onClick={onContinueToDraft}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold shadow-lg shadow-rose-500/25 transition-all duration-200 cursor-pointer text-sm"
        >
          View Review Draft
        </button>
      )}
    </div>
  )
}
