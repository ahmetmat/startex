export type StartupProfile = {
  id: string // on-chain startup id or slug
  ownerAddress: string
  name: string
  description: string
  logoUrl?: string
  coverUrl?: string
  website?: string
  twitter?: string
  github?: string
  telegram?: string
  tags?: string[]
  totalSupply?: number
  circulatingSupply?: number
  tokenSymbol?: string
  tokenName?: string
  score?: number
  rank?: number
  verified?: boolean
  createdAt?: unknown
  updatedAt?: unknown
}

export type StartupSocialPost = {
  id: string
  authorAddress: string
  authorName?: string
  content: string
  mediaUrls?: string[]
  metrics?: {
    likes: number
    comments: number
    shares: number
  }
  createdAt?: unknown
  updatedAt?: unknown
}

export type StartupComment = {
  id: string
  authorAddress: string
  authorName?: string
  content: string
  parentCommentId?: string | null
  createdAt?: unknown
  updatedAt?: unknown
}

export type LeaderboardEntry = {
  id: string
  startupId: string
  name: string
  founder?: string
  description?: string
  category: string
  score: number
  rank: number
  previousRank?: number
  change?: string
  tokenSymbol?: string
  tokenPrice?: number
  priceChange?: string
  marketCap?: number
  holders?: number
  verified?: boolean
  githubStats?: {
    stars: number
    forks: number
    commits: number
  }
  socialStats?: {
    twitterFollowers?: number
    linkedinFollowers?: number
  }
  platformStats?: {
    posts?: number
    views?: number
  }
  competitionsWon?: number
  website?: string
  github?: string
  twitter?: string
  createdAt?: unknown
  updatedAt?: unknown
}

export type MetricSnapshot = {
  id: string
  startupId: string
  period: 'daily' | 'weekly' | 'monthly'
  github: {
    stars: number
    forks: number
    commits: number
    contributors: number
  }
  twitter?: {
    followers: number
    impressions?: number
  }
  traction?: {
    users?: number
    revenue?: number
    retention?: number
  }
  aggregateScore: number
  createdAt?: unknown
  updatedAt?: unknown
}

export type OrderBookSnapshot = {
  tokenSymbol: string
  tokenName?: string
  bids: Array<{ price: number; amount: number }>
  asks: Array<{ price: number; amount: number }>
  lastTrade?: {
    type: 'buy' | 'sell'
    price: number
    amount: number
    timestamp: number
  }
  spread?: number
  updatedAt?: unknown
}

export type NotificationPreference = {
  email?: string
  allowEmail: boolean
  allowPush: boolean
  topics?: string[]
  lastNotifiedAt?: unknown
}

export type ModerationReport = {
  id: string
  reporterAddress: string
  startupId?: string
  postId?: string
  commentId?: string
  type: 'spam' | 'abuse' | 'ip-violation' | 'other'
  details: string
  status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  createdAt?: unknown
  updatedAt?: unknown
  resolverAddress?: string
  resolutionNotes?: string
}

export type AuditLogEntry = {
  id: string
  actor: string
  action: string
  context?: Record<string, unknown>
  createdAt?: unknown
  updatedAt?: unknown
}
