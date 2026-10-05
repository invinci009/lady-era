'use client'

import { Heart, RotateCcw, Sparkles, CheckCircle2, MapPin, Share2, Phone } from 'lucide-react'
import { useClientConfig } from '@/config/client'

interface ThankYouCardProps {
  restaurantName: string
  slug?: string
}

export default function ThankYouCard({ restaurantName, slug }: ThankYouCardProps) {
  const { config, helplinePhone } = useClientConfig()
  const name = restaurantName || config.name || 'Restaurant'
  const activePhone = helplinePhone || config.contact?.phone || ''

  // Build directions URL from Google placeid in config or name + location
  const placeIdMatch = config.google?.reviewUrl?.match(/placeid=([^&]+)/)
  const placeId = (config.google as { placeId?: string })?.placeId || (placeIdMatch ? placeIdMatch[1] : null)
  const directionsUrl = placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${config.location?.address || config.location?.city || ''}`)}`

  const handleShare = async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const shareAddress = config.location?.address ? ` on ${config.location.address}` : ''
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} — Exclusive Women's Boutique Experience`,
          text: `Check out ${name}${shareAddress}!`,
          url,
        })
      } catch {}
    } else {
      navigator.clipboard.writeText(url)
      alert('Boutique link copied to clipboard!')
    }
  }

  return (
    <main className="relative z-10 w-full max-w-md mx-auto my-auto py-3 sm:py-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-[0_25px_60px_-15px_rgba(225,29,72,0.12),0_4px_20px_rgba(0,0,0,0.04)] text-center space-y-5 sm:space-y-6">
        {/* Celebration Heart Monogram */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/25 border-2 border-rose-200/60">
            <Heart className="w-10 h-10 fill-white text-white drop-shadow-sm animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-xs border border-stone-200 text-rose-600">
            <Sparkles className="w-4 h-4 fill-amber-400 text-rose-500" />
          </div>
        </div>

        {/* Title & Shukriya Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-[11px] font-bold text-rose-900 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Shukriya! धन्यवाद</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
            Thank you for shopping with us!
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xs mx-auto">
            Your honest thoughts help the styling and retail team at{' '}
            <strong className="text-stone-800 font-semibold">{name}</strong> curate
            the finest fashion and elevate your boutique experience.
          </p>
        </div>

        {/* Verified Feedback Badge Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-rose-50/60 to-stone-50 border border-rose-200/70 text-left space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Feedback Recorded Successfully</span>
            </div>
            <span className="text-[10px] font-semibold text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded-full border border-rose-300/40">
              Verified Shopper
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Our management and boutique styling team review every response to continually refine our fashion collections, fabric quality, and personalized boutique care. We look forward to seeing you again soon!
          </p>
        </div>

        {/* Customer Helpline & Quick Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Primary: Direct Call to Boutique */}
          {activePhone && (
            <a
              href={`tel:${activePhone.replace(/\s+/g, '')}`}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white font-bold shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 text-sm transition-all duration-200 cursor-pointer active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Call Boutique: {activePhone}</span>
            </a>
          )}

          {/* Secondary Buttons Row */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/90 text-stone-700 hover:text-stone-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Directions</span>
            </a>

            <button
              type="button"
              onClick={handleShare}
              className="h-11 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/90 text-stone-700 hover:text-stone-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Share Link</span>
            </button>
          </div>

          {/* Social Links: Instagram & Facebook */}
          {((config as { social?: { instagram?: string } })?.social?.instagram || (config as { social?: { facebook?: string } })?.social?.facebook) && (
            <div className="pt-2 space-y-2 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-rose-200/60" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-rose-900/80">
                  Follow {name}
                </span>
                <div className="h-px flex-1 bg-rose-200/60" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(config as { social?: { instagram?: string } })?.social?.instagram && (
                  <a
                    href={(config as { social?: { instagram?: string } }).social!.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 px-3 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20 transition-all duration-200 active:scale-95 group"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>Instagram</span>
                  </a>
                )}

                {(config as { social?: { facebook?: string } })?.social?.facebook && (
                  <a
                    href={(config as { social?: { facebook?: string } }).social!.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-95 group"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Subtle Footer Action: Submit another response */}
        {slug && (
          <div className="pt-2 border-t border-stone-100">
            <a
              href={`/r/${slug}?new=1`}
              className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-900 font-semibold transition-colors py-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Submit another response</span>
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
