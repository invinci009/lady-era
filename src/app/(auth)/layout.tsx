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
        {/* Signboard-style header panel */}
        <div className="text-center mb-8">
          <div
            className="mx-auto rounded-2xl px-6 py-5 mb-1 text-center"
            style={{
              background: 'linear-gradient(145deg, #0a0a0a 0%, #1a0a0a 100%)',
              boxShadow: `0 0 40px ${branding.primary}30, 0 20px 40px rgba(0,0,0,0.6)`,
              border: `1.5px solid ${branding.primary}50`,
            }}
          >
            {/* LE Logo */}
            <div
              className="w-20 h-20 mx-auto mb-3 overflow-hidden"
              style={{ filter: `drop-shadow(0 0 12px ${branding.primary}80)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.logoUrl || '/ladys-era-logo.png'}
                alt={restaurantName}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Hindi Name with ® */}
            <h1
              className="text-4xl font-black leading-tight tracking-wide"
              style={{
                color: branding.primary,
                fontFamily: "'Noto Sans Devanagari', sans-serif",
                textShadow: `0 0 20px ${branding.primary}60, 0 2px 8px rgba(0,0,0,0.8)`,
              }}
            >
              Lady&apos;s Era<sup className="text-lg align-super ml-0.5">®</sup>
            </h1>

            {/* Golden tagline */}
            <p
              className="mt-2 text-base font-bold italic tracking-wide"
              style={{
                color: '#f5c518',
                textShadow: '0 0 10px rgba(245,197,24,0.5)',
              }}
            >
              (A Place For Fashion Freak)
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
