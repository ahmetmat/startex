'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  connect,
  request,
  getLocalStorage,
  disconnect as stacksDisconnect,
  isConnected as walletIsConnected,
} from '@stacks/connect'

export type WalletAddressEntry = { symbol?: string; address?: string }
export type WalletStorage = {
  addresses?: WalletAddressEntry[] | { stx?: WalletAddressEntry[] }
}
export type AddressesResponse = { addresses?: WalletAddressEntry[] }

type HeaderWalletControlsProps = {
  className?: string
}

const CONNECT_BUTTON_CLASSES =
  'relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl'

const CONNECT_BUTTON_OVERLAY_CLASSES =
  'absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 hover:opacity-20 transition-opacity duration-300'

export function HeaderWalletControls({ className = '' }: HeaderWalletControlsProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const shortAddress = useMemo(() => {
    if (!address) return null
    return `${address.slice(0, 8)}...`
  }, [address])

  const readAddressFromStorage = useCallback(() => {
    try {
      const data = getLocalStorage?.() as WalletStorage | undefined
      const addresses = data?.addresses
      const structured = !Array.isArray(addresses) ? addresses : undefined
      const fromStructured = structured?.stx?.[0]?.address
      const fromList = Array.isArray(addresses)
        ? addresses.find((entry) => entry.symbol === 'STX')?.address
        : undefined
      const selected = fromStructured ?? fromList ?? null
      if (selected) setAddress(selected)
    } catch {
      // ignore storage parsing errors
    }
  }, [])

  useEffect(() => {
    try {
      if (walletIsConnected?.()) {
        readAddressFromStorage()
      }
    } catch {
      readAddressFromStorage()
    }
  }, [readAddressFromStorage])

  const handleConnect = useCallback(async () => {
    setIsConnecting(true)
    try {
      await connect({ forceWalletSelect: true })
      const response = (await request('getAddresses').catch(() => null)) as AddressesResponse | null
      const selected =
        response?.addresses?.find((entry) => entry.symbol === 'STX')?.address ?? null
      if (selected) {
        setAddress(selected)
      } else {
        readAddressFromStorage()
      }
    } finally {
      setIsConnecting(false)
    }
  }, [readAddressFromStorage])

  const handleDisconnect = useCallback(() => {
    stacksDisconnect()
    setAddress(null)
  }, [])

  return (
    <div className={`flex items-center justify-end min-w-[220px] ${className}`}>
      {address ? (
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full border border-green-200">
            <span className="text-sm font-medium text-green-800">{shortAddress}</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full font-medium transition-all duration-300"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`${CONNECT_BUTTON_CLASSES} ${isConnecting ? 'opacity-70 cursor-wait' : ''}`}
        >
          <span className="relative z-10">{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          <div className={CONNECT_BUTTON_OVERLAY_CLASSES} />
        </button>
      )}
    </div>
  )
}
