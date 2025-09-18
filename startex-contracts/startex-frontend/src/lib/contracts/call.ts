// startex-frontend/src/lib/contracts/calls.ts
'use client'

import { openContractCall } from '@stacks/connect'
import {
  uintCV,
  stringAsciiCV,
  someCV,
  noneCV,
  standardPrincipalCV,
  contractPrincipalCV,
  cvToJSON,
  hexToCV,
  ClarityValue,
  AnchorMode,
  cvToHex,
} from '@stacks/transactions'

/* =========================================================================================
 * ENV & CONSTANTS
 * =======================================================================================*/

const CORE_API_URL =
  process.env.NEXT_PUBLIC_STACKS_RPC_URL?.replace(/\/+$/, '') ||
  'https://api.testnet.hiro.so' // güvenli varsayılan

const STACKS_NETWORK =
  (process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet').toLowerCase() === 'mainnet'
    ? 'mainnet'
    : 'testnet' // 'mainnet' | 'testnet'  -> @stacks/connect bunu kabul eder. (v8+) 

// Her sözleşme için: deployer address (principal) + contractName
const REGISTRY_ADDR = process.env.NEXT_PUBLIC_REGISTRY_ADDR || ''
const REGISTRY_NAME = process.env.NEXT_PUBLIC_REGISTRY_NAME || 'startup-registry'

const TOKEN_ADDR = process.env.NEXT_PUBLIC_TOKEN_ADDR || ''
const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME || 'token-factory'

const METRICS_ADDR = process.env.NEXT_PUBLIC_METRICS_ADDR || ''
const METRICS_NAME = process.env.NEXT_PUBLIC_METRICS_NAME || 'scoring-system'

const COMPETITION_ADDR = process.env.NEXT_PUBLIC_COMPETITION_ADDR || ''
const COMPETITION_NAME = process.env.NEXT_PUBLIC_COMPETITION_NAME || 'competition'

function assertEnv() {
  const missing: string[] = []
  if (!REGISTRY_ADDR) missing.push('NEXT_PUBLIC_REGISTRY_ADDR')
  if (!TOKEN_ADDR) missing.push('NEXT_PUBLIC_TOKEN_ADDR')
  if (!METRICS_ADDR) missing.push('NEXT_PUBLIC_METRICS_ADDR')
  if (!COMPETITION_ADDR) missing.push('NEXT_PUBLIC_COMPETITION_ADDR')
  if (missing.length) {
    throw new Error(
      `Missing env: ${missing.join(
        ', '
      )}. Testnet deploy dosyanızdaki deployer adresini bu değişkenlere yazın.`
    )
  }
}
assertEnv()

/* =========================================================================================
 * LOW-LEVEL HELPERS
 * =======================================================================================*/

/** Read-only (REST) – Clarity args -> hex, result -> cvToJSON */
async function callReadOnly(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[] = [],
  sender: string = contractAddress
) {
  const url = `${CORE_API_URL}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`
  const body = {
    sender,
    arguments: functionArgs.map((a) => cvToHex(a)),
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

  const json = await res.json()
  if (!json.okay) {
    // API bazen { cause, reason } döndürür
    throw new Error(`read-only failed: ${json.cause || json.reason || 'not okay'}`)
  }

  // result 0x... -> ClarityValue -> JSON
  return cvToJSON(hexToCV(json.result))
}

/** openContractCall sarmalayıcı (tx id döndürür) */
function makeContractCall(params: {
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: ClarityValue[]
  postConditions?: any[]
}): Promise<{ txId: string }> {
  const { contractAddress, contractName, functionName, functionArgs, postConditions = [] } = params

  return new Promise((resolve, reject) => {
    openContractCall({
      network: STACKS_NETWORK, // 'testnet' | 'mainnet'  (v8 ile uyumlu)
      anchorMode: AnchorMode.Any,
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      postConditions,
      onFinish: (data) => resolve({ txId: data.txId }),
      onCancel: () => reject(new Error('Transaction cancelled')),
    })
  })
}

/* =========================================================================================
 * REGISTRY CONTRACT
 * =======================================================================================*/

export const RegistryContract = {
  async registerStartup(params: {
    name: string
    description: string
    githubRepo: string
    website?: string
    twitter?: string
  }) {
    const { name, description, githubRepo, website, twitter } = params

    const fnArgs: ClarityValue[] = [
      stringAsciiCV(name.slice(0, 50)),
      stringAsciiCV(description.slice(0, 200)),
      stringAsciiCV(githubRepo.slice(0, 100)),
      website ? someCV(stringAsciiCV(website.slice(0, 100))) : noneCV(),
      twitter ? someCV(stringAsciiCV(twitter.slice(0, 50))) : noneCV(),
    ]

    return makeContractCall({
      contractAddress: REGISTRY_ADDR,
      contractName: REGISTRY_NAME,
      functionName: 'register-startup',
      functionArgs: fnArgs,
    })
  },

  async getStartup(startupId: number) {
    return callReadOnly(REGISTRY_ADDR, REGISTRY_NAME, 'get-startup', [uintCV(startupId)])
  },

  async getStartupByOwner(ownerAddress: string) {
    return callReadOnly(REGISTRY_ADDR, REGISTRY_NAME, 'get-startup-by-owner', [
      standardPrincipalCV(ownerAddress),
    ])
  },

  async getNextStartupId() {
    return callReadOnly(REGISTRY_ADDR, REGISTRY_NAME, 'get-next-startup-id', [])
  },

  async setTokenAddress(startupId: number) {
    const fnArgs: ClarityValue[] = [uintCV(startupId), contractPrincipalCV(TOKEN_ADDR, TOKEN_NAME)]
    return makeContractCall({
      contractAddress: REGISTRY_ADDR,
      contractName: REGISTRY_NAME,
      functionName: 'set-token-address',
      functionArgs: fnArgs,
    })
  },
}

/* =========================================================================================
 * TOKEN FACTORY
 * =======================================================================================*/

export const TokenContract = {
  async tokenizeStartup(params: {
    startupId: number
    tokenName: string
    tokenSymbol: string
    initialSupply: number
    decimals: number
  }) {
    const { startupId, tokenName, tokenSymbol, initialSupply, decimals } = params

    const fnArgs: ClarityValue[] = [
      uintCV(startupId),
      stringAsciiCV(tokenName.slice(0, 32)),
      stringAsciiCV(tokenSymbol.slice(0, 10)),
      uintCV(initialSupply),
      uintCV(decimals),
    ]

    return makeContractCall({
      contractAddress: TOKEN_ADDR,
      contractName: TOKEN_NAME,
      functionName: 'tokenize-startup',
      functionArgs: fnArgs,
    })
  },

  async getTokenInfo(startupId: number) {
    return callReadOnly(TOKEN_ADDR, TOKEN_NAME, 'get-token-info', [uintCV(startupId)])
  },

  async getBalance(startupId: number, holder: string) {
    return callReadOnly(TOKEN_ADDR, TOKEN_NAME, 'get-balance', [
      uintCV(startupId),
      standardPrincipalCV(holder),
    ])
  },
}

/* =========================================================================================
 * SCORING / METRICS
 * =======================================================================================*/

export const ScoringContract = {
  async initializeMetrics(startupId: number) {
    return makeContractCall({
      contractAddress: METRICS_ADDR,
      contractName: METRICS_NAME,
      functionName: 'initialize-metrics',
      functionArgs: [uintCV(startupId)],
    })
  },

  async updateGithubMetrics(params: {
    startupId: number
    commits: number
    stars: number
    forks: number
  }) {
    const { startupId, commits, stars, forks } = params
    const fnArgs = [uintCV(startupId), uintCV(commits), uintCV(stars), uintCV(forks)]

    return makeContractCall({
      contractAddress: METRICS_ADDR,
      contractName: METRICS_NAME,
      functionName: 'update-github-metrics',
      functionArgs: fnArgs,
    })
  },

  async getMetrics(startupId: number) {
    return callReadOnly(METRICS_ADDR, METRICS_NAME, 'get-metrics', [uintCV(startupId)])
  },

  async getScore(startupId: number) {
    return callReadOnly(METRICS_ADDR, METRICS_NAME, 'get-score', [uintCV(startupId)])
  },
}

/* =========================================================================================
 * COMPETITION
 * =======================================================================================*/

export const CompetitionContract = {
  async joinCompetition(competitionId: number, startupId: number) {
    return makeContractCall({
      contractAddress: COMPETITION_ADDR,
      contractName: COMPETITION_NAME,
      functionName: 'join-competition',
      functionArgs: [uintCV(competitionId), uintCV(startupId)],
    })
  },

  async getCompetition(competitionId: number) {
    return callReadOnly(COMPETITION_ADDR, COMPETITION_NAME, 'get-competition', [uintCV(competitionId)])
  },
}

/* =========================================================================================
 * TX STATUS POLLER
 * =======================================================================================*/

export async function waitForTransaction(txId: string, { attempts = 40, intervalMs = 2000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(`${CORE_API_URL}/extended/v1/tx/${txId}`)
      if (r.ok) {
        const j = await r.json()
        const s = j.tx_status
        if (s === 'success') return true
        if (s === 'abort_by_response' || s === 'abort_by_post_condition' || s === 'rejected') {
          console.error('Transaction failed:', j)
          return false
        }
      }
    } catch (e) {
      console.warn('waitForTransaction error', e)
    }
    await new Promise((res) => setTimeout(res, intervalMs))
  }
  return false
}