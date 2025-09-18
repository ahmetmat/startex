// startex-frontend/src/lib/stacks/network.ts

import { STACKS_TESTNET, StacksNetwork } from '@stacks/network'

export const STACKS_API_URL = process.env.NEXT_PUBLIC_STACKS_API_URL || 'https://api.testnet.hiro.so'

// Yeni syntax kullanarak network oluştur
export const NETWORK: StacksNetwork = STACKS_TESTNET

// Network helper fonksiyonları
export const getNetworkUrl = (): string => {
  return NETWORK.coreApiUrl
}

export const isTestnet = (): boolean => {
  return NETWORK.chainId === STACKS_TESTNET.chainId
}

export const isMainnet = (): boolean => {
  return !isTestnet()
}