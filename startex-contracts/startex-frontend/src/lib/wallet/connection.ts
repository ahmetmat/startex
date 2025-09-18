// startex-contracts/startex-frontend/src/lib/wallet/connection.ts

import { showConnect, ConnectOptions } from '@stacks/connect'
import { StacksTestnet } from '@stacks/network'
import { AppConfig, UserSession } from '@stacks/auth'

// Network configuration
export const network = new StacksTestnet()

// App configuration
const appConfig = new AppConfig(['store_write', 'publish_data'])
export const userSession = new UserSession({ appConfig })

// Wallet connection helper
export const connectWallet = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    const connectOptions: ConnectOptions = {
      appDetails: {
        name: 'StartEx',
        icon: window.location.origin + '/favicon.ico',
      },
      redirectTo: '/',
      onFinish: (authData) => {
        console.log('Wallet connected:', authData)
        const userData = userSession.loadUserData()
        const address = userData.profile?.stxAddress?.testnet || 
                       userData.profile?.stxAddress?.mainnet || 
                       null
        resolve(address)
      },
      onCancel: () => {
        console.log('Wallet connection cancelled')
        resolve(null)
      },
    }

    showConnect(connectOptions)
  })
}

// Get user address from session
export const getUserAddress = (): string | null => {
  if (!userSession.isUserSignedIn()) return null
  
  const userData = userSession.loadUserData()
  return userData.profile?.stxAddress?.testnet || 
         userData.profile?.stxAddress?.mainnet || 
         null
}

// Check if user is signed in
export const isSignedIn = (): boolean => {
  return userSession.isUserSignedIn()
}

// Sign out
export const signOut = (): void => {
  userSession.signUserOut()
}