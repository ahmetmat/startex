import { STACKS_TESTNET } from '@stacks/network'
export const STACKS_API_URL =
  process.env.NEXT_PUBLIC_STACKS_API_URL || 'https://api.testnet.hiro.so'
export const NETWORK = new STACKS_TESTNET({ url: STACKS_API_URL })