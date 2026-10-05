'use client'

import React, { useState } from 'react'
import { useClientConfig } from '@/config/client'

export default function FloatingSocialButtons() {
  const { config } = useClientConfig()
  const [hovered, setHovered] = useState<'ig' | 'fb' | null>(null)

  const igUrl =
    (config as { social?: { instagram?: string } })?.social?.instagram ||
    'https://www.instagram.com/ladysera_phulwarisharif_patna?stkn=aTdkZ25vdXRybXMx'
  const fbUrl =
    (config as { social?: { facebook?: string } })?.social?.facebook ||
    'https://www.facebook.com/share/1dCiFQHFeH/?mibextid=wwXIfr'

  if (!igUrl && !fbUrl) return null

  return (
    <aside
      aria-label="Social media links"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-2.5 pointer-events-auto select-none"
    >
      {/* Instagram Side Button */}
      {igUrl && (
        <a
          href={igUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHovered('ig')}
          onMouseLeave={() => setHovered(null)}
          aria-label="Follow Lady's Era on Instagram"
          className="group flex items-center gap-2 pl-3 pr-2.5 py-2 sm:py-2.5 rounded-l-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white shadow-[0_8px_25px_-5px_rgba(253,29,29,0.45)] hover:pr-4 hover:shadow-[0_12px_30px_-5px_rgba(253,29,29,0.6)] border-y border-l border-white/20 transition-all duration-300 transform hover:-translate-x-1 active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <div className="relative">
            <svg
              className="w-5 h-5 sm:w-5 sm:h-5 fill-current drop-shadow-sm group-hover:scale-115 transition-transform duration-200"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-300 animate-ping sm:hidden" />
          </div>
          <span className="text-xs font-bold tracking-wide drop-shadow-xs hidden sm:inline whitespace-nowrap">
            Instagram
          </span>
          <span className="text-[10px] bg-white/20 text-white font-bold px-1.5 py-0.5 rounded-full hidden lg:inline">
            Follow
          </span>
        </a>
      )}

      {/* Facebook Side Button */}
      {fbUrl && (
        <a
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHovered('fb')}
          onMouseLeave={() => setHovered(null)}
          aria-label="Follow Lady's Era on Facebook"
          className="group flex items-center gap-2 pl-3 pr-2.5 py-2 sm:py-2.5 rounded-l-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-[0_8px_25px_-5px_rgba(24,119,242,0.5)] hover:pr-4 hover:shadow-[0_12px_30px_-5px_rgba(24,119,242,0.65)] border-y border-l border-white/20 transition-all duration-300 transform hover:-translate-x-1 active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <svg
            className="w-5 h-5 sm:w-5 sm:h-5 fill-current drop-shadow-sm group-hover:scale-115 transition-transform duration-200"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="text-xs font-bold tracking-wide drop-shadow-xs hidden sm:inline whitespace-nowrap">
            Facebook
          </span>
          <span className="text-[10px] bg-white/20 text-white font-bold px-1.5 py-0.5 rounded-full hidden lg:inline">
            Follow
          </span>
        </a>
      )}
    </aside>
  )
}
