'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { QrCode, Play, CheckCircle2, ExternalLink, Star, ThumbsUp, AlertTriangle, Sparkles } from 'lucide-react'
import { useClientConfig } from '@/config/client'

export interface AnalyticsData {
  scans: number
  starts: number
  completions: number
  googleClicks: number
  privateFeedbackCount: number
  startRate: number
  completionRate: number
  scanToCompletionRate: number
  googleClickRate: number
  privateFeedbackRate: number
  avgOverall: number | null
  avgFood: number | null
  avgService: number | null
  totalRatedSessions: number
  ratingDistribution: Record<number, number>
  likedCounts: Record<string, number>
  lowRatingShare: {
    overall: number
    food: number
    service: number
  }
  campaignStats: Array<{
    id: string
    name: string
    slug: string
    active: boolean
    scans: number
    completions: number
    googleClicks: number
  }>
}

interface OverviewTabProps {
  analytics: AnalyticsData
}

export default function OverviewTab({ analytics }: OverviewTabProps) {
  const {
    scans,
    starts,
    completions,
    googleClicks,
    startRate,
    completionRate,
    googleClickRate,
    avgOverall,
    avgFood,
    avgService,
    totalRatedSessions,
    ratingDistribution,
    likedCounts,
    campaignStats,
  } = analytics

  const likedKeys = [
    { key: 'designs', label: 'Trendy & Elegant Designs' },
    { key: 'fabric', label: 'Fabric & Stitch Quality' },
    { key: 'fitting', label: 'Flattering Fit & Trial' },
    { key: 'service', label: 'Personal Styling Advice' },
    { key: 'ambience', label: 'Aesthetic Boutique Vibe' },
    { key: 'value', label: 'Great Value & Pricing' },
  ]

  const { config } = useClientConfig()
  const igUrl = (config as { social?: { instagram?: string } })?.social?.instagram || 'https://www.instagram.com/ladysera_phulwarisharif_patna?stkn=aTdkZ25vdXRybXMx'
  const fbUrl = (config as { social?: { facebook?: string } })?.social?.facebook || 'https://www.facebook.com/share/1dCiFQHFeH/?mibextid=wwXIfr'

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Brand & Social Channels Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">{config.name} Online Channels</h4>
            <p className="text-[11px] text-slate-400">Official social media & boutique touchpoints</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {igUrl && (
            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#833ab4]/20 via-[#fd1d1d]/20 to-[#fcb045]/20 hover:from-[#833ab4]/30 hover:to-[#fcb045]/30 border border-pink-500/30 text-pink-300 hover:text-white text-xs font-semibold transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Instagram</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}
          {fbUrl && (
            <a
              href={fbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-semibold transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}
        </div>
      </div>

      {/* 4 Primary Conversion Funnel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scans */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">1. Total Scans</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white flex items-baseline justify-between">
              <span>{scans}</span>
              <QrCode className="w-5 h-5 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-400">QR code opens on shopper phones</p>
          </CardContent>
        </Card>

        {/* Starts */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">2. Quiz Starts</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white flex items-baseline justify-between">
              <span>{starts}</span>
              <Play className="w-5 h-5 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-amber-400">
              {Math.round(startRate * 100)}% Start Rate
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5">from scans</span>
          </CardContent>
        </Card>

        {/* Completions */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">3. Completed Quizzes</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white flex items-baseline justify-between">
              <span>{completions}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-emerald-400">
              {Math.round(completionRate * 100)}% Completion Rate
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5">from starts</span>
          </CardContent>
        </Card>

        {/* Google Clicks */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">4. Google Clicks</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white flex items-baseline justify-between">
              <span>{googleClicks}</span>
              <ExternalLink className="w-5 h-5 text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-blue-400">
              {Math.round(googleClickRate * 100)}% Hand-off Rate
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5">distinct shoppers</span>
          </CardContent>
        </Card>
      </div>

      {/* Ratings & Compliments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Ratings Breakdown */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white">Experience Scores</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Based on {totalRatedSessions} completed customer sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">Overall Rating</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-2xl font-bold text-white">
                    {avgOverall !== null ? avgOverall.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Q1 5-Stars</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <p className="text-xs text-slate-400">Collection &amp; Style</p>
                <p className="text-xl font-bold text-white mt-1">
                  {avgFood !== null ? avgFood.toFixed(1) : '—'}{' '}
                  <span className="text-[11px] font-normal text-slate-400">/ 5</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <p className="text-xs text-slate-400">Styling &amp; Service</p>
                <p className="text-xl font-bold text-white mt-1">
                  {avgService !== null ? avgService.toFixed(1) : '—'}{' '}
                  <span className="text-[11px] font-normal text-slate-400">/ 5</span>
                </p>
              </div>
            </div>

            {/* Rating distribution bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <p className="text-xs font-medium text-slate-400">Rating Breakdown</p>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution[star] || 0
                const percent = totalRatedSessions > 0 ? Math.round((count / totalRatedSessions) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-slate-400">{star}★</span>
                    <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-slate-400">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Compliments Breakdown */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white">What Customers Liked</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Aspects frequently selected during Q4
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {likedKeys.map((item) => {
                const count = likedCounts[item.key] || 0
                const percent =
                  totalRatedSessions > 0 ? Math.round((count / totalRatedSessions) * 100) : 0

                return (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5 text-rose-400" />
                        {item.label}
                      </span>
                      <span className="text-white font-bold">{count} votes</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">{percent}% of completed sessions</p>
                  </div>
                )
              })}
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Low Rating Share: {Math.round(analytics.lowRatingShare.overall * 100)}% of sessions gave an overall rating of 2 stars or below.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Conversion Breakdown Table */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Campaign Conversion Performance</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Performance comparison across QR placement channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Scans</th>
                  <th className="py-2.5 px-3">Completions</th>
                  <th className="py-2.5 px-3">Completion Rate</th>
                  <th className="py-2.5 px-3">Google Clicks</th>
                  <th className="py-2.5 px-3">Review Click Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {campaignStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No campaign data yet
                    </td>
                  </tr>
                ) : (
                  campaignStats.map((c) => {
                    const cRate = c.scans > 0 ? Math.round((c.completions / c.scans) * 100) : 0
                    const gRate = c.completions > 0 ? Math.round((c.googleClicks / c.completions) * 100) : 0
                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-white">
                          {c.name}
                          <span className="block text-[11px] font-normal text-slate-400">/r/{c.slug}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              c.active
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {c.active ? 'Active' : 'Paused'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">{c.scans}</td>
                        <td className="py-3 px-3 font-semibold">{c.completions}</td>
                        <td className="py-3 px-3">{cRate}%</td>
                        <td className="py-3 px-3 font-semibold text-amber-400">{c.googleClicks}</td>
                        <td className="py-3 px-3 font-semibold text-rose-400">{gRate}%</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
