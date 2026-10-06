'use client'

import { useState } from 'react'
import QuizProgressHeader from './QuizProgressHeader'
import QuizNavigationControls from './QuizNavigationControls'
import ReviewDraftCard from './ReviewDraftCard'
import PrivateFeedbackModal from './PrivateFeedbackModal'
import ThankYouCard from './ThankYouCard'
import OfflineBanner from './OfflineBanner'
import StarRatingQuestion from './questions/StarRatingQuestion'
import EmojiRatingQuestion from './questions/EmojiRatingQuestion'
import ServiceRatingQuestion from './questions/ServiceRatingQuestion'
import ComplimentsQuestion from './questions/ComplimentsQuestion'
import OrderedItemsQuestion, { type MenuItemData } from './questions/OrderedItemsQuestion'
import ContactInfoQuestion, { type ContactInfoValue } from './questions/ContactInfoQuestion'
import { trackClientEvent } from '@/lib/client/telemetry'
import { useClientConfig } from '@/config/client'
import { Clock, ShieldCheck, ArrowRight, ShoppingBag, Loader2, Star, MapPin, Sparkles, MessageCircle, Phone, Copy, Check } from 'lucide-react'

interface QuizFlowProps {
  slug: string
  restaurantName: string
  logoUrl?: string | null
  primaryColor?: string | null
  welcomeMessage?: string
  googleReviewUrl?: string | null
  initialSessionId?: string | null
  initialStatus?: string | null
  initialAnswers?: Record<string, QuizAnswerValue>
  initialDraftText?: string | null
  menuItems: MenuItemData[]
}

type QuestionKey = 'overall_rating' | 'food_rating' | 'service_rating' | 'liked' | 'ordered' | 'customer_contact'

export type QuizAnswerValue = number | string | string[] | ContactInfoValue | Record<string, unknown> | null

