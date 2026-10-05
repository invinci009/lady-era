'use client'

import { ArrowLeft, ShoppingBag, Phone } from 'lucide-react'
import { useClientConfig } from '@/config/client'

interface QuizProgressHeaderProps {
  restaurantName: string
  logoUrl?: string | null
  currentStep: number
  totalSteps: number
  onBack: () => void
  canGoBack: boolean
}

export default function QuizProgressHeader({
  restaurantName,
  logoUrl,
  currentStep,
  totalSteps,
  onBack,
  canGoBack,
}: QuizProgressHeaderProps) {
  const { config, helplinePhone } = useClientConfig()
  const progressPercent = Math.round(((currentStep) / totalSteps) * 100)
  const displayName = restaurantName || config.name || "Lady's Era"
  const displaySubtext = config.hindiName || config.cuisine || "Women's Fashion Boutique"
  const activePhone = helplinePhone || config.contact?.phone || ''

  return (
    <div className="w-full max-w-lg mx-auto space-y-3">
      {/* Top row with restaurant info & back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Previous question"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 shadow-sm border border-rose-300">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </div>
            <div>
              <span className="text-sm font-bold text-stone-900 truncate block max-w-[180px] sm:max-w-xs">
                {displayName}
              </span>
              <span className="text-[10px] text-rose-800 font-semibold block">{displaySubtext}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activePhone && (
            <a
              href={`tel:${activePhone.replace(/\s+/g, '')}`}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300 transition-colors shadow-2xs"
              title={`Helpline: ${activePhone}`}
            >
              <Phone className="w-3 h-3 text-rose-700" />
              <span className="hidden sm:inline">Call:</span>
              <span>{activePhone}</span>
            </a>
          )}
          <div className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
            Step <span className="text-rose-800 font-bold">{currentStep}</span> of {totalSteps}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-stone-200/90 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 rounded-full transition-all duration-300 ease-out shadow-xs"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
