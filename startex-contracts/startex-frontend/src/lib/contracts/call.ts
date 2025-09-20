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

const missingEnvVars = [
  !REGISTRY_ADDR && 'NEXT_PUBLIC_REGISTRY_ADDR',
  !TOKEN_ADDR && 'NEXT_PUBLIC_TOKEN_ADDR',
  !METRICS_ADDR && 'NEXT_PUBLIC_METRICS_ADDR',
  !COMPETITION_ADDR && 'NEXT_PUBLIC_COMPETITION_ADDR',
].filter(Boolean) as string[]

const ENV_READY = missingEnvVars.length === 0
const MISSING_ENV_MESSAGE =
  missingEnvVars.length > 0
    ? `Missing env: ${missingEnvVars.join(
        ', '
      )}. Testnet deploy dosyanızdaki deployer adresini bu değişkenlere yazın.`
    : ''

if (!ENV_READY && typeof window !== 'undefined') {
  // In development we want the UI to load while still surfacing the issue once
  if (process.env.NODE_ENV !== 'production') {
    console.warn(MISSING_ENV_MESSAGE)
  } else {
    throw new Error(MISSING_ENV_MESSAGE)
  }
}

/* =========================================================================================
 * LOW-LEVEL HELPERS
 * =======================================================================================*/

const ensureContractsConfigured = () => {
  if (!ENV_READY) {
    throw new Error(MISSING_ENV_MESSAGE)
  }
}

/** Read-only (REST) – Clarity args -> hex, result -> cvToJSON */
async function callReadOnly(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[] = [],
  sender: string = contractAddress
) {
  ensureContractsConfigured()
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
  ensureContractsConfigured()
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

// src/lib/contracts/calls.ts  -> mevcut fonksiyonu bununla değiştir
// startex-frontend/src/lib/contracts/calls.ts içindeki waitForTransaction'ı bununla değiştir
export async function waitForTransaction(
  txId: string,
  { attempts = 40, intervalMs = 2000 } = {}
): Promise<{ ok: boolean; status?: string; reason?: string }> {
  const url = `${CORE_API_URL}/extended/v1/tx/${txId}`

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const j = await res.json()
        const s: string | undefined = j?.tx_status
        const reason: string | undefined =
          j?.tx_result?.repr || j?.tx_result?.hex || j?.reason || j?.error

        if (s === 'success') {
          return { ok: true, status: s }
        }
        if (s === 'abort_by_response' || s === 'abort_by_post_condition' || s === 'rejected') {
          return { ok: false, status: s, reason }
        }
        // 'pending' | 'submitted' | bilinmeyen durumlar -> beklemeye devam
      }
    } catch (e: any) {
      // ağ hatası vs => bir kez daha dene
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return { ok: false, status: 'timeout', reason: 'transaction not confirmed in time' }
}