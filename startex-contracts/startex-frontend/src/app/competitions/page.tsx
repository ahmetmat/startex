'use client'

import { useEffect, useMemo, useState } from 'react'
import { sendStx } from '../../lib/stacks/wallet'
import { 
  Trophy, 
  Calendar, 
  Users, 
  Coins, 
  Filter,
  Search,
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

import { HeaderWalletControls } from '@/components/HeaderWalletControls'
import { MainHeader } from '@/components/MainHeader'
import { DonationModal } from '@/components/DonationModal'
import { getLocalStorage, isConnected as stacksIsConnected } from '@stacks/connect'

const MIN_DONATION_STX = 10
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS ?? 'SPADMIN1234567890EXAMPLEADMINADDR'

type CompetitionStatus = 'active' | 'upcoming' | 'ended'

type CompetitionDonation = {
  id: string
  donor: string
  amount: number
  timestamp: string
  txId: string
  recipient: string
}

type CompetitionState = {
  id: number
  name: string
  description: string
  status: CompetitionStatus
  type: string
  startDate: string
  endDate: string
  participants: number
  prizePool: string
  currency: string
  category: string
  difficulty: 'Low' | 'Medium' | 'High'
  requirements: string[]
  prizes: {
    first: string
    second: string
    third: string
  }
  metrics: string[]
  joined: boolean
  myRank?: number
  daysLeft?: number
  registrationEnds?: string
  featured: boolean
  maxParticipants?: number
  donationPool: {
    isOpen: boolean
    poolBalance: number
    donations: CompetitionDonation[]
    winner?: string
    winnerDeclaredAt?: string
  }
}

export default function Competitions() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [competitions, setCompetitions] = useState<CompetitionState[]>([
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
      featured: true,
      donationPool: {
        isOpen: true,
        poolBalance: 0,
        donations: []
      }
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
      featured: true,
      donationPool: {
        isOpen: false,
        poolBalance: 0,
        donations: []
      }
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
      featured: false,
      donationPool: {
        isOpen: false,
        poolBalance: 0,
        donations: []
      }
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
      featured: false,
      donationPool: {
        isOpen: true,
        poolBalance: 0,
        donations: []
      }
    }
  ])

  const filteredCompetitions = useMemo(() => {
    const loweredSearch = searchQuery.toLowerCase()
    return competitions.filter((comp) => {
      const matchesSearch =
        comp.name.toLowerCase().includes(loweredSearch) ||
        comp.category.toLowerCase().includes(loweredSearch)

      if (selectedFilter === 'all') return matchesSearch
      if (selectedFilter === 'active') return comp.status === 'active' && matchesSearch
      if (selectedFilter === 'upcoming') return comp.status === 'upcoming' && matchesSearch
      if (selectedFilter === 'joined') return comp.joined && matchesSearch

      return matchesSearch
    })
  }, [competitions, searchQuery, selectedFilter])

  const competitionTotals = useMemo(() => {
    const totalBalance = competitions.reduce((total, comp) => total + comp.donationPool.poolBalance, 0)
    const openPools = competitions.filter((comp) => comp.donationPool.isOpen).length
    const totalDonations = competitions.reduce((total, comp) => total + comp.donationPool.donations.length, 0)
    return {
      totalBalance,
      openPools,
      totalDonations,
    }
  }, [competitions])

  const [activeDonation, setActiveDonation] = useState<CompetitionState | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  useEffect(() => {
    const readWalletAddress = () => {
      try {
        const storage = getLocalStorage?.()
        if (!storage) return null
        const raw = (storage as any)?.addresses
        if (Array.isArray(raw)) {
          const entry = raw.find((item) => item?.symbol === 'STX')
          return typeof entry?.address === 'string' ? entry.address : null
        }
        const structured = (raw as any)?.stx
        if (Array.isArray(structured)) {
          const entry = structured[0]
          return typeof entry?.address === 'string' ? entry.address : null
        }
      } catch {
        return null
      }
      return null
    }

    if (stacksIsConnected?.()) {
      setWalletAddress(readWalletAddress())
    } else {
      setWalletAddress(readWalletAddress())
    }

    const handleStorage = () => {
      setWalletAddress(readWalletAddress())
    }

    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const isConnected = typeof walletAddress === 'string' && walletAddress.length > 0
  const isAdmin = isConnected && walletAddress?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()

  const openDonationModal = (competitionId: number) => {
    if (!isConnected) {
      window.alert('Bağış yapabilmek için önce cüzdanınızı bağlamanız gerekiyor.')
      return
    }
    const target = competitions.find((comp) => comp.id === competitionId)
    if (target) {
      setActiveDonation(target)
    }
  }

  const closeDonationModal = () => {
    setActiveDonation(null)
  }

  const handleCompetitionDonation = async (competitionId: number, amount: number, txId: string) => {
    const timestamp = new Date().toISOString()
    const donationId = `donation-${competitionId}-${Date.now()}`

    let donationRecord: CompetitionDonation | null = null

    setCompetitions((prev) =>
      prev.map((competition) => {
        if (competition.id !== competitionId) return competition

        donationRecord = {
          id: donationId,
          donor: `supporter-${String(competition.donationPool.donations.length + 1).padStart(3, '0')}`,
          amount,
          timestamp,
          txId,
          recipient: ADMIN_ADDRESS,
        }

        const updatedPool = {
          ...competition.donationPool,
          poolBalance: Number((competition.donationPool.poolBalance + amount).toFixed(2)),
          donations: [donationRecord, ...competition.donationPool.donations],
        }

        return {
          ...competition,
          donationPool: updatedPool,
        }
      }),
    )

    if (donationRecord) {
      setActiveDonation(null)
    }
  }

  const setRoundStatus = (competitionId: number, isOpen: boolean) => {
    setCompetitions((prev) =>
      prev.map((competition) =>
        competition.id === competitionId
          ? {
              ...competition,
              donationPool: {
                ...competition.donationPool,
                isOpen,
              },
            }
          : competition,
      ),
    )

    setActiveDonation((prev) =>
      prev && prev.id === competitionId
        ? {
            ...prev,
            donationPool: {
              ...prev.donationPool,
              isOpen,
            },
          }
        : prev,
    )
  }

  const declareWinner = (competitionId: number) => {
    const competition = competitions.find((comp) => comp.id === competitionId)
    if (!competition) return

    const winner = window.prompt('Kazanan girişimin adı veya kimliği nedir?')?.trim()
    if (!winner) return

    const declaredAt = new Date().toISOString()

    setCompetitions((prev) =>
      prev.map((comp) =>
        comp.id === competitionId
          ? {
              ...comp,
              donationPool: {
                ...comp.donationPool,
                isOpen: false,
                winner,
                winnerDeclaredAt: declaredAt,
              },
            }
          : comp,
      ),
    )

    setActiveDonation((prev) =>
      prev && prev.id === competitionId
        ? {
            ...prev,
            donationPool: {
              ...prev.donationPool,
              isOpen: false,
              winner,
              winnerDeclaredAt: declaredAt,
            },
          }
        : prev,
    )
  }

  const CompetitionCard = ({
    competition,
    onDonate,
    onOpenRound,
    onCloseRound,
    onDeclareWinner,
  }: {
    competition: CompetitionState
    onDonate: (competitionId: number) => void
    onOpenRound: (competitionId: number) => void
    onCloseRound: (competitionId: number) => void
    onDeclareWinner: (competitionId: number) => void
  }) => {
    const isActive = competition.status === 'active'
    const isUpcoming = competition.status === 'upcoming'
    const isJoined = competition.joined
    const pool = competition.donationPool
    const donorsCount = pool.donations.length

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


        {/* Donation Pool Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/70 border border-orange-200 rounded-2xl p-4 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Paylaşılan Havuz</p>
              <p className="text-lg font-bold text-gray-900">{pool.poolBalance.toFixed(2)} STX</p>
            </div>
          </div>

          <div className="bg-white/70 border border-orange-200 rounded-2xl p-4 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Bağışçılar</p>
              <p className="text-lg font-bold text-gray-900">{donorsCount}</p>
              {donorsCount > 0 && (
                <p className="text-xs text-gray-500">Son bağış: {new Date(pool.donations[0]?.timestamp ?? '').toLocaleString()}</p>
              )}
            </div>
          </div>

          <div className="bg-white/70 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Bağış Turu</p>
              <p className={`text-lg font-bold ${pool.isOpen ? 'text-green-600' : 'text-gray-700'}`}>
                {pool.isOpen ? 'Açık' : 'Kapalı'}
              </p>
              {pool.winner && (
                <div className="flex items-center space-x-1 text-xs text-orange-600 mt-1">
                  <Star className="w-4 h-4" />
                  <span>Kazanan: {pool.winner}</span>
                </div>
              )}
            </div>
            <div className="text-gray-400">
              <Eye className="w-6 h-6" />
            </div>
          </div>
        </div>

        {donorsCount > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Son Bağışlar</h4>
            <div className="space-y-2">
              {pool.donations.slice(0, 3).map((donation) => (
                <div key={donation.id} className="flex items-center justify-between bg-white/60 border border-gray-200 rounded-xl py-2 px-4 text-sm text-gray-600">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{donation.donor}</span>
                    <span className="text-[10px] text-gray-400">TX: {(donation.txId ?? '').slice(0, 10)}…</span>
                  </div>
                  <div className="text-right text-xs text-gray-500 space-y-1">
                    <div className="font-semibold text-gray-900">{donation.amount.toFixed(2)} STX</div>
                    <div>{new Date(donation.timestamp).toLocaleTimeString()}</div>
                    <div>{(donation.recipient ?? ADMIN_ADDRESS).slice(0, 10)}…</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(competition.startDate).toLocaleDateString()} - {new Date(competition.endDate).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{pool.isOpen ? 'Bağış turu açık' : 'Bağış turu kapalı'}</span>
            </span>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => onDonate(competition.id)}
                disabled={!pool.isOpen}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                  pool.isOpen
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Bağış Yap (≥ {MIN_DONATION_STX} STX)</span>
              </button>

              <button className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-medium transition-all hover:bg-gray-50">
                View Details
              </button>

              {!isJoined ? (
                <button className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
                    : isUpcoming
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                >
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

            <div className="flex flex-wrap gap-3 text-xs text-gray-500 justify-end">
              <span>Bağışlar yarışma havuzuna eklenir ve tur kapandığında kazanan açıklanır.</span>
              <span>Minimum bağış {MIN_DONATION_STX} STX.</span>
              <span>Hedef hesap: {ADMIN_ADDRESS.slice(0, 10)}…</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 justify-end">
              <span className="inline-flex items-center space-x-1 font-medium text-gray-600">
                <Filter className="w-3 h-3" />
                <span>Yönetici Kontrolleri</span>
              </span>
              {isAdmin ? (
                <>
                  <button
                    onClick={() => onOpenRound(competition.id)}
                    disabled={pool.isOpen}
                    className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                      pool.isOpen
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-green-200 text-green-600 hover:border-green-300'
                    }`}
                  >
                    Turu Aç
                  </button>
                  <button
                    onClick={() => onCloseRound(competition.id)}
                    disabled={!pool.isOpen}
                    className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                      pool.isOpen
                        ? 'border-red-200 text-red-600 hover:border-red-300'
                        : 'border-gray-200 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Turu Kapat
                  </button>
                  <button
                    onClick={() => onDeclareWinner(competition.id)}
                    disabled={pool.donations.length === 0 || !!pool.winner}
                    className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                      pool.donations.length === 0 || !!pool.winner
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-orange-200 text-orange-600 hover:border-orange-300'
                    }`}
                  >
                    Kazananı Açıkla
                  </button>
                </>
              ) : (
                <span className="text-xs text-gray-400">
                  {isConnected
                    ? `Bu kontroller yalnızca yönetici (${ADMIN_ADDRESS}) tarafından kullanılabilir.`
                    : 'Yönetici kontrollerini görmek için cüzdanınızı bağlayın.'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
      <MainHeader
        highlightPath="/competitions"
        rightSlot={<HeaderWalletControls />}
      />

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

        {/* Bağış Özeti */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white/80 backdrop-blur border border-orange-200 rounded-2xl p-5 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Toplam Havuz Büyüklüğü</p>
              <p className="text-xl font-bold text-gray-900">{competitionTotals.totalBalance.toFixed(2)} STX</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur border border-orange-200 rounded-2xl p-5 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Açık Bağış Turları</p>
              <p className="text-xl font-bold text-gray-900">{competitionTotals.openPools}</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur border border-orange-200 rounded-2xl p-5 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Toplam Bağış</p>
              <p className="text-xl font-bold text-gray-900">{competitionTotals.totalDonations}</p>
            </div>
          </div>
        </div>

        {/* Competitions Grid */}
        <div className="space-y-8">
          {filteredCompetitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              onDonate={openDonationModal}
              onOpenRound={(id) => setRoundStatus(id, true)}
              onCloseRound={(id) => setRoundStatus(id, false)}
              onDeclareWinner={declareWinner}
            />
          ))}
          
          {filteredCompetitions.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto" />
              <h3 className="text-2xl font-bold text-gray-400">No competitions found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        <DonationModal
  isOpen={!!activeDonation}
  onClose={closeDonationModal}
  minAmount={MIN_DONATION_STX}
  title={activeDonation ? `${activeDonation.name} için bağış yap` : 'Bağış Yap'}
  description={activeDonation
    ? `${activeDonation.name} bağışları yarışma havuzuna eklenir. (Hedef hesap: ${ADMIN_ADDRESS})`
    : `Bağışlar yarışma havuzuna yönlendirilir. (Hedef hesap: ${ADMIN_ADDRESS})`}
  onConfirm={async (amount /* no txId */) => {
    if (!activeDonation) return
    // 1) On-chain gönder
    const txId = await sendStx({
      to: ADMIN_ADDRESS,
      amountStx: amount,
      memo: `StartEx:comp#${activeDonation.id}`,
    })
    // 2) UI state’ini güncelle
    await handleCompetitionDonation(activeDonation.id, amount, txId)
  }}
/>

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
