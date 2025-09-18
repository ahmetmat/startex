'use client'

import { useEffect, useState } from 'react'
import {
  connect,
  request,
  getLocalStorage,
  disconnect as stacksDisconnect,
  isConnected as walletIsConnected,
} from '@stacks/connect'
import {
  stringAsciiCV, uintCV, someCV, noneCV, contractPrincipalCV,
  cvToHex, fetchCallReadOnlyFunction, hexToCV, cvToJSON,
} from '@stacks/transactions'

import {
  Rocket, Github, Twitter, Globe, ArrowRight, CheckCircle,
  AlertCircle, Sparkles, Zap, Coins,
} from 'lucide-react'

/* ---------- ENV / CONTRACTS ---------- */
const RPC_URL =
  process.env.NEXT_PUBLIC_STACKS_RPC_URL || 'https://api.testnet.hiro.so'

  
// @stacks/network kullanmadan basit bir network objesi:
// network shim: v7 için fetch + getCoreApiUrl sağlıyoruz
const NETWORK = {
  fetch: (input: any, init?: any) => fetch(input, init),
  getCoreApiUrl: () => RPC_URL,
} as any

const CORE_API = process.env.NEXT_PUBLIC_STACKS_RPC_URL || 'https://api.testnet.hiro.so'

const CONTRACTS = {
  registry: {
    address: process.env.NEXT_PUBLIC_REGISTRY_ADDR as string,
    name: process.env.NEXT_PUBLIC_REGISTRY_NAME || 'startup-registry',
  },
  token: {
    address: process.env.NEXT_PUBLIC_TOKEN_ADDR as string,
    name: process.env.NEXT_PUBLIC_TOKEN_NAME || 'startup-token',
  },
  metrics: {
    address: process.env.NEXT_PUBLIC_METRICS_ADDR as string,
    name: process.env.NEXT_PUBLIC_METRICS_NAME || 'startup-metrics',
  },
}

/* ---------- TYPES ---------- */
type FormData = {
  name: string
  description: string
  githubRepo: string
  website: string
  twitter: string
  tokenName: string
  tokenSymbol: string
  initialSupply: string
  decimals: string
}
type Errors = Partial<Record<keyof FormData, string>>

