import {
  makeContractCall,
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  createAssetInfo,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  createSTXPostCondition,
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
  principalCV,
  someCV,
  noneCV,
  contractPrincipalCV,
  standardPrincipalCV,
  callReadOnlyFunction,
  cvToJSON,
  hexToCV
} from '@stacks/transactions'

import {
  StacksTestnet,
  StacksMainnet,
  StacksNetwork
} from '@stacks/network'

import { AppConfig, UserSession, openContractCall } from '@stacks/connect'

// Network configuration
const network = new StacksTestnet() // Change to StacksMainnet() for production
const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' // Replace with deployed contract address

// Contract names
const STARTUP_REGISTRY_CONTRACT = 'startup-registry'
const TOKEN_FACTORY_CONTRACT = 'token-factory'
const SCORING_SYSTEM_CONTRACT = 'scoring-system'
const COMPETITION_CONTRACT = 'competition'

// User session for wallet interaction
const appConfig = new AppConfig(['store_write', 'publish_data'])
export const userSession = new UserSession({ appConfig })

// Contract interaction utilities
export class StartupRegistryContract {
  /**
   * Register a new startup
   */
  static async registerStartup(
    userSession: UserSession,
    params: {
      name: string
      description: string
      githubRepo: string
      website?: string
      twitter?: string
    }
  ) {
    const { name, description, githubRepo, website, twitter } = params
    
    const functionArgs = [
      stringAsciiCV(name.substring(0, 50)),
      stringAsciiCV(description.substring(0, 200)),
      stringAsciiCV(githubRepo.substring(0, 100)),
      website ? someCV(stringAsciiCV(website.substring(0, 100))) : noneCV(),
      twitter ? someCV(stringAsciiCV(twitter.substring(0, 50))) : noneCV()
    ]

    const options = {
      contractAddress,
      contractName: STARTUP_REGISTRY_CONTRACT,
      functionName: 'register-startup',
      functionArgs,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data: any) => {
        console.log('Startup registration transaction:', data.txId)
        return data
      },
      onCancel: () => {
        console.log('Transaction cancelled')
      },
    }

    return await openContractCall(options)
  }

  /**
   * Update startup information
   */
  static async updateStartup(
    userSession: UserSession,
    params: {
      startupId: number
      name: string
      description: string
      website?: string
      twitter?: string
    }
  ) {
    const { startupId, name, description, website, twitter } = params
    
    const functionArgs = [
      uintCV(startupId),
      stringAsciiCV(name.substring(0, 50)),
      stringAsciiCV(description.substring(0, 200)),
      website ? someCV(stringAsciiCV(website.substring(0, 100))) : noneCV(),
      twitter ? someCV(stringAsciiCV(twitter.substring(0, 50))) : noneCV()
    ]

    const options = {
      contractAddress,
      contractName: STARTUP_REGISTRY_CONTRACT,
      functionName: 'update-startup',
      functionArgs,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    }

    return await openContractCall(options)
  }

  /**
   * Get startup information (read-only)
   */
  static async getStartup(startupId: number) {
    const options = {
      contractAddress,
      contractName: STARTUP_REGISTRY_CONTRACT,
      functionName: 'get-startup',
      functionArgs: [uintCV(startupId)],
      network,
      senderAddress: contractAddress,
    }

    try {
      const result = await callReadOnlyFunction(options)
      return cvToJSON(result)
    } catch (error) {
      console.error('Error fetching startup:', error)
      return null
    }
  }

  /**
   * Get startup by owner (read-only)
   */
  static async getStartupByOwner(ownerAddress: string) {
    const options = {
      contractAddress,
      contractName: STARTUP_REGISTRY_CONTRACT,
      functionName: 'get-startup-by-owner',
      functionArgs: [standardPrincipalCV(ownerAddress)],
      network,
      senderAddress: contractAddress,
    }

    try {
      const result = await callReadOnlyFunction(options)
      return cvToJSON(result)
    } catch (error) {
      console.error('Error fetching startup by owner:', error)
      return null
    }
  }
}

