'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { AppConfig, UserSession } from '@stacks/auth'
import type { UserData } from '@stacks/auth'
import {
  Rocket,
  TrendingUp,
  Users,
  Github,
  Twitter,
  Globe,
  Trophy,
  Coins,
  Activity,
  Settings,
  Eye,
  GitCommit,
  Star,
  GitFork,
  Play,
  Award
} from 'lucide-react'

import type {
  StartupProfile,
  MetricSnapshot,
  StartupSocialPost,
  NotificationPreference,
} from '@/lib/firebase/types'
import {
  listStartupProfiles,
  getLatestMetricSnapshot,
  fetchStartupPosts,
  getNotificationPreferences,
  setNotificationPreferences as saveNotificationPreferences,
  convertTimestamps,
} from '@/lib/firebase/firestore'

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })

const FALLBACK_STARTUP = {
  id: 'fallback-startup',
  ownerAddress: 'guest-user',
  name: 'TechStartup',
  description: 'Revolutionary AI-powered platform for developers',
  githubRepo: 'https://github.com/user/techstartup',
  website: 'https://techstartup.io',
  twitter: '@techstartup',
  tokenName: 'TechCoin',
  tokenSymbol: 'TECH',
  totalSupply: 1_000_000,
  price: 0.025,
  marketCap: 25_000,
  holders: 156,
  rank: 8,
  score: 2450,
  verified: true,
}

const FALLBACK_METRICS = {
  github: {
    commits: 234,
    stars: 89,
    forks: 23,
    lastCommit: '2 hours ago',
  },
  social: {
    twitterFollowers: 1250,
    linkedinFollowers: 890,
  },
  platform: {
    posts: 12,
    demoViews: 3400,
  },
}

const FALLBACK_COMPETITIONS = [
  {
    id: 1,
    name: 'January Growth Challenge',
    description: 'Compete for the highest growth metrics this month',
    status: 'active',
    endDate: '2025-01-31',
    participants: 45,
    prizePool: '5000 STX',
    myRank: 3,
    joined: true,
  },
  {
    id: 2,
    name: 'Demo Day Competition',
    description: 'Showcase your latest features and demos',
    status: 'upcoming',
    startDate: '2025-02-01',
    participants: 0,
    prizePool: '10000 STX',
    joined: false,
  },
]

const defaultNotificationPrefs: NotificationPreference = {
  allowEmail: true,
  allowPush: true,
  email: '',
}

const formatDateTime = (value: unknown) => {
  if (!value) return 'Just now'
  try {
    const date =
      value instanceof Date
        ? value
        : typeof value === 'string'
          ? new Date(value)
          : new Date(Number(value))
    if (Number.isNaN(date.getTime())) return 'Just now'
    return date.toLocaleString()
  } catch {
    return 'Just now'
  }
}

