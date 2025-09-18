// GitHub API Integration for StartEx
// This module handles fetching repository statistics and metrics

export interface GitHubRepoStats {
  owner: string
  repo: string
  stars: number
  forks: number
  watchers: number
  commits: number
  contributors: number
  issues: number
  pullRequests: number
  lastCommitDate: string
  createdAt: string
  updatedAt: string
  language: string
  topics: string[]
  description: string
  license: string | null
}

export interface GitHubCommitActivity {
  week: number
  commits: number
  additions: number
  deletions: number
}

export class GitHubAPI {
  private static readonly BASE_URL = 'https://api.github.com'
  private static readonly HEADERS = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'StartEx-Platform'
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  static parseGitHubURL(url: string): { owner: string; repo: string } | null {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)$/,
      /github\.com\/([^\/]+)\/([^\/]+)\.git$/,
      /github\.com\/([^\/]+)\/([^\/]+)\/$/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace('.git', '')
        }
      }
    }

    return null
  }

  /**
   * Fetch repository basic information
   */
  static async getRepositoryInfo(owner: string, repo: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/repos/${owner}/${repo}`,
        { headers: this.HEADERS }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching repository info:', error)
      throw error
    }
  }

  /**
   * Fetch repository commit count
   */
  static async getCommitCount(owner: string, repo: string): Promise<number> {
    try {
      // Get commits from the default branch
      const response = await fetch(
        `${this.BASE_URL}/repos/${owner}/${repo}/commits?per_page=1`,
        { headers: this.HEADERS }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      // Get total count from Link header
      const linkHeader = response.headers.get('link')
      if (linkHeader) {
        const match = linkHeader.match(/page=(\d+)>; rel="last"/)
        if (match) {
          return parseInt(match[1])
        }
      }

      // Fallback: count commits manually (limited to recent commits)
      const commits = await response.json()
      return commits.length
    } catch (error) {
      console.error('Error fetching commit count:', error)
      return 0
    }
  }

  /**
   * Fetch repository contributors
   */
  static async getContributors(owner: string, repo: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/repos/${owner}/${repo}/contributors`,
        { headers: this.HEADERS }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching contributors:', error)
      return []
    }
  }

  /**
   * Fetch repository issues and PRs count
   */
  static async getIssuesAndPRs(owner: string, repo: string): Promise<{ issues: number; prs: number }> {
    try {
      const [issuesResponse, prsResponse] = await Promise.all([
        fetch(`${this.BASE_URL}/repos/${owner}/${repo}/issues?state=all&per_page=1`, { headers: this.HEADERS }),
        fetch(`${this.BASE_URL}/repos/${owner}/${repo}/pulls?state=all&per_page=1`, { headers: this.HEADERS })
      ])

      const getCountFromHeader = (response: Response): number => {
        const linkHeader = response.headers.get('link')
        if (linkHeader) {
          const match = linkHeader.match(/page=(\d+)>; rel="last"/)
          if (match) {
            return parseInt(match[1])
          }
        }
        return 0
      }

      return {
        issues: getCountFromHeader(issuesResponse),
        prs: getCountFromHeader(prsResponse)
      }
    } catch (error) {
      console.error('Error fetching issues and PRs:', error)
      return { issues: 0, prs: 0 }
    }
  }

  /**
   * Fetch commit activity for the past year
   */
  static async getCommitActivity(owner: string, repo: string): Promise<GitHubCommitActivity[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/repos/${owner}/${repo}/stats/commit_activity`,
        { headers: this.HEADERS }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()
      return data.map((week: any) => ({
        week: week.week,
        commits: week.total,
        additions: 0, // This would require additional API calls
        deletions: 0
      }))
    } catch (error) {
      console.error('Error fetching commit activity:', error)
      return []
    }
  }

  /**
   * Get comprehensive repository statistics
   */
  static async getRepositoryStats(githubUrl: string): Promise<GitHubRepoStats | null> {
    try {
      const parsed = this.parseGitHubURL(githubUrl)
      if (!parsed) {
        throw new Error('Invalid GitHub URL')
      }

      const { owner, repo } = parsed

      // Fetch basic repository info
      const repoInfo = await this.getRepositoryInfo(owner, repo)
      
      // Fetch additional metrics in parallel
      const [commitCount, contributors, issuesAndPRs] = await Promise.all([
        this.getCommitCount(owner, repo),
        this.getContributors(owner, repo),
        this.getIssuesAndPRs(owner, repo)
      ])

      return {
        owner,
        repo,
        stars: repoInfo.stargazers_count || 0,
        forks: repoInfo.forks_count || 0,
        watchers: repoInfo.watchers_count || 0,
        commits: commitCount,
        contributors: contributors.length,
        issues: issuesAndPRs.issues,
        pullRequests: issuesAndPRs.prs,
        lastCommitDate: repoInfo.pushed_at || repoInfo.updated_at,
        createdAt: repoInfo.created_at,
        updatedAt: repoInfo.updated_at,
        language: repoInfo.language || 'Unknown',
        topics: repoInfo.topics || [],
        description: repoInfo.description || '',
        license: repoInfo.license?.name || null
      }
    } catch (error) {
      console.error('Error fetching repository stats:', error)
      return null
    }
  }

  /**
   * Validate if GitHub repository exists and is accessible
   */
  static async validateRepository(githubUrl: string): Promise<boolean> {
    try {
      const parsed = this.parseGitHubURL(githubUrl)
      if (!parsed) {
        return false
      }

      const { owner, repo } = parsed
      const response = await fetch(
        `${this.BASE_URL}/repos/${owner}/${repo}`,
        { 
          headers: this.HEADERS,
          method: 'HEAD' // Only check if exists, don't fetch data
        }
      )

      return response.ok
    } catch (error) {
      console.error('Error validating repository:', error)
      return false
    }
  }

  /**
   * Get repository languages
   */
  static async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/repos/${owner}/${repo}/languages`,
        { headers: this.HEADERS }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching repository languages:', error)
      return {}
    }
  }

  /**
   * Calculate repository health score
   */
  static calculateHealthScore(stats: GitHubRepoStats): number {
    if (!stats) return 0

    let score = 0

    // Stars (max 25 points)
    score += Math.min(stats.stars / 10, 25)

    // Forks (max 15 points)
    score += Math.min(stats.forks / 5, 15)

    // Recent activity (max 20 points)
    const daysSinceLastCommit = Math.floor((Date.now() - new Date(stats.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastCommit <= 7) score += 20
    else if (daysSinceLastCommit <= 30) score += 15
    else if (daysSinceLastCommit <= 90) score += 10
    else if (daysSinceLastCommit <= 180) score += 5

    // Contributors (max 15 points)
    score += Math.min(stats.contributors * 3, 15)

    // Issues and PRs activity (max 10 points)
    score += Math.min((stats.issues + stats.pullRequests) / 10, 10)

    // Repository age bonus (max 15 points)
    const monthsOld = Math.floor((Date.now() - new Date(stats.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
    if (monthsOld >= 12) score += 15
    else if (monthsOld >= 6) score += 10
    else if (monthsOld >= 3) score += 5

    return Math.round(score)
  }

  /**
   * Get trending score based on recent activity
   */
  static async getTrendingScore(owner: string, repo: string): Promise<number> {
    try {
      const activity = await this.getCommitActivity(owner, repo)
      if (!activity.length) return 0

      // Calculate trend based on last 4 weeks vs previous 4 weeks
      const recent4Weeks = activity.slice(-4).reduce((sum, week) => sum + week.commits, 0)
      const previous4Weeks = activity.slice(-8, -4).reduce((sum, week) => sum + week.commits, 0)

      if (previous4Weeks === 0) return recent4Weeks > 0 ? 100 : 0

      const trendPercentage = ((recent4Weeks - previous4Weeks) / previous4Weeks) * 100
      return Math.max(0, Math.min(100, trendPercentage))
    } catch (error) {
      console.error('Error calculating trending score:', error)
      return 0
    }
  }
}

// Helper functions for metric formatting
export const GitHubUtils = {
  /**
   * Format large numbers with K/M suffixes
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  },

  /**
   * Format date to relative time
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`
    return `${Math.ceil(diffDays / 365)} years ago`
  },

  /**
   * Get programming language color
   */
  getLanguageColor(language: string): string {
    const colors: Record<string, string> = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C': '#555555',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
      'HTML': '#e34c26',
      'CSS': '#1572B6',
      'Shell': '#89e051',
      'Dockerfile': '#384d54'
    }
    return colors[language] || '#666666'
  },

  /**
   * Validate GitHub repository URL format
   */
  isValidGitHubUrl(url: string): boolean {
    const patterns = [
      /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/,
      /^https:\/\/github\.com\/[^\/]+\/[^\/]+\.git$/
    ]
    return patterns.some(pattern => pattern.test(url))
  }
}

// Rate limiting and caching
export class GitHubAPICache {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

  static get(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  static set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  static clear(): void {
    this.cache.clear()
  }
}

// Enhanced GitHubAPI with caching
export class CachedGitHubAPI extends GitHubAPI {
  static async getRepositoryStats(githubUrl: string): Promise<GitHubRepoStats | null> {
    const cacheKey = `repo_stats_${githubUrl}`
    const cached = GitHubAPICache.get(cacheKey)
    if (cached) {
      return cached
    }

    const stats = await super.getRepositoryStats(githubUrl)
    if (stats) {
      GitHubAPICache.set(cacheKey, stats)
    }
    
    return stats
  }

  static async validateRepository(githubUrl: string): Promise<boolean> {
    const cacheKey = `repo_valid_${githubUrl}`
    const cached = GitHubAPICache.get(cacheKey)
    if (cached !== null) {
      return cached
    }

    const isValid = await super.validateRepository(githubUrl)
    GitHubAPICache.set(cacheKey, isValid)
    
    return isValid
  }
}