export class TokenFactoryContract {
  /**
   * Tokenize a startup
   */
  static async tokenizeStartup(
    userSession: UserSession,
    params: {
      startupId: number
      tokenName: string
      tokenSymbol: string
      initialSupply: number
      decimals: number
    }
  ) {
    const { startupId, tokenName, tokenSymbol, initialSupply, decimals } = params
    
    const functionArgs = [
      uintCV(startupId),
      stringAsciiCV(tokenName.substring(0, 32)),
      stringAsciiCV(tokenSymbol.substring(0, 10)),
      uintCV(initialSupply),
      uintCV(decimals)
    ]

    // Add STX post condition for tokenization fee (1 STX)
    const postConditions = [
      makeStandardSTXPostCondition(
        userSession.loadUserData().profile.stxAddress.testnet,
        FungibleConditionCode.Equal,
        1000000 // 1 STX in microSTX
      )
    ]

    const options = {
      contractAddress,
      contractName: TOKEN_FACTORY_CONTRACT,
      functionName: 'tokenize-startup',
      functionArgs,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Deny,
      postConditions,
      onFinish: (data: any) => {
        console.log('Tokenization transaction:', data.txId)
        return data
      },
    }

    return await openContractCall(options)
  }

  /**
   * Transfer tokens
   */
  static async transferTokens(
    userSession: UserSession,
    params: {
      startupId: number
      amount: number
      recipient: string
    }
  ) {
    const { startupId, amount, recipient } = params
    const sender = userSession.loadUserData().profile.stxAddress.testnet
    
    const functionArgs = [
      uintCV(startupId),
      uintCV(amount),
      standardPrincipalCV(sender),
      standardPrincipalCV(recipient)
    ]

    const options = {
      contractAddress,
      contractName: TOKEN_FACTORY_CONTRACT,
      functionName: 'transfer',
      functionArgs,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    }

    return await openContractCall(options)
  }

  /**
   * Get token balance (read-only)
   */
  static async getBalance(startupId: number, holder: string) {
    const options = {
      contractAddress,
      contractName: TOKEN_FACTORY_CONTRACT,
      functionName: 'get-balance',
      functionArgs: [uintCV(startupId), standardPrincipalCV(holder)],
      network,
      senderAddress: contractAddress,
    }

    try {
      const result = await callReadOnlyFunction(options)
      return cvToJSON(result).value
    } catch (error) {
      console.error('Error fetching balance:', error)
      return 0
    }
  }

  /**
   * Get token info (read-only)
   */
  static async getTokenInfo(startupId: number) {
    const options = {
      contractAddress,
      contractName: TOKEN_FACTORY_CONTRACT,
      functionName: 'get-token-info',
      functionArgs: [uintCV(startupId)],
      network,
      senderAddress: contractAddress,
    }

    try {
      const result = await callReadOnlyFunction(options)
      return cvToJSON(result)
    } catch (error) {
      console.error('Error fetching token info:', error)
      return null
    }
  }
}

export class ScoringSystemContract {
  /**
   * Initialize metrics for a startup
   */
  static async initializeMetrics(
    userSession: UserSession,
    startupId: number
  ) {
    const functionArgs = [uintCV(startupId)]

    const options = {
      contractAddress,
      contractName: SCORING_SYSTEM_CONTRACT,
      functionName: 'initialize-metrics',
      functionArgs,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    }

    return await openContractCall(options)
  }

  /**
   * Update GitHub metrics
   */
  static async updateGitHubMetrics(
    userSession: UserSession,
    params: {
      startupId: number
      commits: number
      stars: number
      forks: number
    }
  ) {
    const { startupId, commits, stars, forks } = params
    
    const functionArgs = [
      uintCV(startupId),
      uintCV(commits),
      uintCV(stars),
      uintCV(forks)
    ]

    const options = {
      contractAddress,
      contractName: SCORING_SYSTEM_CONTRACT,
      functionName: 'update-github-metrics',
      functionArgs,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    }

    return await openContractCall(options)
  }

