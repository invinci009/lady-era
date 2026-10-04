'use client'

import { usePwa } from './PwaProvider'
import { WifiOff, Wifi } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
  const { isOnline } = usePwa()
  const [showReconnected, setShowReconnected] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch: server renders null, so first client
  // render must also be null. Only show banners after mount.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detect offline -> online transitions in effect, not during render
  const [prevIsOnline, setPrevIsOnline] = useState(isOnline)
  useEffect(() => {
    if (prevIsOnline !== isOnline) {
      setPrevIsOnline(isOnline)
      if (!prevIsOnline && isOnline) {
        setShowReconnected(true)
      }
    }
  }, [isOnline, prevIsOnline])

  // Auto-hide the reconnected banner after a few seconds
  useEffect(() => {
    if (!showReconnected) return
    const timer = setTimeout(() => {
      setShowReconnected(false)
    }, 3500)
    return () => clearTimeout(timer)
  }, [showReconnected])

  if (!mounted) return null

  if (!isOnline) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-rose-950/90 border border-rose-500/40 text-rose-200 text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
        <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
        <span>You are offline. Changes will sync when reconnected.</span>
      </div>
    )
  }

  if (showReconnected) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
        <Wifi className="w-4 h-4 text-emerald-400" />
        <span>Back online! Reconnected to ReviewPulse.</span>
      </div>
    )
  }

  return null
}
