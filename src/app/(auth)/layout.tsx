import React from 'react'
import { getBrandingTokens, getRestaurantName } from '@/config/branding'
import { getRestaurantConfig } from '@/config/loader'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const config = getRestaurantConfig()
  const branding = getBrandingTokens(config)
  const restaurantName = getRestaurantName(config)

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex items-center justify-center p-4 pt-safe pb-safe bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100">
      {/* Subtle background ambient glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: `${branding.primary}15` }}
      />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black shadow-lg mb-3 overflow-hidden border border-rose-500/30"
            style={{ boxShadow: `0 10px 15px -3px ${branding.primary}40` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logoUrl || '/ladys-era-logo.png'}
              alt={restaurantName}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{restaurantName}</h1>
          <p className="text-sm italic mt-1" style={{ color: branding.primary }}>A place for Fashion Freaks</p>
        </div>
        {children}
      </div>
    </div>
  )
}