  /**
   * Get startup metrics (read-only)
   */
  static async getMetrics(startupId: number) {
    const options = {
      contractAddress,
      contractName: SCORING_SYSTEM_CONTRACT,
      functionName: 'get-metrics',
      functionArgs: [uintCV(startupId)],
      network,
      senderAddress: contractAddress,
    }

    try {
      const result = await callReadOnlyFunction(options)
      return cvToJSON(result)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      return null
    }
  }

  /**
   * Get startup score (read-only)
   */
  static async getScore(startupId: number) {
    const options = {
      contractAddress,
      contractName: SCORING_SYSTEM_CONTRACT,
      functionName: 'get-score',
      functionArgs: [uintCV(startupId)],
      network,
      senderAddress: contractAddress,
    }

    try {
      const result = await callReadOnlyFunction(options)
      return cvToJSON(result).value || 0
    } catch (error) {
      console.error('Error fetching score:', error)
      return 0
    }
  }
}

export class CompetitionContract {
  /**
   * Join a competition
   */
  static async joinCompetition(
    userSession: UserSession,
    params: {
      competitionId: number
      startupId: number
    }
  ) {
    const { competitionId, startupId } = params
    
    const functionArgs = [
      uintCV(competitionId),
      uintCV(startupId)
    ]

    const options = {
      contractAddress,
      contractName: COMPETITION_CONTRACT,
      functionName: 'join-competition',
      functionArgs,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    }

    return await openContractCall(options)
  }

  /**
   * Get competition info (read-only)
   */
  static async getCompetition(competitionId: number) {
    const options = {
      contractAddress,
      contractName: COMPETITION_CONTRACT,
      functionName: 'get-competition',
      functionArgs: [uintCV(competitionId)],
      network,
      senderAddress: contractAddress,
    }

    try {
      const result = await callReadOnlyFunction(options)
      return cvToJSON(result)
    } catch (error) {
      console.error('Error fetching competition:', error)
      return null
    }
  }

  /**
   * Get participant info (read-only)
   */
  static async getParticipant(competitionId: number, startupId: number) {
    const options = {
      contractAddress,
      contractName: COMPETITION_CONTRACT,
      functionName: 'get-participant',
      functionArgs: [uintCV(competitionId), uintCV(startupId)],
      network,
      senderAddress: contractAddress,
    }

    try {
      const result = await callReadOnlyFunction(options)
      return cvToJSON(result)
    } catch (error) {
      console.error('Error fetching participant:', error)
      return null
    }
  }
}

// Utility functions
export const ContractUtils = {
  /**
   * Get user's STX balance
   */
  async getUserSTXBalance(address: string): Promise<number> {
    try {
      const response = await fetch(`${network.coreApiUrl}/v2/accounts/${address}`)
      const data = await response.json()
      return parseInt(data.balance) / 1000000 // Convert microSTX to STX
    } catch (error) {
      console.error('Error fetching STX balance:', error)
      return 0
    }
  },

  /**
   * Format STX amount
   */
  formatSTX(amount: number): string {
    return (amount / 1000000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }) + ' STX'
  },

  /**
   * Check if user has enough STX for transaction
   */
  async checkSTXBalance(address: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getUserSTXBalance(address)
    return balance >= requiredAmount
  },

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txId: string): Promise<boolean> {
    const maxAttempts = 30
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${network.coreApiUrl}/extended/v1/tx/${txId}`)
        const data = await response.json()

        if (data.tx_status === 'success') {
          return true
        } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
          console.error('Transaction failed:', data)
          return false
        }

        // Wait 2 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 2000))
        attempts++
      } catch (error) {
        console.error('Error checking transaction status:', error)
        attempts++
      }
    }

    console.warn('Transaction confirmation timeout')
    return false
  }
}

// Export all contract classes
export {
  network,
  contractAddress,
  STARTUP_REGISTRY_CONTRACT,
  TOKEN_FACTORY_CONTRACT,
  SCORING_SYSTEM_CONTRACT,
  COMPETITION_CONTRACT
}