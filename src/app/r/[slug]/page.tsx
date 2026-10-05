import QuizFlow, { type QuizAnswerValue } from '@/components/quiz/QuizFlow'
import FloatingSocialButtons from '@/components/quiz/FloatingSocialButtons'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { cookies } from 'next/headers'
import { getRestaurantConfig } from '@/config/loader'

interface PublicQuizPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ new?: string }>
}

export default async function PublicQuizPage({ params, searchParams }: PublicQuizPageProps) {
  const { slug } = await params
  const { new: forceNew } = await searchParams
  const config = getRestaurantConfig()

  // 1. Look up campaign by slug.
  // The backend is imported lazily inside try/catch: if the Firebase Admin
  // bundle cannot even be loaded in this runtime, `firestore` stays null
  // and we show a friendly "unavailable" screen instead of a generic 500.
  let backendUnavailable = false
  let firestore: typeof import('@/lib/firebase/firestore') | null = null
  try {
    firestore = await import('@/lib/firebase/firestore')
  } catch (err) {
    console.error('PublicQuizPage: backend import failed:', err)
    backendUnavailable = true
  }

  let campaign = firestore
    ? await firestore.getCampaignBySlug(slug).catch((err) => {
        console.error('PublicQuizPage: campaign lookup failed:', err)
        backendUnavailable = true
        return null
      })
    : null

  // Graceful fallback: If this slug was deleted or user enters custom slug, resolve to the active campaign
  if (firestore && !campaign && !backendUnavailable) {
    const campaigns = await firestore
      .getCampaigns()
      .catch((err) => {
        console.error('PublicQuizPage: campaigns fallback failed:', err)
        backendUnavailable = true
        return null
      })
    campaign = campaigns?.find((c) => c.active) || null
  }

  // Backend (Firestore) unreachable — friendly fallback instead of a 500
  if (backendUnavailable) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Feedback Temporarily Unavailable</h1>
          <p className="text-sm text-stone-500">
            We&apos;re having trouble reaching our servers right now. Please try again in a moment, or ask a team member at {config.name} for assistance.
          </p>
          {config.contact.phone && (
            <div className="pt-2">
              <a
                href={`tel:${config.contact.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
              >
                Call: {config.contact.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Fallback screen if no campaign exists at all
  if (!campaign) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">QR Code Not Found</h1>
          <p className="text-sm text-stone-500">
            This QR code is not valid or has been removed. Please ask a store team member at {config.name} for assistance.
          </p>
          {config.contact.phone && (
            <div className="pt-2">
              <a
                href={`tel:${config.contact.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
              >
                Call: {config.contact.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Inactive campaign fallback screen
  if (!campaign.active) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Survey Temporarily Inactive</h1>
          <p className="text-sm text-stone-500">
            This feedback code is currently paused by {config.name}. Please check with our store staff.
          </p>
          {config.contact.phone && (
            <div className="pt-2">
              <a
                href={`tel:${config.contact.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
              >
                Call: {config.contact.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  const googleReviewUrl = campaign.googleReviewUrlOverride || config.google.reviewUrl

  // 2. Fetch menu items for the ordered items step (empty list if backend fails)
  const menuItems = firestore
    ? await firestore.getMenuItems().catch((err) => {
        console.error('PublicQuizPage: menu items lookup failed:', err)
        return []
      })
    : []

  // 3. Resume existing session if cookie is present and ?new=1 is NOT passed
  let existingSessionId: string | null = null
  let existingStatus: string | null = null
  const existingAnswers: Record<string, unknown> = {}
  let existingDraftText: string | null = null

  if (firestore && forceNew !== '1') {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('rp_session')
    if (sessionCookie?.value) {
      // Session resume is best-effort: if the backend fails, start fresh
      // instead of crashing the page.
      try {
        const session = await firestore.getSession(sessionCookie.value)

        if (session && session.campaignId === campaign.id) {
          existingSessionId = session.id
          existingStatus = session.status

          const answers = await firestore.getSessionAnswers(session.id)
          for (const a of answers) {
            existingAnswers[a.questionKey] = a.value
          }

          if (session.status === 'completed') {
            const draft = await firestore.getReviewDraft(session.id)
            if (draft) {
              existingDraftText = draft.finalText || draft.originalText || null
            }
          }
        }
      } catch (err) {
        console.error('PublicQuizPage: session resume failed, starting fresh:', err)
      }
    }
  }

  const restaurantName = config.name
  const welcomeText = config.welcomeMessage[config.settings.defaultLanguage] || config.welcomeMessage['en'] || ''

  return (
    <div className="min-h-screen min-h-[100dvh] min-h-safe-screen bg-[#fffbfb] bg-gradient-to-b from-[#fffbfb] via-[#fff5f7] to-[#fef2f4] text-stone-900 flex flex-col justify-between px-3 sm:px-6 pt-safe pb-safe py-3 sm:py-6 selection:bg-rose-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Ambient luxury rose and soft blush glows */}
      <div className="fixed -top-12 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-pink-300/15 rounded-full blur-3xl pointer-events-none" />

      {/* Prominent Floating Social Side Buttons (Instagram & Facebook) */}
      <FloatingSocialButtons />

      {/* Header Badge */}
      <header className="relative z-10 flex items-center justify-center pt-1 sm:pt-2">
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/95 border border-rose-200/80 shadow-xs backdrop-blur-md">
          <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-rose-600 shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-bold text-rose-950 tracking-wide">
            {restaurantName} • Shopper Experience
          </span>
        </div>
      </header>

      {/* Quiz Flow Orchestration */}
      <QuizFlow
        slug={campaign.slug}
        restaurantName={restaurantName}
        logoUrl={config.branding.logoUrl}
        primaryColor={config.branding.primaryColor}
        welcomeMessage={welcomeText}
        googleReviewUrl={googleReviewUrl}
        initialSessionId={existingSessionId}
        initialStatus={existingStatus}
        initialAnswers={existingAnswers as Record<string, QuizAnswerValue>}
        initialDraftText={existingDraftText}
        menuItems={menuItems}
      />

      {/* Mobile-Friendly Footer */}
      <footer className="relative z-10 text-center py-2 sm:py-3 text-[10px] sm:text-[11px] text-stone-500 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
        <div className="flex items-center gap-1.5">
          <span>Powered by</span>
          <span className="font-bold text-stone-700">ReviewPulse</span>
          <span>•</span>
          <span className="font-semibold text-stone-800">{restaurantName}</span>
        </div>
        {config.contact.phone && (
          <div className="flex items-center gap-1 text-rose-900 font-medium">
            <span>•</span>
            <a href={`tel:${config.contact.phone}`} className="hover:underline flex items-center gap-1">
              <span>Helpline:</span>
              <strong>{config.contact.phone}</strong>
            </a>
          </div>
        )}
        {config.social && (config.social.instagram || config.social.facebook) && (
          <div className="flex items-center gap-2 pt-0.5 sm:pt-0">
            <span className="hidden sm:inline">•</span>
            {config.social.instagram && (
              <a
                href={config.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-pink-700 hover:text-pink-800 font-semibold transition-colors"
                title="Follow on Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>Instagram</span>
              </a>
            )}
            {config.social.facebook && (
              <a
                href={config.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-semibold transition-colors"
                title="Follow on Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </a>
            )}
          </div>
        )}
      </footer>
    </div>
  )
}