const getPrimaryAddress = (user: UserData | null) =>
  user?.profile?.stxAddress?.testnet ??
  user?.profile?.stxAddress?.mainnet ??
  null

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'competitions' | 'token' | 'settings'>('overview')
  const [startupData, setStartupData] = useState(FALLBACK_STARTUP)
  const [metrics, setMetrics] = useState(FALLBACK_METRICS)
  const [competitions] = useState(FALLBACK_COMPETITIONS)
  const [startupPosts, setStartupPosts] = useState<StartupSocialPost[]>([])
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference>(defaultNotificationPrefs)
  const [notificationPrefsLoaded, setNotificationPrefsLoaded] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData())
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const profiles = await listStartupProfiles(1)
        if (!isMounted) return

        if (profiles.length > 0) {
          const normalizedProfile = convertTimestamps<StartupProfile>(profiles[0])
          const derivedPrice = normalizedProfile.score ? Number((normalizedProfile.score / 100000).toFixed(3)) : startupData.price
          const derivedMarketCap = normalizedProfile.circulatingSupply && normalizedProfile.score
            ? Math.round((normalizedProfile.circulatingSupply ?? 0) * (normalizedProfile.score / 100000))
            : startupData.marketCap

          setStartupData((prev) => ({
            ...prev,
            id: normalizedProfile.id,
            ownerAddress: normalizedProfile.ownerAddress ?? prev.ownerAddress,
            name: normalizedProfile.name ?? prev.name,
            description: normalizedProfile.description ?? prev.description,
            githubRepo: normalizedProfile.github ?? prev.githubRepo,
            website: normalizedProfile.website ?? prev.website,
            twitter: normalizedProfile.twitter ?? prev.twitter,
            tokenName: normalizedProfile.tokenName ?? prev.tokenName,
            tokenSymbol: normalizedProfile.tokenSymbol ?? prev.tokenSymbol,
            totalSupply: normalizedProfile.totalSupply ?? prev.totalSupply,
            price: derivedPrice,
            marketCap: derivedMarketCap,
            holders: normalizedProfile.holders ?? prev.holders,
            rank: normalizedProfile.rank ?? prev.rank,
            score: normalizedProfile.score ?? prev.score,
            verified: normalizedProfile.verified ?? prev.verified,
          }))

          const [snapshot, posts] = await Promise.all([
            getLatestMetricSnapshot(normalizedProfile.id),
            fetchStartupPosts(normalizedProfile.id, 3),
          ])

          if (!isMounted) return

          if (snapshot) {
            const normalizedSnapshot = convertTimestamps<MetricSnapshot>(snapshot)
            setMetrics((prev) => ({
              github: {
                commits: normalizedSnapshot.github.commits,
                stars: normalizedSnapshot.github.stars,
                forks: normalizedSnapshot.github.forks,
                lastCommit: normalizedSnapshot.updatedAt ? formatDateTime(normalizedSnapshot.updatedAt) : prev.github.lastCommit,
              },
              social: {
                twitterFollowers: normalizedSnapshot.twitter?.followers ?? prev.social.twitterFollowers,
                linkedinFollowers: prev.social.linkedinFollowers,
              },
              platform: {
                posts: normalizedSnapshot.traction?.users ?? prev.platform.posts,
                demoViews: prev.platform.demoViews,
              },
            }))
          }

          if (posts.length) {
            setStartupPosts(posts.map((post) => convertTimestamps<StartupSocialPost>(post)))
          } else {
            setStartupPosts([])
          }

          const address = getPrimaryAddress(userData) ?? normalizedProfile.ownerAddress ?? 'guest-user'
          const prefs = await getNotificationPreferences(address)
          if (isMounted) {
            if (prefs) {
              const normalizedPrefs = convertTimestamps<NotificationPreference>(prefs)
              setNotificationPrefs({
                allowEmail: normalizedPrefs.allowEmail,
                allowPush: normalizedPrefs.allowPush,
                email: normalizedPrefs.email ?? defaultNotificationPrefs.email,
              })
            } else {
              setNotificationPrefs((prev) => ({
                ...prev,
                email: userData?.profile?.email ?? prev.email,
              }))
            }
            setNotificationPrefsLoaded(true)
          }
        } else {
          setStartupPosts([])
          setNotificationPrefsLoaded(true)
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err)
        if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load dashboard data')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [userData])

  const notificationUserId = useMemo(() => (
    getPrimaryAddress(userData) ?? startupData.ownerAddress ?? 'guest-user'
  ), [userData, startupData.ownerAddress])

  const handleNotificationToggle = (key: 'allowEmail' | 'allowPush', value: boolean) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveNotificationPrefs = async () => {
    setSavingNotifications(true)
    try {
      await saveNotificationPreferences(notificationUserId, {
        ...notificationPrefs,
        email: notificationPrefs.email ?? userData?.profile?.email ?? '',
      })
    } catch (err) {
      console.error('Failed to save notification preferences', err)
      setError(err instanceof Error ? err.message : 'Unable to save notification preferences')
    } finally {
      setSavingNotifications(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'metrics', label: 'Metrics', icon: TrendingUp },
    { id: 'competitions', label: 'Competitions', icon: Trophy },
    { id: 'token', label: 'Token', icon: Coins },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-600">Connect your Stacks wallet to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Rocket className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                StartEx
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-800">Connected</span>
              </div>
              <button
                onClick={() => (window.location.href = '/')}
                className="text-gray-600 hover:text-orange-600 font-medium transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 mb-8 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-3xl">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
            </div>
          )}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold text-gray-900">{startupData.name}</h1>
                  {startupData.verified && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-gray-600 max-w-2xl">{startupData.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <a
                    href={startupData.githubRepo}
                    className="flex items-center space-x-1 text-gray-500 hover:text-orange-600 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                  <a
                    href={startupData.website}
                    className="flex items-center space-x-1 text-gray-500 hover:text-orange-600 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                  <a
                    href={`https://twitter.com/${startupData.twitter.replace('@', '')}`}
                    className="flex items-center space-x-1 text-gray-500 hover:text-orange-600 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>{startupData.twitter}</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                #{startupData.rank}
              </div>
              <div className="text-sm text-gray-500">Global Rank</div>
              <div className="text-lg font-semibold text-gray-900">{startupData.score.toLocaleString()} pts</div>
            </div>
          </div>
        </div>

        <div className="flex space-x-1 mb-8 bg-white/50 backdrop-blur-sm rounded-2xl p-2 border border-gray-200">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            const isSelected = selectedTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-white/50'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {selectedTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Token Price"
                value={`$${startupData.price.toFixed(3)}`}
                subtitle="24h: +12.5%"
                icon={Coins}
                color="text-green-600"
                trend="+12.5%"
              />
              <StatCard
                title="Market Cap"
                value={`$${(startupData.marketCap / 1000).toFixed(1)}K`}
                subtitle={`${startupData.holders} holders`}
                icon={TrendingUp}
                color="text-blue-600"
                trend="+8.3%"
              />
              <StatCard
                title="GitHub Stars"
                value={metrics.github.stars}
                subtitle={`${metrics.github.commits} commits`}
                icon={Star}
                color="text-yellow-600"
                trend={`Last update: ${metrics.github.lastCommit}`}
              />
              <StatCard
                title="Platform Score"
                value={startupData.score.toLocaleString()}
                subtitle="This month"
                icon={Activity}
                color="text-purple-600"
                trend="+125 points"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { message: 'Added new authentication system', time: '2 hours ago', icon: GitCommit },
                    { message: 'Gained 25 new Twitter followers', time: '4 hours ago', icon: Users },
                    { message: 'Demo video reached 100 views', time: '1 day ago', icon: Play },
                    { message: '50 new token holders joined', time: '2 days ago', icon: Coins },
                  ].map((activity, index) => {
                    const IconComponent = activity.icon
                    return (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50/50 rounded-xl">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.message}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Community Updates</h3>
                <div className="space-y-4">
                  {startupPosts.length === 0 && (
                    <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6">
                      No off-chain posts synced yet. Posts from Firebase will appear here.
                    </div>
                  )}
                  {startupPosts.map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-2xl p-5 bg-white/70">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">{post.authorName ?? 'Community Member'}</div>
                        <span className="text-xs text-gray-500">{formatDateTime(post.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>
                      {!!post.metrics && (
                        <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                          <span>❤ {post.metrics.likes}</span>
                          <span>💬 {post.metrics.comments}</span>
                          <span>🔁 {post.metrics.shares}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'competitions' && (
          <div className="space-y-6">
            {competitions.map((competition) => (
              <div key={competition.id} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{competition.name}</h3>
                        <p className="text-gray-600">{competition.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{competition.participants} participants</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Coins className="w-4 h-4" />
                        <span>{competition.prizePool} prize pool</span>
                      </span>
                      {competition.status === 'active' && competition.myRank && (
                        <span className="flex items-center space-x-1 text-orange-600 font-medium">
                          <Award className="w-4 h-4" />
                          <span>Rank #{competition.myRank}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        competition.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {competition.status === 'active' ? 'Active' : 'Upcoming'}
                    </span>
                    {competition.status === 'active' ? (
                      <p className="text-sm text-gray-500">Ends: {competition.endDate}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Starts: {competition.startDate}</p>
                    )}

                    <button
                      className={`px-6 py-2 rounded-xl font-medium transition-all ${
                        competition.joined
                          ? 'bg-gray-200 text-gray-600 cursor-default'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                      }`}
                      disabled={competition.joined}
                    >
                      {competition.joined ? 'Joined' : 'Join Competition'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'metrics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">GitHub Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <GitCommit className="w-5 h-5 text-gray-500" />
                    <span>Total Commits</span>
                  </span>
                  <span className="font-bold text-2xl text-gray-900">{metrics.github.commits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Stars</span>
                  </span>
                  <span className="font-bold text-2xl text-yellow-600">{metrics.github.stars}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <GitFork className="w-5 h-5 text-blue-500" />
                    <span>Forks</span>
                  </span>
                  <span className="font-bold text-2xl text-blue-600">{metrics.github.forks}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Social Media</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Twitter className="w-5 h-5 text-blue-500" />
                    <span>Twitter Followers</span>
                  </span>
                  <span className="font-bold text-2xl text-blue-600">{metrics.social.twitterFollowers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-700" />
                    <span>LinkedIn Followers</span>
                  </span>
                  <span className="font-bold text-2xl text-blue-700">{metrics.social.linkedinFollowers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-purple-500" />
                    <span>Demo Views</span>
                  </span>
                  <span className="font-bold text-2xl text-purple-600">{metrics.platform.demoViews}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Notification Preferences</h3>
              <p className="text-sm text-gray-500 mb-6">
                Manage Firebase-backed email and push notifications for your startup updates.
              </p>
              {!notificationPrefsLoaded && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                  <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
                  <span>Loading preferences…</span>
                </div>
              )}
              <div className="space-y-4">
                <label className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <span className="text-gray-700 font-medium">Email notifications</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.allowEmail}
                    onChange={(event) => handleNotificationToggle('allowEmail', event.target.checked)}
                    className="h-5 w-5 text-orange-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <span className="text-gray-700 font-medium">Push notifications</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.allowPush}
                    onChange={(event) => handleNotificationToggle('allowPush', event.target.checked)}
                    className="h-5 w-5 text-orange-500 rounded"
                  />
                </label>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notification email</label>
                  <input
                    type="email"
                    value={notificationPrefs.email ?? ''}
                    onChange={(event) => setNotificationPrefs((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="founder@startup.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Preferences are synced to Firestore under `{notificationUserId}`.
                </div>
                <button
                  onClick={handleSaveNotificationPrefs}
                  className={`px-6 py-3 rounded-xl font-medium text-white transition-all ${
                    savingNotifications
                      ? 'bg-gray-400 cursor-wait'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                  }`}
                  disabled={savingNotifications}
                >
                  {savingNotifications ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type StatCardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon: ComponentType<{ className?: string }>
  color: string
  trend?: string
}

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) => (
  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-orange-400 to-red-400">
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 text-sm text-green-600 font-medium">{trend}</div>
    )}
  </div>
)
