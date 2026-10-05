'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ShoppingBag, ArrowRight, Loader2, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useClientConfig } from '@/config/client'

export default function OnboardingWizard() {
  const router = useRouter()
  const { config, restaurantName, helplinePhone } = useClientConfig()
  const [step, setStep] = useState(1)
  const [name, setName] = useState(restaurantName || config.name || "Lady’s Era")
  const [location, setLocation] = useState(
    config.location?.address
      ? [config.location.address, config.location.area, config.location.city, config.location.state, config.location.pincode]
          .filter(Boolean)
          .join(', ')
      : 'Arsh Market, Anisabad-Khagaul Road, Phulwarisharif, Patna'
  )
  const [phone, setPhone] = useState(helplinePhone || config.contact?.phone || '+917484870260')
  const [googleReviewUrl, setGoogleReviewUrl] = useState(config.google?.reviewUrl || 'https://search.google.com/local/writereview?placeid=ChIJu6Jvojep8jkROH9r22RNecc')
  const [welcomeMessage, setWelcomeMessage] = useState(
    config.welcomeMessage?.[config.settings?.defaultLanguage || 'en'] ||
      "Thanks for visiting Lady’s Era! We'd love to hear about your experience today."
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFinish = async () => {
    if (!name.trim()) {
      setError('Please enter your boutique store name')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: 'boutique',
          location: location.trim() || undefined,
          phone: phone.trim() || undefined,
          google_review_url: googleReviewUrl.trim() || null,
          welcome_message: { en: welcomeMessage.trim() },
        }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to complete setup')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 mb-2">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
          Set up your boutique store
        </h1>
        <p className="text-sm text-slate-400">
          Takes less than 2 minutes. Start collecting shopper feedback today.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              {step === 1 ? 'Step 1: Boutique Details' : 'Step 2: Shopper Experience'}
            </CardTitle>
            <span className="text-xs font-semibold text-slate-400">Step {step} of 2</span>
          </div>
          <CardDescription className="text-xs text-slate-400">
            {step === 1
              ? 'Tell us your boutique store name and Google review link'
              : 'Customize the welcome greeting seen by shoppers'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-slate-300">
                  Boutique / Store Name <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Lady’s Era"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-slate-950/60 border-slate-800 text-white h-10 focus:border-rose-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-medium text-slate-300">
                  Location / Address (optional)
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. Arsh Market, Phulwarisharif, Patna"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-slate-950/60 border-slate-800 text-white h-10 focus:border-rose-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleUrl" className="text-xs font-medium text-slate-300">
                  Google Review URL (optional)
                </Label>
                <Input
                  id="googleUrl"
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  className="bg-slate-950/60 border-slate-800 text-white h-10 focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-400">
                  Found on your Google Business Profile &gt; &quot;Ask for reviews&quot;. Can be added later.
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="welcome" className="text-xs font-medium text-slate-300">
                  Welcome Greeting for Shoppers
                </Label>
                <textarea
                  id="welcome"
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-400">
                  Shown on the QR landing screen before the 5-question boutique quiz.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Google Compliance Built-in</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  ReviewPulse automatically ensures equal review access and no rating steering, protecting your Google Business profile from penalties.
                </p>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-2 pb-6 border-t border-slate-800">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <Button
              type="button"
              onClick={() => {
                if (!name.trim()) {
                  setError('Please enter your boutique store name')
                  return
                }
                setError(null)
                setStep(2)
              }}
              className="bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-semibold h-10 px-5 rounded-xl shadow-md shadow-rose-500/20 cursor-pointer"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-semibold h-10 px-6 rounded-xl shadow-md shadow-rose-500/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Setting up boutique...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Launch Boutique Store
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
