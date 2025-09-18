// startex-contracts/startex-frontend/src/lib/contracts/calls.ts

import {
  openContractCall,
  callReadOnlyFunction,
} from '@stacks/connect'
import {
  uintCV,
  stringAsciiCV,
  someCV,
  noneCV,
  principalCV,
  standardPrincipalCV,
  contractPrincipalCV,
  cvToJSON,
  ClarityValue,
} from '@stacks/transactions'
import { StacksTestnet } from '@stacks/network'
import { userSession } from '../wallet/connection'

const network = new StacksTestnet()

// Contract addresses - bunları deploy ettikten sonra güncelleyeceksiniz
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDR || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'

const CONTRACTS = {
  registry: 'startup-registry',
  token: 'token-factory', 
  scoring: 'scoring-system',
  competition: 'competition',
}

// Helper function for contract calls
const makeContractCall = async (
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[],
  postConditions: any[] = []
) => {
  if (!userSession.isUserSignedIn()) {
    throw new Error('Please connect your wallet first')
  }

  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      anchorMode: 'any',
      contractAddress: CONTRACT_ADDRESS,
      contractName,
      functionName,
      functionArgs,
      postConditions,
      onFinish: (data) => {
        console.log('Transaction submitted:', data.txId)
        resolve(data)
      },
      onCancel: () => {
        reject(new Error('Transaction cancelled'))
      },
    })
  })
}

// Helper function for read-only calls
const callReadOnly = async (
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[] = []
) => {
  try {
    const result = await callReadOnlyFunction({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName,
      functionName,
      functionArgs,
      senderAddress: CONTRACT_ADDRESS,
    })
    return cvToJSON(result)
  } catch (error) {
    console.error('Read-only call failed:', error)
    return null
  }
}

// Registry contract functions
export const RegistryContract = {
  async registerStartup(params: {
    name: string
    description: string
    githubRepo: string
    website?: string
    twitter?: string
  }) {
    const { name, description, githubRepo, website, twitter } = params
    
    const functionArgs = [
      stringAsciiCV(name.substring(0, 50)),
      stringAsciiCV(description.substring(0, 200)),
      stringAsciiCV(githubRepo.substring(0, 100)),
      website ? someCV(stringAsciiCV(website.substring(0, 100))) : noneCV(),
      twitter ? someCV(stringAsciiCV(twitter.substring(0, 50))) : noneCV(),
    ]

    return makeContractCall(CONTRACTS.registry, 'register-startup', functionArgs)
  },

  async getStartup(startupId: number) {
    return callReadOnly(CONTRACTS.registry, 'get-startup', [uintCV(startupId)])
  },

  async getStartupByOwner(ownerAddress: string) {
    return callReadOnly(CONTRACTS.registry, 'get-startup-by-owner', [standardPrincipalCV(ownerAddress)])
  },

  async getNextStartupId() {
    return callReadOnly(CONTRACTS.registry, 'get-next-startup-id', [])
  },

  async setTokenAddress(startupId: number, tokenAddress: string) {
    const functionArgs = [
      uintCV(startupId),
      contractPrincipalCV(CONTRACT_ADDRESS, CONTRACTS.token),
    ]
    return makeContractCall(CONTRACTS.registry, 'set-token-address', functionArgs)
  },
}

// Token factory contract functions
export const TokenContract = {
  async tokenizeStartup(params: {
    startupId: number
    tokenName: string
    tokenSymbol: string
    initialSupply: number
    decimals: number
  }) {
    const { startupId, tokenName, tokenSymbol, initialSupply, decimals } = params
    
    const functionArgs = [
      uintCV(startupId),
      stringAsciiCV(tokenName.substring(0, 32)),
      stringAsciiCV(tokenSymbol.substring(0, 10)),
      uintCV(initialSupply),
      uintCV(decimals),
    ]

    return makeContractCall(CONTRACTS.token, 'tokenize-startup', functionArgs)
  },

  async getTokenInfo(startupId: number) {
    return callReadOnly(CONTRACTS.token, 'get-token-info', [uintCV(startupId)])
  },

  async getBalance(startupId: number, holder: string) {
    return callReadOnly(CONTRACTS.token, 'get-balance', [
      uintCV(startupId),
      standardPrincipalCV(holder),
    ])
  },

  async transfer(params: {
    startupId: number
    amount: number
    sender: string
    recipient: string
  }) {
    const { startupId, amount, sender, recipient } = params
    
    const functionArgs = [
      uintCV(startupId),
      uintCV(amount),
      standardPrincipalCV(sender),
      standardPrincipalCV(recipient),
    ]

    return makeContractCall(CONTRACTS.token, 'transfer', functionArgs)
  },
}

// Scoring system contract functions
export const ScoringContract = {
  async initializeMetrics(startupId: number) {
    const functionArgs = [uintCV(startupId)]
    return makeContractCall(CONTRACTS.scoring, 'initialize-metrics', functionArgs)
  },

  async updateGithubMetrics(params: {
    startupId: number
    commits: number
    stars: number
    forks: number
  }) {
    const { startupId, commits, stars, forks } = params
    
    const functionArgs = [
      uintCV(startupId),
      uintCV(commits),
      uintCV(stars),
      uintCV(forks),
    ]

    return makeContractCall(CONTRACTS.scoring, 'update-github-metrics', functionArgs)
  },

  async getMetrics(startupId: number) {
    return callReadOnly(CONTRACTS.scoring, 'get-metrics', [uintCV(startupId)])
  },

  async getScore(startupId: number) {
    return callReadOnly(CONTRACTS.scoring, 'get-score', [uintCV(startupId)])
  },
}

// Competition contract functions
export const CompetitionContract = {
  async joinCompetition(competitionId: number, startupId: number) {
    const functionArgs = [uintCV(competitionId), uintCV(startupId)]
    return makeContractCall(CONTRACTS.competition, 'join-competition', functionArgs)
  },

  async getCompetition(competitionId: number) {
    return callReadOnly(CONTRACTS.competition, 'get-competition', [uintCV(competitionId)])
  },

  async getParticipant(competitionId: number, startupId: number) {
    return callReadOnly(CONTRACTS.competition, 'get-participant', [
      uintCV(competitionId),
      uintCV(startupId),
    ])
  },
}

// Transaction monitoring helper
export const waitForTransaction = async (txId: string): Promise<boolean> => {
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