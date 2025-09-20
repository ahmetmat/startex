'use client'

import { openSTXTransfer } from '@stacks/connect'
// ✨ Cleaned up imports
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network'

type SendStxArgs = {
  to: string
  amountStx: number
  memo?: string
}

const MICROSTX = 1_000_000

export async function sendStx({ to, amountStx, memo }: SendStxArgs): Promise<string> {
  const networkName = (process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet').toLowerCase()
  
  // 🛠️ Corrected this line to use the constants directly
  const network = networkName === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET

  return new Promise<string>((resolve, reject) => {
    openSTXTransfer({
      network,
      recipient: to,
      amount: String(Math.floor(amountStx * MICROSTX)), // microSTX
      memo,
      // Leather onFinish bize txId döner
      onFinish: data => {
        // data.txId veya data.txid olabilir, ikisini de dene
        const txId = (data as any)?.txId || (data as any)?.txid
        if (!txId) return reject(new Error('Transaction submitted but txId missing'))
        resolve(txId)
      },
      onCancel: () => reject(new Error('User cancelled the transaction')),
    } as any) // tip çakışmalarına takılmamak için
  })
}