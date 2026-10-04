'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react'
import { useClientConfig } from '@/config/client'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  initialEmail?: string
  onPasswordChanged?: (newPassword: string, email?: string) => void
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
  onPasswordChanged,
}: ChangePasswordModalProps) {
  const [email, setEmail] = useState(initialEmail)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { branding } = useClientConfig()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to change password.')
        setLoading(false)
        return
      }

      setSuccess('Password changed successfully!')
      onPasswordChanged?.(newPassword, email)

      // Close modal after delay
      setTimeout(() => {
        onClose()
        setSuccess(null)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }, 2000)
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
            <KeyRound className="w-5 h-5" style={{ color: branding.primary }} />
            Change Password
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter your current password and choose a new one.
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
            <Label htmlFor="change-email" className="text-xs font-semibold text-slate-300">
              Email
            </Label>
            <Input
              id="change-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 h-10 rounded-xl text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-xs font-semibold text-slate-300">
              Current Password
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 h-10 rounded-xl text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs font-semibold text-slate-300">
              New Password
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 h-10 rounded-xl text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-300">
              Confirm New Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 h-10 rounded-xl text-sm"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 text-white"
              style={{ backgroundColor: branding.primary }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
