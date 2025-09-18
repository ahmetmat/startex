'use client'

import { useState, useEffect } from 'react'
import { AppConfig, UserSession } from '@stacks/auth'
import { 
  Trophy, 
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Github,
  Twitter,
  Globe,
  Rocket,
  Award,
  Star,
  Eye,
  Activity,
  Coins,
  Filter,
  Search,
  Calendar,
  Target,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react'

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })

export default function Leaderboard() {
  const [userData, setUserData] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('overall')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('score')

  const [leaderboardData, setLeaderboardData] = useState([
    {
      id: 1,
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
        forks: 67
      },
      socialStats: {
        twitter: 2400,
        linkedin: 1200
      },
      platformStats: {
        posts: 25,
        views: 8900
      },
      competitionsWon: 3,
      website: 'https://techflow.ai',
      github: 'https://github.com/techflow/ai',
      twitter: '@techflowai'
    },
    {
      id: 2,
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
        forks: 43
      },
      socialStats: {
        twitter: 1980,
        linkedin: 950
      },
      platformStats: {
        posts: 18,
        views: 6700
      },
      competitionsWon: 2,
      website: 'https://greenchain.eco',
      github: 'https://github.com/greenchain/solutions',
      twitter: '@greenchainsol'
    },
    {
      id: 3,
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
        forks: 38
      },
      socialStats: {
        twitter: 1650,
        linkedin: 820
      },
      platformStats: {
        posts: 22,
        views: 5400
      },
      competitionsWon: 1,
      website: 'https://healthsync.pro',
      github: 'https://github.com/healthsync/pro',
      twitter: '@healthsyncpro'
    },
    {
      id: 4,
      rank: 4,
      previousRank: 3,
      name: 'CryptoLearn',
      description: 'Educational platform for blockchain and cryptocurrency',
      founder: 'Emma Thompson',
      category: 'Education',
      score: 4420,
      change: '-67',
      tokenSymbol: 'LEARN',
      tokenPrice: 0.019,
      priceChange: '+3.1%',
      marketCap: 19000,
      holders: 145,
      verified: false,
      githubStats: {
        commits: 289,
        stars: 112,
        forks: 29
      },
      socialStats: {
        twitter: 1420,
        linkedin: 670
      },
      platformStats: {
        posts: 31,
        views: 7200
      },
      competitionsWon: 1,
      website: 'https://cryptolearn.io',
      github: 'https://github.com/cryptolearn/platform',
      twitter: '@cryptolearnio'
    },
    {
      id: 5,
      rank: 5,
      previousRank: 6,
      name: 'DevTools Studio',
      description: 'Advanced development tools and IDE solutions',
      founder: 'James Wilson',
      category: 'Developer Tools',
      score: 4280,
      change: '+78',
      tokenSymbol: 'DEV',
      tokenPrice: 0.015,
      priceChange: '+6.8%',
      marketCap: 15000,
      holders: 123,
      verified: false,
      githubStats: {
        commits: 567,
        stars: 203,
        forks: 84
      },
      socialStats: {
        twitter: 1150,
        linkedin: 580
      },
      platformStats: {
        posts: 19,
        views: 4800
      },
      competitionsWon: 0,
      website: 'https://devtools.studio',
      github: 'https://github.com/devtools/studio',
      twitter: '@devtoolsstudio'
    },
    {
      id: 6,
      rank: 6,
      previousRank: 5,
      name: 'FoodChain Tracker',
      description: 'Supply chain transparency for food industry',
      founder: 'Maria Rodriguez',
      category: 'Supply Chain',
      score: 4150,
      change: '-45',
      tokenSymbol: 'FOOD',
      tokenPrice: 0.022,
      priceChange: '-2.1%',
      marketCap: 22000,
      holders: 98,
      verified: true,
      githubStats: {
        commits: 198,
        stars: 89,
        forks: 23
      },
      socialStats: {
        twitter: 890,
        linkedin: 450
      },
      platformStats: {
        posts: 14,
        views: 3200
      },
      competitionsWon: 1,
      website: 'https://foodchain.track',
      github: 'https://github.com/foodchain/tracker',
      twitter: '@foodchaintrack'
    }
  ])

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData() as any)
    }
  }, [])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-500" />
    return <span className="text-2xl font-bold text-gray-900">#{rank}</span>
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current < previous) return <ChevronUp className="w-4 h-4 text-green-500" />
    if (current > previous) return <ChevronDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const filteredData = leaderboardData.filter(startup => {
    const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         startup.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || startup.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const StartupRow = ({ startup, index }) => (
    <div className={`bg-white/80 backdrop-blur-sm border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
      startup.rank <= 3 ? 'border-yellow-300 bg-gradient-to-r from-yellow-50/30 to-orange-50/30' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        {/* Rank & Basic Info */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            {getRankIcon(startup.rank)}
            {getTrendIcon(startup.rank, startup.previousRank)}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">{startup.tokenSymbol.slice(0, 2)}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-gray-900">{startup.name}</h3>
                {startup.verified && (
                  <Award className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-gray-600 text-sm max-w-md">{startup.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>by {startup.founder}</span>
                <span className="px-2 py-1 bg-gray-100 rounded-full">{startup.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900">{startup.score.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Score</div>
            <div className={`text-xs font-medium ${
              startup.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {startup.change}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-lg font-bold text-blue-600">${startup.tokenPrice.toFixed(3)}</div>
            <div className="text-xs text-gray-500">Token Price</div>
            <div className={`text-xs font-medium ${
              startup.priceChange.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {startup.priceChange}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-lg font-bold text-purple-600">{startup.holders}</div>
            <div className="text-xs text-gray-500">Holders</div>
            <div className="text-xs text-gray-500">${(startup.marketCap / 1000).toFixed(0)}K cap</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-gray-900">{startup.githubStats.stars}</span>
            </div>
            <div className="text-xs text-gray-500">GitHub Stars</div>
            <div className="text-xs text-gray-500">{startup.githubStats.commits} commits</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <a 
              href={startup.website}
              className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors"
              title="Website"
            >
              <Globe className="w-4 h-4 text-blue-600" />
            </a>
            <a 
              href={startup.github}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              title="GitHub"
            >
              <Github className="w-4 h-4 text-gray-600" />
            </a>
            <a 
              href={`https://twitter.com/${startup.twitter.replace('@', '')}`}
              className="w-8 h-8 bg-sky-100 hover:bg-sky-200 rounded-lg flex items-center justify-center transition-colors"
              title="Twitter"
            >
              <Twitter className="w-4 h-4 text-sky-600" />
            </a>
          </div>
          
          <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-sm font-medium transition-all">
            View Details
          </button>
          
          {startup.competitionsWon > 0 && (
            <div className="flex items-center space-x-1 text-xs text-orange-600">
              <Trophy className="w-3 h-3" />
              <span>{startup.competitionsWon} wins</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Rocket className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                StartEx
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                Home
              </a>
              <a href="/dashboard" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                Dashboard
              </a>
              <a href="/competitions" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                Competitions
              </a>
              <a href="/leaderboard" className="text-orange-600 font-medium">
                Leaderboard
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              {userData && (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">Connected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3 rounded-full border border-orange-200">
            <Trophy className="w-5 h-5 text-orange-500 animate-pulse" />
            <span className="text-orange-700 font-semibold">Top Performers</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-gray-900">
            Startup
            <span className="block bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the top-performing startups in the StartEx ecosystem. Rankings based on community engagement, 
            development activity, and platform growth.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search startups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>
          
          <div className="flex space-x-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Sustainability">Sustainability</option>
              <option value="HealthTech">HealthTech</option>
              <option value="Education">Education</option>
              <option value="Developer Tools">Developer Tools</option>
              <option value="Supply Chain">Supply Chain</option>
            </select>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500"
            >
              <option value="overall">Overall</option>
              <option value="monthly">This Month</option>
              <option value="weekly">This Week</option>
              <option value="daily">Today</option>
            </select>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {filteredData.slice(0, 3).map((startup, index) => (
            <div key={startup.id} className={`relative ${
              index === 0 ? 'md:order-2 transform md:scale-110' :
              index === 1 ? 'md:order-1' : 'md:order-3'
            }`}>
              <div className={`bg-white/90 backdrop-blur-sm border-2 rounded-3xl p-8 text-center transition-all hover:shadow-2xl ${
                index === 0 ? 'border-yellow-300 bg-gradient-to-b from-yellow-50 to-orange-50' :
                index === 1 ? 'border-gray-300 bg-gradient-to-b from-gray-50 to-slate-50' :
                'border-orange-300 bg-gradient-to-b from-orange-50 to-red-50'
              }`}>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {getRankIcon(startup.rank)}
                  </div>
                  
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-2xl">{startup.tokenSymbol.slice(0, 2)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <h3 className="text-xl font-bold text-gray-900">{startup.name}</h3>
                      {startup.verified && <Award className="w-5 h-5 text-blue-500" />}
                    </div>
                    <p className="text-sm text-gray-600">{startup.description}</p>
                    <div className="text-xs text-gray-500">{startup.category}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-gray-900">{startup.score.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Total Score</div>
                    <div className={`text-sm font-medium ${
                      startup.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {startup.change} this week
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-bold text-blue-600">${startup.tokenPrice.toFixed(3)}</div>
                      <div className="text-gray-500">Price</div>
                    </div>
                    <div>
                      <div className="font-bold text-purple-600">{startup.holders}</div>
                      <div className="text-gray-500">Holders</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full Leaderboard */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Full Rankings</h2>
          {filteredData.slice(3).map((startup, index) => (
            <StartupRow key={startup.id} startup={startup} index={index + 3} />
          ))}
        </div>

        {/* Stats Footer */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Startups', value: '150+', icon: Rocket },
            { label: 'Total Score Points', value: '2.5M+', icon: Trophy },
            { label: 'Active Competitions', value: '25', icon: Target },
            { label: 'Community Members', value: '10K+', icon: Users }
          ].map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 text-center">
                <IconComponent className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}