export default function QuizFlow({
  slug,
  restaurantName,
  logoUrl,
  welcomeMessage = "Thanks for dining with us! We'd love to hear about your experience today.",
  googleReviewUrl = null,
  initialSessionId = null,
  initialStatus = null,
  initialAnswers = {},
  initialDraftText = null,
  menuItems = [],
}: QuizFlowProps) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
  const isInitiallyCompleted = initialStatus === 'completed'
  const isInitiallyInProgress = initialStatus === 'in_progress'

  const [view, setView] = useState<'landing' | 'quiz' | 'draft' | 'thank_you'>(
    isInitiallyCompleted ? 'draft' : isInitiallyInProgress ? 'quiz' : 'landing'
  )

  const [isPrivateFeedbackOpen, setIsPrivateFeedbackOpen] = useState(false)
  const [hasSyncError, setHasSyncError] = useState(false)
  const [pendingSync, setPendingSync] = useState<{ key: string; value: QuizAnswerValue } | null>(null)
  const [phoneCopied, setPhoneCopied] = useState(false)

  const { config, helplinePhone } = useClientConfig()
  const displayPhone = helplinePhone || config.contact?.phone || ''

  const formatPhoneNumber = (num: string): string => {
    const cleaned = num.trim()
    if (cleaned.startsWith('+91') && cleaned.length === 13) {
      return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`
    }
    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }
    return cleaned
  }

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.clipboard && displayPhone) {
      navigator.clipboard.writeText(displayPhone)
      setPhoneCopied(true)
      setTimeout(() => setPhoneCopied(false), 2500)
    }
  }

  // Active question keys (includes customer_contact for phone input)
  const questionKeys: QuestionKey[] = [
    'overall_rating',
    'food_rating',
    'service_rating',
    'liked',
    ...(menuItems.length > 0 ? (['ordered'] as QuestionKey[]) : []),
    'customer_contact',
  ]

  // Find first unanswered question if resuming
  const getInitialStepIndex = () => {
    for (let i = 0; i < questionKeys.length; i++) {
      const key = questionKeys[i]
      if (initialAnswers[key] === undefined || initialAnswers[key] === null) {
        return i
      }
    }
    return 0
  }

  const [stepIndex, setStepIndex] = useState(getInitialStepIndex())
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({
    overall_rating: initialAnswers.overall_rating ?? null,
    food_rating: initialAnswers.food_rating ?? null,
    service_rating: initialAnswers.service_rating ?? null,
    liked: initialAnswers.liked ?? [],
    ordered: initialAnswers.ordered ?? [],
    customer_contact: initialAnswers.customer_contact ?? {
      name: initialAnswers.customer_name ?? '',
      phone: initialAnswers.customer_phone ?? '',
      optIn: true,
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  // Save an individual answer via API
  const persistAnswer = async (sId: string, key: string, value: QuizAnswerValue) => {
    try {
      const res = await fetch(`/api/public/sessions/${sId}/answers/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) {
        setHasSyncError(true)
        setPendingSync({ key, value })
      } else {
        setHasSyncError(false)
        setPendingSync(null)
      }
    } catch (err) {
      console.warn('Failed to save answer:', err)
      setHasSyncError(true)
      setPendingSync({ key, value })
    }
  }

  const handleRetry = async () => {
    if (!sessionId) return
    setHasSyncError(false)
    if (pendingSync) {
      await persistAnswer(sessionId, pendingSync.key, pendingSync.value)
    }
  }

  // Handle starting the quiz
  const handleStart = async () => {
    try {
      let activeSessionId = sessionId

      // 1. Create or ensure session
      if (!activeSessionId) {
        setIsStarting(true)
        const res = await fetch('/api/public/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        })
        const data = await res.json()
        if (data?.session_id) {
          activeSessionId = data.session_id
          setSessionId(activeSessionId)
        }
      }

      // 2. Immediately transition to quiz view for instant UI responsiveness
      setView('quiz')

      if (activeSessionId) {
        fetch(`/api/public/sessions/${activeSessionId}/start`, { method: 'POST' }).catch(console.warn)
        trackClientEvent(activeSessionId, 'QUIZ_STARTED')
      }
    } catch (error) {
      console.error('Error starting quiz:', error)
      setView('quiz')
    } finally {
      setIsStarting(false)
    }
  }

  // Set an answer for a question with auto-save
  const handleSetAnswer = (key: QuestionKey, value: QuizAnswerValue, autoAdvance = false) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))

    if (sessionId) {
      persistAnswer(sessionId, key, value)
      // When saving customer_contact, also denormalize phone and name for direct queries
      if (key === 'customer_contact' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (typeof value.phone === 'string' && value.phone) persistAnswer(sessionId, 'customer_phone', value.phone)
        if (typeof value.name === 'string' && value.name) persistAnswer(sessionId, 'customer_name', value.name)
      }
    }

    if (autoAdvance && stepIndex < questionKeys.length - 1) {
      setTimeout(() => {
        setStepIndex((prev) => Math.min(prev + 1, questionKeys.length - 1))
      }, 350)
    }
  }

  // Next / Submit action
  const handleNext = async () => {
    const isLast = stepIndex === questionKeys.length - 1

    if (isLast) {
      await handleSubmit()
    } else {
      setStepIndex((prev) => prev + 1)
    }
  }

  const handleSkip = () => {
    if (stepIndex < questionKeys.length - 1) {
      setStepIndex((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1)
    }
  }

  // Submit quiz completion -> proceeds directly to Draft screen
  const handleSubmit = async () => {
    if (!sessionId) return
    setIsSubmitting(true)

    try {
      const contact = answers.customer_contact
      const contactObj =
        typeof contact === 'object' && contact !== null && !Array.isArray(contact) ? contact : null
      const answersToSubmit = {
        ...answers,
        customer_phone: (contactObj && typeof contactObj.phone === 'string' ? contactObj.phone : '') || '',
        customer_name: (contactObj && typeof contactObj.name === 'string' ? contactObj.name : '') || '',
      }

      const res = await fetch(`/api/public/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ answers: answersToSubmit }),
      })

      if (res.ok) {
        trackClientEvent(sessionId, 'QUIZ_COMPLETED')
        setView('draft')
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.warn('Submission response:', errorData)

        // If session is already completed or successful, proceed to draft
        if (errorData?.status === 'completed' || errorData?.message?.includes('already completed')) {
          setView('draft')
          return
        }

        if (errorData?.missing_questions?.[0]) {
          const missingKey = errorData.missing_questions[0]
          const targetIdx = questionKeys.indexOf(missingKey as QuestionKey)
          if (targetIdx !== -1) setStepIndex(targetIdx)
        } else {
          // Resilience fallback: proceed to draft
          setView('draft')
        }
      }
    } catch (err) {
      console.error('Submit error:', err)
      setView('draft')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==========================================
  // VIEW 1: LANDING SCREEN (WHITE CLASSY LOOK)
  // ==========================================
  if (view === 'landing') {
    return (
      <>
        <OfflineBanner hasSyncError={hasSyncError} onRetry={handleRetry} />
        <main className="relative z-10 w-full max-w-md mx-auto my-auto py-2 sm:py-6">
          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-rose-100 shadow-[0_20px_60px_-15px_rgba(225,29,72,0.1),0_4px_20px_rgba(0,0,0,0.03)] space-y-5 sm:space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            {/* Crest / Monogram Icon */}
            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-black text-white flex items-center justify-center shadow-xl shadow-rose-600/25 overflow-hidden border-2 border-rose-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl || '/ladys-era-logo.png'} alt={restaurantName} className="w-full h-full object-contain" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-xs border border-stone-200 text-rose-600">
                <Sparkles className="w-4 h-4 fill-amber-400" />
              </div>
            </div>

            {/* Restaurant Name & Subtitle */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                {restaurantName || config.name || "Lady's Era"}
              </h1>
              <p className="text-sm font-semibold italic text-rose-700">
                A place for Fashion Freaks
              </p>
              <div className="pt-1 flex items-center justify-center gap-2 text-xs text-stone-500">
                <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 4.8 • {config.tagline || 'Special Dining'}
                </span>
                <span>•</span>
                <span>
                  {config.location?.area
                    ? `${config.location.area}, ${config.location.city || 'Patna'}`
                    : config.location?.city || 'Patna'}
                </span>
              </div>
            </div>

            {/* Prominent Customer Contact Box (Main Phone Display for Customers) */}
            {displayPhone && (
              <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50/70 to-rose-50 border border-rose-200 shadow-sm space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-rose-950 uppercase flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-rose-700 animate-pulse" />
                    Boutique Helpline &amp; WhatsApp
                  </span>
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100/90 px-2 py-0.5 rounded-full border border-rose-300/70">
                    Customer Care
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-white/95 p-2 sm:p-2.5 rounded-xl border border-rose-200 shadow-xs">
                  <a
                    href={`tel:${displayPhone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-2.5 text-stone-900 hover:text-rose-800 transition-colors flex-1"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black tracking-wide text-stone-900 block leading-tight">
                        {formatPhoneNumber(displayPhone)}
                      </span>
                      <span className="text-[10px] text-rose-700 font-semibold block">
                        Tap to call boutique directly
                      </span>
                    </div>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-stone-200"
                    title="Copy number"
                  >
                    {phoneCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                {/* Other Contact Numbers if provided in config */}
                {config.contact?.otherPhones && config.contact.otherPhones.length > 0 && (
                  <div className="flex items-center justify-between text-[10px] text-stone-600 px-1 pt-0.5">
                    <span className="text-stone-500">Other Lines:</span>
                    <div className="flex items-center gap-2">
                      {config.contact.otherPhones.map((ph, idx) => (
                        <span key={ph} className="flex items-center gap-2">
                          {idx > 0 && <span>•</span>}
                          <a
                            href={`tel:${ph.replace(/\s+/g, '')}`}
                            className="hover:text-amber-800 font-semibold hover:underline"
                          >
                            {ph}
                          </a>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Address Pill */}
            {(config.location?.address || config.location?.city) && (
              <div className="p-3 rounded-2xl bg-stone-50/90 border border-stone-200/90 text-left space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>{config.location.address || `${restaurantName}, ${config.location.city}`}</span>
                </div>
                {(config.location.landmark || config.location.area || config.location.city || config.location.pincode) && (
                  <p className="text-[11px] text-stone-600 pl-5 leading-relaxed">
                    {[
                      config.location.landmark,
                      config.location.area,
                      config.location.city,
                      config.location.state,
                      config.location.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Welcome Message */}
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              {welcomeMessage}
            </p>

            {/* Features Row */}
            <div className="flex items-center justify-center gap-4 py-2.5 border-y border-stone-100 text-xs text-stone-600">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium">Takes ~30 sec</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-stone-300" />
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium">5 Quick Questions</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-stone-300" />
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">Optional</span>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-1 space-y-3">
              <button
                type="button"
                onClick={handleStart}
                disabled={isStarting}
                className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white font-bold shadow-lg shadow-rose-600/25 group transition-all duration-200 cursor-pointer text-sm sm:text-base active:scale-[0.98] disabled:opacity-80"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Share Your Feedback
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-stone-400">
                Your authentic feedback helps our styling team curate better collections for you.
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }

  // ==========================================
  // VIEW 2: DRAFT SCREEN (WHITE CLASSY LOOK)
  // ==========================================
  if (view === 'draft' && sessionId) {
    return (
      <>
        <OfflineBanner hasSyncError={hasSyncError} onRetry={handleRetry} />
        <ReviewDraftCard
          sessionId={sessionId}
          slug={slug}
          restaurantName={restaurantName}
          googleReviewUrl={googleReviewUrl}
          initialDraftText={initialDraftText || ''}
          onOpenPrivateFeedback={() => setIsPrivateFeedbackOpen(true)}
          onDone={() => setView('thank_you')}
        />

        <PrivateFeedbackModal
          isOpen={isPrivateFeedbackOpen}
          onClose={() => setIsPrivateFeedbackOpen(false)}
          sessionId={sessionId}
          restaurantName={restaurantName}
        />
      </>
    )
  }

  // ==========================================
  // VIEW 3: THANK YOU SCREEN (WHITE CLASSY LOOK)
  // ==========================================
  if (view === 'thank_you') {
    return (
      <>
        <OfflineBanner hasSyncError={hasSyncError} onRetry={handleRetry} />
        <ThankYouCard restaurantName={restaurantName} slug={slug} />
        <PrivateFeedbackModal
          isOpen={isPrivateFeedbackOpen}
          onClose={() => setIsPrivateFeedbackOpen(false)}
          sessionId={sessionId || ''}
          restaurantName={restaurantName}
        />
      </>
    )
  }

  // ==========================================
  // VIEW 4: ACTIVE QUIZ STEPS (WHITE CLASSY LOOK)
  // ==========================================
  const currentKey = questionKeys[stepIndex]
  const isCurrentOptional =
    currentKey === 'liked' || currentKey === 'ordered' || currentKey === 'customer_contact'
  const isLastQuestion = stepIndex === questionKeys.length - 1

  let canAdvance = true
  if (currentKey === 'overall_rating') canAdvance = Boolean(answers.overall_rating)
  if (currentKey === 'food_rating') canAdvance = Boolean(answers.food_rating)
  if (currentKey === 'service_rating') canAdvance = Boolean(answers.service_rating)

  return (
    <>
      <OfflineBanner hasSyncError={hasSyncError} onRetry={handleRetry} />
      <div className="relative z-10 w-full max-w-lg mx-auto py-2 sm:py-6 px-1 sm:px-0 flex flex-col justify-between min-h-[460px] sm:min-h-[580px]">
        <QuizProgressHeader
          restaurantName={restaurantName}
          logoUrl={logoUrl}
          currentStep={stepIndex + 1}
          totalSteps={questionKeys.length}
          onBack={handleBack}
          canGoBack={stepIndex > 0}
        />

        <div className="my-auto py-3 sm:py-6">
          <div className="relative p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-stone-200/90 shadow-[0_20px_50px_-15px_rgba(180,83,9,0.08),0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Subtle warm accent glows */}
            <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {currentKey === 'overall_rating' && (
                <StarRatingQuestion
                  value={answers.overall_rating as number | null}
                  onChange={(val) => handleSetAnswer('overall_rating', val, true)}
                />
              )}

              {currentKey === 'food_rating' && (
                <EmojiRatingQuestion
                  value={answers.food_rating as number | null}
                  onChange={(val) => handleSetAnswer('food_rating', val, true)}
                />
              )}

              {currentKey === 'service_rating' && (
                <ServiceRatingQuestion
                  value={answers.service_rating as number | null}
                  onChange={(val) => handleSetAnswer('service_rating', val, true)}
                />
              )}

              {currentKey === 'liked' && (
                <ComplimentsQuestion
                  value={(answers.liked as string[] | null) || []}
                  onChange={(val) => handleSetAnswer('liked', val, false)}
                />
              )}

              {currentKey === 'ordered' && (
                <OrderedItemsQuestion
                  menuItems={menuItems}
                  value={(answers.ordered as string[] | null) || []}
                  onChange={(val) => handleSetAnswer('ordered', val, false)}
                />
              )}

              {currentKey === 'customer_contact' && (
                <ContactInfoQuestion
                  value={
                    (answers.customer_contact as ContactInfoValue) || {
                      name: '',
                      phone: '',
                      optIn: true,
                    }
                  }
                  onChange={(val: ContactInfoValue) => handleSetAnswer('customer_contact', val, false)}
                  restaurantName={restaurantName}
                />
              )}
            </div>
          </div>

          <QuizNavigationControls
            isOptional={isCurrentOptional}
            isLastQuestion={isLastQuestion}
            canAdvance={canAdvance}
            isSubmitting={isSubmitting}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        </div>
      </div>
    </>
  )
}
