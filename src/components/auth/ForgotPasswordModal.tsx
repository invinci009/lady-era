'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertCircle, CheckCircle2, Loader2, MailOpen } from 'lucide-react'
import { useClientConfig } from '@/config/client'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  initialEmail?: string
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { branding } = useClientConfig()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.trim() }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Failed to send reset link.')
        setLoading(false)
        return
      }

      setSuccess(
        data.message ||
          'Password reset link sent! Check your email inbox (and Spam folder) and open the link to set a new password.'
      )
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MailOpen className="w-5 h-5" style={{ color: branding.primary }} />
            Forgot Password
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter your admin email and we&apos;ll send you a secure reset link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="forgot-email" className="text-xs font-semibold text-slate-300">
              Admin Email
            </Label>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 h-10 rounded-xl text-sm"
              required
              disabled={loading || Boolean(success)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Close
            </Button>
            {!success && (
              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex-1 text-white"
                style={{ backgroundColor: branding.primary }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
