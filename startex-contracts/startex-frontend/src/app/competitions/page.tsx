'use client'

import { useState, useEffect } from 'react'
import { AppConfig, UserSession } from '@stacks/auth'
import { 
  Trophy, 
  Calendar, 
  Users, 
  Coins, 
  Filter,
  Search,
  Rocket,
  Award,
  Clock,
  TrendingUp,
  Star,
  Eye,
  ArrowRight,
  Play,
  Target,
  Zap,
  Crown,
  Medal,
  Gift
} from 'lucide-react'

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })

export default function Competitions() {
  const [userData, setUserData] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [competitions, setCompetitions] = useState([
    {
      id: 1,
      name: 'January Growth Challenge',
      description: 'Compete for the highest growth metrics this month. Track your GitHub activity, social media growth, and platform engagement.',
      status: 'active',
      type: 'monthly',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      participants: 127,
      prizePool: '15000',
      currency: 'STX',
      category: 'Growth',
      difficulty: 'Medium',
      requirements: ['Active GitHub repository', 'Social media presence', 'Minimum 30 days since launch'],
      prizes: {
        first: '7500 STX',
        second: '4500 STX',
        third: '3000 STX'
      },
      metrics: ['GitHub commits', 'Stars gained', 'Twitter followers', 'Platform posts'],
      joined: true,
      myRank: 3,
      daysLeft: 12,
      featured: true
    },
    {
      id: 2,
      name: 'Demo Day Showcase',
      description: 'Present your latest product demo to investors and the community. Best demos win funding opportunities.',
      status: 'upcoming',
      type: 'event',
      startDate: '2025-02-15',
      endDate: '2025-02-15',
      participants: 0,
      maxParticipants: 50,
      prizePool: '25000',
      currency: 'STX',
      category: 'Demo',
      difficulty: 'High',
      requirements: ['Working product demo', 'Pitch deck', 'Video presentation under 5 minutes'],
      prizes: {
        first: '15000 STX + Investor Meetings',
        second: '7000 STX + Mentorship',
        third: '3000 STX + Community Recognition'
      },
      metrics: ['Demo quality', 'Investor votes', 'Community engagement'],
      joined: false,
      registrationEnds: '2025-02-10',
      featured: true
    },
    {
      id: 3,
      name: 'AI Innovation Sprint',
      description: 'Build innovative AI features for your startup. Focus on practical implementation and user impact.',
      status: 'upcoming',
      type: 'sprint',
      startDate: '2025-02-01',
      endDate: '2025-02-07',
      participants: 23,
      maxParticipants: 100,
      prizePool: '10000',
      currency: 'STX',
      category: 'Innovation',
      difficulty: 'High',
      requirements: ['AI/ML integration', 'Technical documentation', 'User testing results'],
      prizes: {
        first: '5000 STX',
        second: '3000 STX',
        third: '2000 STX'
      },
      metrics: ['Technical innovation', 'User impact', 'Code quality'],
      joined: false,
      featured: false
    },
    {
      id: 4,
      name: 'Community Building Contest',
      description: 'Grow and engage your startup community. Build meaningful connections with users and supporters.',
      status: 'active',
      type: 'ongoing',
      startDate: '2025-01-15',
      endDate: '2025-03-15',
      participants: 89,
      prizePool: '8000',
      currency: 'STX',
      category: 'Community',
      difficulty: 'Low',
      requirements: ['Active community channels', 'Regular user engagement', 'Content creation'],
      prizes: {
        first: '4000 STX',
        second: '2500 STX',
        third: '1500 STX'
      },
      metrics: ['Community growth', 'Engagement rate', 'Content quality'],
      joined: false,
      daysLeft: 45,
      featured: false
    }
  ])

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData() as any)
    }
  }, [])

  const filteredCompetitions = competitions.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         comp.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (selectedFilter === 'all') return matchesSearch
    if (selectedFilter === 'active') return comp.status === 'active' && matchesSearch
    if (selectedFilter === 'upcoming') return comp.status === 'upcoming' && matchesSearch
    if (selectedFilter === 'joined') return comp.joined && matchesSearch
    
    return matchesSearch
  })

  const CompetitionCard = ({ competition }) => {
    const isActive = competition.status === 'active'
    const isUpcoming = competition.status === 'upcoming'
    const isJoined = competition.joined

    return (
      <div className={`bg-white/80 backdrop-blur-sm border-2 rounded-3xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
        competition.featured ? 'border-orange-300 bg-gradient-to-br from-orange-50/50 to-red-50/50' : 'border-gray-200'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              isUpcoming ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              'bg-gradient-to-r from-gray-500 to-gray-600'
            }`}>
              {competition.category === 'Growth' && <TrendingUp className="w-8 h-8 text-white" />}
              {competition.category === 'Demo' && <Play className="w-8 h-8 text-white" />}
              {competition.category === 'Innovation' && <Zap className="w-8 h-8 text-white" />}
              {competition.category === 'Community' && <Users className="w-8 h-8 text-white" />}
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-2xl font-bold text-gray-900">{competition.name}</h3>
                {competition.featured && (
                  <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <p className="text-gray-600 max-w-2xl leading-relaxed">{competition.description}</p>
            </div>
          </div>

          <div className="text-right space-y-2">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              isActive ? 'bg-green-100 text-green-800' :
              isUpcoming ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {isActive ? 'ACTIVE' : isUpcoming ? 'UPCOMING' : 'ENDED'}
            </span>
            {isJoined && (
              <div className="flex items-center space-x-1 text-orange-600 font-medium text-sm">
                <Award className="w-4 h-4" />
                <span>Joined</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-gray-900">{competition.participants}</div>
            <div className="text-sm text-gray-500">Participants</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              {competition.prizePool}
            </div>
            <div className="text-sm text-gray-500">{competition.currency} Prize</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-gray-900">
              {competition.difficulty === 'Low' && '⭐'}
              {competition.difficulty === 'Medium' && '⭐⭐'}
              {competition.difficulty === 'High' && '⭐⭐⭐'}
            </div>
            <div className="text-sm text-gray-500">{competition.difficulty}</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-gray-900">
              {competition.daysLeft ? competition.daysLeft : 
               isUpcoming ? new Date(competition.startDate).getDate() - new Date().getDate() : '--'}
            </div>
            <div className="text-sm text-gray-500">Days Left</div>
          </div>
        </div>

        {/* Prize Breakdown */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Prize Distribution</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-3 text-center border border-yellow-200">
              <Medal className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
              <div className="text-sm font-medium text-yellow-800">1st Place</div>
              <div className="text-xs text-yellow-700">{competition.prizes.first}</div>
            </div>
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-3 text-center border border-gray-300">
              <Medal className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium text-gray-800">2nd Place</div>
              <div className="text-xs text-gray-700">{competition.prizes.second}</div>
            </div>
            <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-3 text-center border border-orange-200">
              <Medal className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <div className="text-sm font-medium text-orange-800">3rd Place</div>
              <div className="text-xs text-orange-700">{competition.prizes.third}</div>
            </div>
          </div>
        </div>

        {/* Metrics & Requirements */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Judging Criteria</h4>
            <div className="space-y-1">
              {competition.metrics.map((metric, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                  <Target className="w-3 h-3 text-orange-500" />
                  <span>{metric}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
            <div className="space-y-1">
              {competition.requirements.slice(0, 2).map((req, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>{req}</span>
                </div>
              ))}
              {competition.requirements.length > 2 && (
                <div className="text-xs text-gray-500">+{competition.requirements.length - 2} more</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(competition.startDate).toLocaleDateString()} - {new Date(competition.endDate).toLocaleDateString()}</span>
            </span>
          </div>

          <div className="flex space-x-3">
            <button className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-medium transition-all hover:bg-gray-50">
              View Details
            </button>
            
            {!isJoined ? (
              <button className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${
                isActive 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
                  : isUpcoming
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}>
                <span>{isActive ? 'Join Now' : isUpcoming ? 'Register' : 'Ended'}</span>
                {(isActive || isUpcoming) && <ArrowRight className="w-4 h-4" />}
              </button>
            ) : (
              <button className="px-8 py-3 bg-orange-100 border-2 border-orange-300 text-orange-700 rounded-xl font-bold cursor-default">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4" />
                  <span>Rank #{competition.myRank}</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

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
              <a href="/competitions" className="text-orange-600 font-medium">
                Competitions
              </a>
              <a href="/leaderboard" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
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
            <span className="text-orange-700 font-semibold">Compete & Win</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-gray-900">
            Startup
            <span className="block bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Competitions
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join exciting competitions, showcase your startup, and compete for amazing prizes. 
            Build your community while growing your business.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search competitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>
          
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', icon: Trophy },
              { key: 'active', label: 'Active', icon: Play },
              { key: 'upcoming', label: 'Upcoming', icon: Clock },
              { key: 'joined', label: 'Joined', icon: Award }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedFilter(key)}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  selectedFilter === key
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Competitions Grid */}
        <div className="space-y-8">
          {filteredCompetitions.map((competition) => (
            <CompetitionCard key={competition.id} competition={competition} />
          ))}
          
          {filteredCompetitions.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto" />
              <h3 className="text-2xl font-bold text-gray-400">No competitions found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-100 via-red-50 to-pink-100 rounded-3xl p-12 text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900">
              Ready to Compete?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join competitions, win prizes, and grow your startup with the StartEx community
            </p>
            <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
              Get Started Today
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}