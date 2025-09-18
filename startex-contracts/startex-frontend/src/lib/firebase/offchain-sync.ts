import { v4 as uuidv4 } from 'uuid'
import { GitHubAPI } from '../github-api'
import {
  createOrUpdateStartupProfile,
  saveMetricSnapshot,
  getLatestMetricSnapshot,
  getOrderBookSnapshot,
  saveOrderBookSnapshot,
} from './firestore'
import type {
  StartupProfile,
  LeaderboardEntry,
  MetricSnapshot,
  OrderBookSnapshot,
} from './types'

const DEFAULT_SNAPSHOT_PERIOD: MetricSnapshot['period'] = 'weekly'

export const calculateAggregateScore = (snapshot: MetricSnapshot) => {
  const githubScore = snapshot.github.stars * 2 + snapshot.github.commits * 0.5 + snapshot.github.contributors * 5
  const twitterScore = snapshot.twitter ? snapshot.twitter.followers * 0.1 : 0
  const tractionScore = snapshot.traction ? (snapshot.traction.users ?? 0) * 0.2 : 0

  return Math.round(githubScore + twitterScore + tractionScore)
}

export const syncGitHubMetrics = async (startup: StartupProfile) => {
  if (!startup.github) {
    throw new Error('Startup profile is missing GitHub repository URL')
  }

  const repoInfo = GitHubAPI.parseGitHubURL(startup.github)
  if (!repoInfo) {
    throw new Error('Invalid GitHub repository URL')
  }

  const [repository, contributors] = await Promise.all([
    GitHubAPI.getRepositoryInfo(repoInfo.owner, repoInfo.repo),
    GitHubAPI.getContributors(repoInfo.owner, repoInfo.repo),
  ])
  const commits = await GitHubAPI.getCommitCount(repoInfo.owner, repoInfo.repo)

  const snapshot: MetricSnapshot = {
    id: uuidv4(),
    startupId: startup.id,
    period: DEFAULT_SNAPSHOT_PERIOD,
    github: {
      stars: repository.stargazers_count ?? 0,
      forks: repository.forks_count ?? 0,
      commits,
      contributors: contributors.length ?? 0,
    },
    twitter: startup.twitter ? { followers: 0 } : undefined,
    aggregateScore: 0,
  }

  snapshot.aggregateScore = calculateAggregateScore(snapshot)
  await saveMetricSnapshot(startup.id, snapshot)
  return snapshot
}

export const upsertStartupProfileWithMetrics = async (profile: StartupProfile) => {
  await createOrUpdateStartupProfile(profile)
  const snapshot = await syncGitHubMetrics(profile)
  return snapshot
}

export const getOrCreateOrderBookSnapshot = async (tokenSymbol: string): Promise<OrderBookSnapshot> => {
  const existing = await getOrderBookSnapshot(tokenSymbol)
  if (existing) return existing

  const snapshot: OrderBookSnapshot = {
    tokenSymbol,
    bids: [],
    asks: [],
  }

  await saveOrderBookSnapshot(snapshot)
  return snapshot
}

export const leaderboardEntryFromProfile = (
  profile: StartupProfile,
  snapshot: MetricSnapshot,
): LeaderboardEntry => ({
  id: profile.id,
  startupId: profile.id,
  name: profile.name,
  category: profile.tags?.[0] ?? 'General',
  score: snapshot.aggregateScore,
  rank: profile.rank ?? 0,
  previousRank: profile.rank ?? undefined,
  tokenSymbol: profile.tokenSymbol,
  marketCap: profile.circulatingSupply && profile.tokenSymbol
    ? Math.round((profile.circulatingSupply ?? 0) * (profile.score ?? 0))
    : undefined,
  holders: profile.verified ? 0 : undefined,
  githubStats: snapshot.github,
  socialStats: snapshot.twitter ? { twitterFollowers: snapshot.twitter.followers } : undefined,
  website: profile.website,
  github: profile.github,
  twitter: profile.twitter,
})

export const ensureLatestSnapshot = async (profile: StartupProfile) => {
  const latest = await getLatestMetricSnapshot(profile.id)
  if (latest) {
    return latest
  }

  return syncGitHubMetrics(profile)
}
