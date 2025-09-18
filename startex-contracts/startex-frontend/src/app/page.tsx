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
  Rocket,
  Trophy,
  TrendingUp,
  Users,
  Github,
  Twitter,
  ExternalLink,
  Zap,
  Sparkles,
  ArrowRight,
  Play,
} from 'lucide-react'

export default function HomePage() {
  const [addr, setAddr] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // storage'dan STX adresini çek
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
    } catch {
      // yoksay
    }
  }

  useEffect(() => {
    // mevcut bağlantı varsa oku
    try {
      if (walletIsConnected?.()) readAddrFromStorage()
    } catch {
      // bazı cüzdanlarda isConnected yoksa sessizce geç
      readAddrFromStorage()
    }

    const handleMouseMove = (e: MouseEvent) =>
      setMousePosition({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const connectWallet = async () => {
    // modal ile cüzdan seçtir + adres iste
    await connect({ forceWalletSelect: true })
    // alternatif: await request('getAddresses')
    readAddrFromStorage()
  }

  const disconnectWallet = () => {
    stacksDisconnect()
    setConnected(false)
    setAddr(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full opacity-60 animate-bounce"
          style={{ animationDelay: '0s', animationDuration: '3s' }}
        />
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-300 to-red-400 rounded-full opacity-50 animate-bounce"
          style={{ animationDelay: '1s', animationDuration: '4s' }}
        />
        <div
          className="absolute bottom-32 left-32 w-20 h-20 bg-gradient-to-r from-cyan-300 to-blue-400 rounded-full opacity-70 animate-bounce"
          style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}
        />
        <div
          className="absolute w-96 h-96 bg-gradient-radial from-yellow-200/30 via-transparent to-transparent rounded-full transition-all duration-300 ease-out"
          style={{ left: mousePosition.x - 192, top: mousePosition.y - 192 }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/80 border-b border-orange-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 group">
                <div className="relative">
                  <Rocket className="w-10 h-10 text-orange-500 group-hover:text-red-500 transition-all duration-300 transform group-hover:rotate-12" />
                  <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <span className="text-3xl font-black bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
                  StartEx
                </span>
              </div>
            </div>

            <nav className="hidden md:flex space-x-8">
              {['Startups', 'Competitions', 'Leaderboard', 'Trading'].map(item => (
                <a
                  key={item}
                  href="#"
                  className="relative text-gray-700 hover:text-orange-600 font-medium transition-all duration-300 group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {!connected ? (
                <button
                  onClick={connectWallet}
                  className="relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="relative z-10">Connect Wallet</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 hover:opacity-20 transition-opacity duration-300" />
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full border border-green-200">
                    <span className="text-sm font-medium text-green-800">
                      {addr?.slice(0, 8)}...
                    </span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full font-medium transition-all duration-300"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3 rounded-full border border-orange-200 mb-8">
                <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                <span className="text-orange-700 font-semibold">The Future is Here</span>
              </div>

              <h1 className="text-6xl md:text-8xl font-black leading-none">
                <span className="block text-gray-900 mb-2">Launch Your</span>
                <span className="block bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent relative">
                  Startup
                  <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 to-red-400/20 blur-xl" />
                </span>
                <span className="block text-gray-900 mt-2">to the Moon</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                🚀 Tokenize your startup, compete with peers, and get funded by the community.
                Built on Stacks blockchain with rocket-powered technology!
                <span className="font-bold text-orange-600"> Let's build the future together!</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => (window.location.href = '/register')}
                className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
              >
                <div className="flex items-center space-x-3">
                  <Rocket className="w-6 h-6 group-hover:animate-bounce" />
                  <span>Launch Your Startup</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              </button>

              <button className="group relative bg-white/80 backdrop-blur-sm border-2 border-orange-300 hover:border-orange-400 text-orange-700 hover:text-orange-800 px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
                <div className="flex items-center space-x-3">
                  <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Watch Demo</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '150+', label: 'Active Startups', color: 'from-orange-400 to-red-400', icon: Rocket },
              { number: '$2.5M', label: 'Total Funded', color: 'from-green-400 to-emerald-400', icon: TrendingUp },
              { number: '25', label: 'Active Competitions', color: 'from-blue-400 to-cyan-400', icon: Trophy },
              { number: '1,200', label: 'Investors', color: 'from-purple-400 to-pink-400', icon: Users },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="group relative">
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 text-center space-y-4 hover:transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                    <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto group-hover:rotate-12 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className={`text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.number}
                    </div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-100 to-blue-100 px-6 py-3 rounded-full border border-blue-200">
              <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
              <span className="text-blue-700 font-semibold">Supercharged Features</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900">
              Why Choose
              <span className="block bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent"> StartEx?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Tokenize Your Startup',
                description:
                  'Convert your startup into tradeable tokens. Connect your GitHub repo and let the community invest in your success.',
                icon: Zap,
                gradient: 'from-yellow-400 to-orange-500',
                bgGradient: 'from-yellow-50 to-orange-50',
                borderColor: 'border-orange-200',
              },
              {
                title: 'Compete & Win',
                description:
                  'Join monthly competitions. Get scored based on GitHub activity, social growth, and platform engagement.',
                icon: Trophy,
                gradient: 'from-blue-400 to-cyan-500',
                bgGradient: 'from-blue-50 to-cyan-50',
                borderColor: 'border-blue-200',
              },
              {
                title: 'Community Funding',
                description:
                  'Get funded by a global community of investors who believe in your vision and track your progress.',
                icon: Users,
                gradient: 'from-green-400 to-emerald-500',
                bgGradient: 'from-green-50 to-emerald-50',
                borderColor: 'border-green-200',
              },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="group relative">
                  <div
                    className={`bg-gradient-to-br ${f.bgGradient} backdrop-blur-sm border ${f.borderColor} rounded-3xl p-10 hover:transform hover:scale-105 transition-all duration-500 hover:shadow-2xl`}
                  >
                    <div
                      className={`w-20 h-20 bg-gradient-to-r ${f.gradient} rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">{f.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">{f.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 bg-gradient-to-r from-orange-100 via-red-50 to-pink-100">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900">
                Ready to
                <span className="block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent"> Launch? 🚀</span>
              </h2>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto">Join the next generation of startup funding on the blockchain</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl">
                <div className="flex items-center space-x-3 justify-center">
                  <Github className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span>Connect GitHub & Start</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button className="group bg-white/80 backdrop-blur-sm border-2 border-orange-300 hover:border-orange-400 text-orange-700 hover:text-orange-800 px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-xl">
                <div className="flex items-center space-x-3 justify-center">
                  <ExternalLink className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>View Documentation</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/90 backdrop-blur-sm border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Rocket className="w-8 h-8 text-orange-500" />
                <span className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">StartEx</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                The future of startup funding, built on Stacks blockchain with love ❤️
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <Twitter className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <Github className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {[
              { title: 'Platform', links: ['Browse Startups', 'Competitions', 'Leaderboard', 'Trading'] },
              { title: 'Resources', links: ['Documentation', 'API', 'Support', 'Blog'] },
              { title: 'Company', links: ['About', 'Careers', 'Privacy', 'Terms'] },
            ].map((section, i) => (
              <div key={i} className="space-y-6">
                <h4 className="text-gray-900 font-bold text-lg">{section.title}</h4>
                <div className="space-y-3">
                  {section.links.map((link, j) => (
                    <a
                      key={j}
                      href="#"
                      className="block text-gray-600 hover:text-orange-600 transition-colors duration-300 font-medium"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center">
            <p className="text-gray-500">
              © 2025 StartEx. Built with 🚀 on Stacks blockchain. Let's reach for the stars!
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}