export default function StartupRegister() {
  /* Wallet state */
  const [addr, setAddr] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  /* UI state */
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    githubRepo: '',
    website: '',
    twitter: '',
    tokenName: '',
    tokenSymbol: '',
    initialSupply: '1000000',
    decimals: '6', // kontratta <= 8 şartı var
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [startupId, setStartupId] = useState<number | null>(null)
  const [txids, setTxids] = useState<{ register?: string; tokenize?: string; metrics?: string; setToken?: string }>({})

  /* -------- Wallet helpers -------- */
  const readAddrFromStorage = () => {
    try {
      const data: any = getLocalStorage?.()
      const a =
        data?.addresses?.stx?.[0]?.address ??
        data?.addresses?.find?.((x: any) => x.symbol === 'STX')?.address ??
        null
      if (a) {
        setAddr(a)
        setConnected(true)
      }
    } catch {}
  }

  useEffect(() => {
    try {
      if (walletIsConnected?.()) readAddrFromStorage()
      else readAddrFromStorage()
    } catch {
      readAddrFromStorage()
    }
  }, [])

  const connectWallet = async () => {
    await connect({ forceWalletSelect: true })
    const res: any = await request('getAddresses').catch(() => null)
    const a = res?.addresses?.find?.((x: any) => x.symbol === 'STX')?.address ?? null
    setAddr(a)
    setConnected(!!a)
  }

  const disconnectWallet = () => {
    stacksDisconnect()
    setAddr(null)
    setConnected(false)
  }

  /* -------- Validation -------- */
  const validateStep = (step: number) => {
    const e: Errors = {}

    if (step === 1) {
      if (!formData.name.trim()) e.name = 'Startup name is required'
      if (!formData.description.trim()) e.description = 'Description is required'
      if (!formData.githubRepo.trim()) e.githubRepo = 'GitHub repository is required'
      if (formData.githubRepo && !/^https?:\/\/(www\.)?github\.com\//i.test(formData.githubRepo)) {
        e.githubRepo = 'Please enter a valid GitHub URL'
      }
    }
    if (step === 2) {
      if (!formData.tokenName.trim()) e.tokenName = 'Token name is required'
      if (!formData.tokenSymbol.trim()) e.tokenSymbol = 'Token symbol is required'
      if (formData.tokenSymbol.length > 5) e.tokenSymbol = 'Max 5 characters'
      if (!formData.initialSupply || Number.isNaN(Number(formData.initialSupply)) || parseInt(formData.initialSupply) < 1) {
        e.initialSupply = 'Initial supply must be a positive number'
      }
      if (Number(formData.decimals) > 8) e.decimals = 'Decimals must be ≤ 8'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep((s) => ((s + 1) as 1 | 2 | 3 | 4))
  }
  const prevStep = () => {
    setCurrentStep((s) => ((Math.max(1, s - 1)) as 1 | 2 | 3 | 4))
    setErrors({})
  }

async function ro<T = any>(
  contract: { address: string; name: string },
  fn: string,
  args: any[] = [],          // ClarityValue[] (veya boş)
): Promise<T> {
  // Argümanları 0x HEX’e çevir
  const hexArgs = args.map(a => (typeof a === 'string' ? a : cvToHex(a)))

  const res = await fetch(
    `${CORE_API}/v2/contracts/call-read/${contract.address}/${contract.name}/${fn}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: contract.address,     // veya addr ?? contract.address
        arguments: hexArgs,
      }),
    }
  )
  if (!res.ok) throw new Error(`read-only http error: ${res.status}`)
  const json = await res.json()
  if (!json.okay) throw new Error(`read-only failed: ${json.cause || 'not okay'}`)
  const cv = hexToCV(json.result)     // 0x... -> ClarityValue
  return cvToJSON(cv) as any
}

  /* -------- Contract call helper -------- */
  async function call(
    contract: { address: string; name: string },
    fn: string,
    argsCV: string[],
  ): Promise<string> {
    const resp: any = await request('contract_call', {
      contractAddress: contract.address,
      contractName: contract.name,
      functionName: fn,
      functionArgs: argsCV,
      network: (process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet').toLowerCase(),
    })
    return resp?.txid || resp?.transactionHash || ''
  }

  /* -------- Submit pipeline -------- */
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    if (!connected || !addr) {
      alert('Please connect your wallet first.')
      return
    }

    setIsSubmitting(true)
    try {
      // 0) next-startup-id oku
      const nextIdJSON = await ro(CONTRACTS.registry, 'get-next-startup-id', [])
      const nextId = Number(nextIdJSON?.value ?? 0)
      if (!nextId) throw new Error('Could not fetch next startup id')
      setStartupId(nextId)

      // 1) register-startup
      const registerArgs = [
        cvToHex(stringAsciiCV(formData.name.trim().slice(0, 50))),
        cvToHex(stringAsciiCV(formData.description.trim().slice(0, 200))),
        cvToHex(stringAsciiCV(formData.githubRepo.trim().slice(0, 100))),
        cvToHex(formData.website ? someCV(stringAsciiCV(formData.website.trim().slice(0, 100))) : noneCV()),
        cvToHex(formData.twitter ? someCV(stringAsciiCV(formData.twitter.trim().slice(0, 50))) : noneCV()),
      ]
      const txRegister = await call(CONTRACTS.registry, 'register-startup', registerArgs)
      setTxids((t) => ({ ...t, register: txRegister }))

      // 2) tokenize-startup (kontrat içi 1 STX fee)
      const tokenizeArgs = [
        cvToHex(uintCV(nextId)),
        cvToHex(stringAsciiCV(formData.tokenName.trim().slice(0, 32))),
        cvToHex(stringAsciiCV(formData.tokenSymbol.trim().slice(0, 10))),
        cvToHex(uintCV(parseInt(formData.initialSupply))),
        cvToHex(uintCV(parseInt(formData.decimals))), // ≤ 8
      ]
      const txTokenize = await call(CONTRACTS.token, 'tokenize-startup', tokenizeArgs)
      setTxids((t) => ({ ...t, tokenize: txTokenize }))

      // 3) initialize-metrics
      const metricsArgs = [cvToHex(uintCV(nextId))]
      const txMetrics = await call(CONTRACTS.metrics, 'initialize-metrics', metricsArgs)
      setTxids((t) => ({ ...t, metrics: txMetrics }))

      // 4) set-token-address
      const tokenCV = contractPrincipalCV(CONTRACTS.token.address, CONTRACTS.token.name)
      const setTokenArgs = [cvToHex(uintCV(nextId)), cvToHex(tokenCV)]
      const txSetToken = await call(CONTRACTS.registry, 'set-token-address', setTokenArgs)
      setTxids((t) => ({ ...t, setToken: txSetToken }))

      setCurrentStep(4)
    } catch (e: any) {
      console.error('Submit error', e)
      alert(e?.message || 'Error submitting startup. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* -------- UI (wallet not connected) -------- */
  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Connect Your Wallet</h1>
            <p className="text-gray-600">Please connect your wallet to register your startup.</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Connect Wallet
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 rounded-full font-semibold bg-white border-2 border-orange-300 hover:border-orange-400 text-orange-700 transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* -------- UI (form) -------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 py-12">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3 rounded-full border border-orange-200">
            <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
            <span className="text-orange-700 font-semibold">Launch Your Dreams</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900">
            Register Your
            <span className="block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent"> Startup</span>
          </h1>
          <p className="text-xl text-gray-600">Transform your vision into a tokenized reality 🚀</p>
          <div className="mt-2 text-sm text-gray-500">
            Connected:&nbsp;
            <span className="font-mono">{addr?.slice(0, 8)}…{addr?.slice(-4)}</span>
            <button onClick={disconnectWallet} className="ml-3 text-orange-600 hover:underline">Disconnect</button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStep >= step
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-110'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 transition-all duration-300 ${
                    currentStep > step ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-4 space-x-16">
          <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>Basic Info</span>
          <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>Tokenization</span>
          <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-orange-600' : 'text-gray-400'}`}>Review</span>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-orange-200 overflow-hidden">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="p-8 space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Tell us about your startup</h2>
                <p className="text-gray-600">Let's start with the basics</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Startup Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                      errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                    placeholder="e.g. TechStartup"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all resize-none ${
                      errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                    placeholder="Describe your startup's mission and vision..."
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Github className="w-4 h-4 inline mr-1" />
                    GitHub Repository *
                  </label>
                  <input
                    type="url"
                    value={formData.githubRepo}
                    onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                      errors.githubRepo ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                    }`}
                    placeholder="https://github.com/username/repository"
                  />
                  {errors.githubRepo && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.githubRepo}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-all"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Twitter className="w-4 h-4 inline mr-1" />
                      Twitter (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-all"
                      placeholder="@yourstartup"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Continue to Tokenization</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="p-8 space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Tokenize Your Startup</h2>
                <p className="text-gray-600">Create tokens for your community & perks</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Token Name *</label>
                    <input
                      type="text"
                      value={formData.tokenName}
                      onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                        errors.tokenName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                      }`}
                      placeholder="e.g. TechCoin"
                    />
                    {errors.tokenName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.tokenName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Token Symbol *</label>
                    <input
                      type="text"
                      value={formData.tokenSymbol}
                      onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })}
                      className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                        errors.tokenSymbol ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                      }`}
                      placeholder="TECH"
                      maxLength={5}
                    />
                    {errors.tokenSymbol && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.tokenSymbol}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Supply *</label>
                    <input
                      type="number"
                      value={formData.initialSupply}
                      onChange={(e) => setFormData({ ...formData, initialSupply: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                        errors.initialSupply ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                      }`}
                      placeholder="1000000"
                      min={1}
                    />
                    {errors.initialSupply && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.initialSupply}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Decimals (≤ 8)</label>
                    <select
                      value={formData.decimals}
                      onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border-2 ${
                        errors.decimals ? 'border-red-300' : 'border-gray-200'
                      } focus:border-orange-500 focus:outline-none transition-all`}
                    >
                      {/* en pratik seçenekler */}
                      <option value="6">6</option>
                      <option value="8">8</option>
                      <option value="0">0</option>
                      <option value="2">2</option>
                      <option value="4">4</option>
                    </select>
                    {errors.decimals && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.decimals}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-semibold mb-1">Tokenization Fee: 1 STX</p>
                      <p>This fee is transferred inside the contract during tokenization.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg transition-all"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>Review & Submit</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 (Review + Submit) */}
          {currentStep === 3 && (
            <div className="p-8 space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Review Your Startup</h2>
                <p className="text-gray-600">Make sure everything looks correct before launching</p>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Startup Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-semibold text-gray-900">{formData.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">GitHub:</span>
                      <p className="font-semibold text-gray-900 truncate">{formData.githubRepo}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Description:</span>
                      <p className="font-semibold text-gray-900">{formData.description}</p>
                    </div>
                    {formData.website && (
                      <div>
                        <span className="text-gray-600">Website:</span>
                        <p className="font-semibold text-gray-900">{formData.website}</p>
                      </div>
                    )}
                    {formData.twitter && (
                      <div>
                        <span className="text-gray-600">Twitter:</span>
                        <p className="font-semibold text-gray-900">{formData.twitter}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Token Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Token Name:</span>
                      <p className="font-semibold text-gray-900">{formData.tokenName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Symbol:</span>
                      <p className="font-semibold text-gray-900">{formData.tokenSymbol}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Initial Supply:</span>
                      <p className="font-semibold text-gray-900">
                        {parseInt(formData.initialSupply).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Decimals:</span>
                      <p className="font-semibold text-gray-900">{formData.decimals}</p>
                    </div>
                  </div>
                </div>

                {Object.values(txids).some(Boolean) && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
                    <div className="font-semibold mb-2">Transaction IDs</div>
                    {txids.register && <div>register-startup: <span className="font-mono">{txids.register}</span></div>}
                    {txids.tokenize && <div>tokenize-startup: <span className="font-mono">{txids.tokenize}</span></div>}
                    {txids.metrics && <div>initialize-metrics: <span className="font-mono">{txids.metrics}</span></div>}
                    {txids.setToken && <div>set-token-address: <span className="font-mono">{txids.setToken}</span></div>}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Launching...</span>
                    </>
                  ) : (
                    <span>🚀 Launch Startup</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 (Success) */}
          {currentStep === 4 && (
            <div className="p-8 text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900">🎉 Congratulations!</h2>
                <p className="text-xl text-gray-600">
                  Your startup has been successfully registered and tokenized!
                  {startupId !== null && <span className="block mt-1">Startup ID: <span className="font-mono">{startupId}</span></span>}
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="font-bold text-lg text-gray-900 mb-2">What's Next?</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>✅ Your startup is now live on StartEx</p>
                  <p>✅ Your tokens are ready for trading</p>
                  <p>✅ You can start participating in competitions</p>
                  <p>✅ Begin building your community</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => (window.location.href = '/dashboard')}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 bg-white border-2 border-orange-300 hover:border-orange-400 text-orange-700 py-4 rounded-xl font-bold text-lg transition-all"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}