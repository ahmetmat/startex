'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Rocket,
  Trophy,
  TrendingUp,
  Users,
  Github,
  Twitter,
  ExternalLink,
  Zap,
  Sparkles,
  ArrowRight,
  Play,
} from 'lucide-react'
import Link from 'next/link'
import { HeaderWalletControls } from '@/components/HeaderWalletControls'
import { MainHeader, type NavItem } from '@/components/MainHeader'

import type { LeaderboardEntry, StartupProfile } from '@/lib/firebase/types'
import { convertTimestamps, getLeaderboard, listStartupProfiles } from '@/lib/firebase/firestore'

type AggregatedStats = {
  totalStartups: number
  totalMarketCap: number
  totalHolders: number
  totalScore: number
}

const LANDING_NAV_ITEMS: NavItem[] = [
  { label: 'Startups', href: '/leaderboard' },
  { label: 'Competitions', href: '/competitions' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Trading', href: '/trading' },
]

const FALLBACK_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'techflow-ai',
    startupId: 'techflow-ai',
    rank: 1,
    previousRank: 2,
    name: 'TechFlow AI',
    description: 'Next-generation AI development platform',
    founder: 'Alex Chen',
    category: 'AI/ML',
    score: 4850,
    change: '+125',
    tokenSymbol: 'TECH',
    tokenPrice: 0.045,
    priceChange: '+15.2%',
    marketCap: 45000,
    holders: 234,
    verified: true,
    githubStats: {
      commits: 445,
      stars: 189,
      forks: 67,
    },
    socialStats: {
      twitterFollowers: 2400,
      linkedinFollowers: 1200,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'greenchain-solutions',
    startupId: 'greenchain-solutions',
    rank: 2,
    previousRank: 1,
    name: 'GreenChain Solutions',
    description: 'Sustainable blockchain solutions for environmental impact',
    founder: 'Sarah Martinez',
    category: 'Sustainability',
    score: 4720,
    change: '-45',
    tokenSymbol: 'GREEN',
    tokenPrice: 0.032,
    priceChange: '+8.7%',
    marketCap: 32000,
    holders: 198,
    verified: true,
    githubStats: {
      commits: 378,
      stars: 156,
      forks: 43,
    },
    socialStats: {
      twitterFollowers: 1980,
      linkedinFollowers: 950,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'healthsync-pro',
    startupId: 'healthsync-pro',
    rank: 3,
    previousRank: 4,
    name: 'HealthSync Pro',
    description: 'Digital health management and telemedicine platform',
    founder: 'Dr. Michael Kim',
    category: 'HealthTech',
    score: 4590,
    change: '+89',
    tokenSymbol: 'HEALTH',
    tokenPrice: 0.028,
    priceChange: '+12.4%',
    marketCap: 28000,
    holders: 167,
    verified: true,
    githubStats: {
      commits: 321,
      stars: 134,
      forks: 38,
    },
    socialStats: {
      twitterFollowers: 1650,
      linkedinFollowers: 820,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const formatCompactNumber = (value: number, prefix = '') => {
  if (!value) return '—'
  return `${prefix}${Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)}`
}

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [startupProfiles, setStartupProfiles] = useState<StartupProfile[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) =>
      setMousePosition({ x: event.clientX, y: event.clientY })

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadOffChainData = async () => {
      setIsLoadingData(true)
      setDataError(null)
      try {
        const [profilesResponse, leaderboardResponse] = await Promise.all([
          listStartupProfiles(50),
          getLeaderboard('overall'),
        ])

        if (!isMounted) return

        const normalizedProfiles = profilesResponse.map((profile) =>
          convertTimestamps(profile as Record<string, unknown>)
        ) as StartupProfile[]

        const normalizedLeaderboard = leaderboardResponse.map((entry) =>
          convertTimestamps(entry as Record<string, unknown>)
        ) as LeaderboardEntry[]

        setStartupProfiles(normalizedProfiles)
        setLeaderboardData(normalizedLeaderboard)
      } catch (error) {
        console.error('Failed to load homepage data', error)
        if (isMounted) {
          setDataError(error instanceof Error ? error.message : 'Unable to load home data right now.')
          setLeaderboardData([])
          setStartupProfiles([])
        }
      } finally {
        if (isMounted) setIsLoadingData(false)
      }
    }

    loadOffChainData()

    return () => {
      isMounted = false
    }
  }, [])

  const effectiveLeaderboard = leaderboardData.length > 0 ? leaderboardData : FALLBACK_LEADERBOARD

  const aggregatedStats: AggregatedStats = useMemo(() => {
    const totalStartups = startupProfiles.length || effectiveLeaderboard.length
    const totalMarketCap = effectiveLeaderboard.reduce((total, entry) => total + (entry.marketCap ?? 0), 0)
    const totalHolders = effectiveLeaderboard.reduce((total, entry) => total + (entry.holders ?? 0), 0)
    const totalScore = effectiveLeaderboard.reduce((total, entry) => total + (entry.score ?? 0), 0)

    return {
      totalStartups,
      totalMarketCap,
      totalHolders,
      totalScore,
    }
  }, [effectiveLeaderboard, startupProfiles.length])

  const trendingStartups = useMemo(
    () => effectiveLeaderboard.slice(0, 3),
    [effectiveLeaderboard]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full opacity-60 animate-bounce"
          style={{ animationDelay: '0s', animationDuration: '3s' }}
        />
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-300 to-red-400 rounded-full opacity-50 animate-bounce"
          style={{ animationDelay: '1s', animationDuration: '4s' }}
        />
        <div
          className="absolute bottom-32 left-32 w-20 h-20 bg-gradient-to-r from-cyan-300 to-blue-400 rounded-full opacity-70 animate-bounce"
          style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}
        />
        <div
          className="absolute w-96 h-96 bg-gradient-radial from-yellow-200/30 via-transparent to-transparent rounded-full transition-all duration-300 ease-out"
          style={{ left: mousePosition.x - 192, top: mousePosition.y - 192 }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
      </div>
      <MainHeader
        navItems={LANDING_NAV_ITEMS}
        highlightPath="/"
        showSparkles
        className="relative z-30 backdrop-blur-xl shadow-lg"
        rightSlot={<HeaderWalletControls />}
      />

      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3 rounded-full border border-orange-200 mb-8">
                <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                <span className="text-orange-700 font-semibold">The Future is Here</span>
              </div>

              <h1 className="text-6xl md:text-8xl font-black leading-none">
                <span className="block text-gray-900 mb-2">Launch Your</span>
                <span className="block bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent relative">
                  Startup
                  <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 to-red-400/20 blur-xl" />
                </span>
                <span className="block text-gray-900 mt-2">to the Moon</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                🚀 Tokenize your startup, compete with peers, and get funded by the community. Built on Stacks blockchain with rocket-powered technology!
                <span className="font-bold text-orange-600"> Let’s build the future together!</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/register"
                className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
              >
                <div className="flex items-center space-x-3">
                  <Rocket className="w-6 h-6 group-hover:animate-bounce" />
                  <span>Launch Your Startup</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              </Link>

              <a
                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white/80 backdrop-blur-sm border-2 border-orange-300 hover:border-orange-400 text-orange-700 hover:text-orange-800 px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <div className="flex items-center space-x-3">
                  <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Watch Demo</span>
                </div>
              </a>
            </div>

            {dataError && (
              <div className="mx-auto max-w-xl rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
                {dataError}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                value: isLoadingData ? 'Loading…' : `${aggregatedStats.totalStartups}`,
                label: 'Active Startups',
                color: 'from-orange-400 to-red-400',
                icon: Rocket,
              },
              {
                value: isLoadingData
                  ? 'Loading…'
                  : formatCompactNumber(aggregatedStats.totalMarketCap),
                label: 'Total Market Cap (STX)',
                color: 'from-green-400 to-emerald-400',
                icon: TrendingUp,
              },
              {
                value: isLoadingData
                  ? 'Loading…'
                  : formatCompactNumber(aggregatedStats.totalScore),
                label: 'Aggregate Score',
                color: 'from-blue-400 to-cyan-400',
                icon: Trophy,
              },
              {
                value: isLoadingData
                  ? 'Loading…'
                  : formatCompactNumber(aggregatedStats.totalHolders),
                label: 'Token Holders',
                color: 'from-purple-400 to-pink-400',
                icon: Users,
              },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="group relative">
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 text-center space-y-4 hover:transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                    <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto group-hover:rotate-12 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className={`text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-100 to-blue-100 px-6 py-3 rounded-full border border-blue-200">
              <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
              <span className="text-blue-700 font-semibold">Supercharged Features</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900">
              Why Choose
              <span className="block bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent"> StartEx?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Tokenize Your Startup',
                description:
                  'Convert your startup into tradeable tokens. Connect your GitHub repo and let the community invest in your success.',
                icon: Zap,
                gradient: 'from-yellow-400 to-orange-500',
                bgGradient: 'from-yellow-50 to-orange-50',
                borderColor: 'border-orange-200',
              },
              {
                title: 'Compete & Win',
                description:
                  'Join monthly competitions. Get scored based on GitHub activity, social growth, and platform engagement.',
                icon: Trophy,
                gradient: 'from-blue-400 to-cyan-500',
                bgGradient: 'from-blue-50 to-cyan-50',
                borderColor: 'border-blue-200',
              },
              {
                title: 'Community Funding',
                description:
                  'Get funded by a global community of investors who believe in your vision and track your progress.',
                icon: Users,
                gradient: 'from-green-400 to-emerald-500',
                bgGradient: 'from-green-50 to-emerald-50',
                borderColor: 'border-green-200',
              },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="group relative">
                  <div
                    className={`bg-gradient-to-br ${feature.bgGradient} backdrop-blur-sm border ${feature.borderColor} rounded-3xl p-10 hover:transform hover:scale-105 transition-all duration-500 hover:shadow-2xl`}
                  >
                    <div
                      className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-3">
              <h3 className="text-3xl md:text-4xl font-black text-gray-900">Trending on StartEx</h3>
              <p className="text-gray-600">Top startups, refreshed from the live leaderboard.</p>
            </div>
            <Link
              href="/leaderboard"
              className="hidden md:inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-orange-200 px-5 py-3 rounded-full text-orange-700 font-medium hover:border-orange-400 transition-colors"
            >
              <span>View Leaderboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {trendingStartups.map((startup) => (
              <div
                key={startup.id}
                className="bg-white/85 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 space-y-5 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-lg font-bold text-white">
                      {(startup.tokenSymbol ?? startup.name.slice(0, 2)).slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Rank #{startup.rank}</p>
                      <h4 className="text-xl font-bold text-gray-900">{startup.name}</h4>
                    </div>
                  </div>
                  {startup.verified && (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {startup.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{startup.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Token Price</div>
                    <div className="font-semibold text-gray-900">${(startup.tokenPrice ?? 0).toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Market Cap</div>
                    <div className="font-semibold text-gray-900">{formatCompactNumber(startup.marketCap ?? 0)} STX</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Score</div>
                    <div className="font-semibold text-gray-900">{(startup.score ?? 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Holders</div>
                    <div className="font-semibold text-gray-900">{startup.holders ?? 0}</div>
                  </div>
                </div>

                <Link
                  href="/leaderboard"
                  className="inline-flex items-center space-x-2 text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  <span>View on Leaderboard</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24 bg-gradient-to-r from-orange-100 via-red-50 to-pink-100">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900">
                Ready to
                <span className="block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent"> Launch? 🚀</span>
              </h2>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto">Join the next generation of startup funding on the blockchain</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/register"
                className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
              >
                <div className="flex items-center space-x-3 justify-center">
                  <Github className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span>Connect GitHub & Start</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/docs/firebase-seed"
                className="group bg-white/80 backdrop-blur-sm border-2 border-orange-300 hover:border-orange-400 text-orange-700 hover:text-orange-800 px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <div className="flex items-center space-x-3 justify-center">
                  <ExternalLink className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>View Documentation</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 bg-white/90 backdrop-blur-sm border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Rocket className="w-8 h-8 text-orange-500" />
                <span className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">StartEx</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                The future of startup funding, built on Stacks blockchain with love ❤️
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                >
                  <Twitter className="w-5 h-5 text-white" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                >
                  <Github className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            {[
              {
                title: 'Platform',
                links: [
                  { label: 'Browse Startups', href: '/leaderboard' },
                  { label: 'Competitions', href: '/competitions' },
                  { label: 'Leaderboard', href: '/leaderboard' },
                  { label: 'Trading', href: '/trading' },
                ],
              },
              {
                title: 'Resources',
                links: [
                  { label: 'Documentation', href: '/docs/firebase-seed' },
                  { label: 'API', href: '#' },
                  { label: 'Support', href: 'mailto:hello@startex.xyz' },
                  { label: 'Blog', href: '#' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About', href: '#' },
                  { label: 'Careers', href: '#' },
                  { label: 'Privacy', href: '#' },
                  { label: 'Terms', href: '#' },
                ],
              },
            ].map((section) => (
              <div key={section.title} className="space-y-6">
                <h4 className="text-gray-900 font-bold text-lg">{section.title}</h4>
                <div className="space-y-3">
                  {section.links.map((link) =>
                    link.href.startsWith('http') || link.href.startsWith('mailto:') ? (
                      <a
                        key={link.label}
                        href={link.href}
                        className="block text-gray-600 hover:text-orange-600 transition-colors duration-300 font-medium"
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="block text-gray-600 hover:text-orange-600 transition-colors duration-300 font-medium"
                      >
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center">
            <p className="text-gray-500">
              © 2025 StartEx. Built with 🚀 on Stacks blockchain. Let’s reach for the stars!
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
