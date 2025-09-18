'use client'

import { useState, useEffect } from 'react'
import { AppConfig, UserSession } from '@stacks/auth'
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Wallet,
  ArrowUpDown,
  Clock,
  Activity,
  Coins,
  Rocket,
  Search,
  Filter,
  Eye,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  PieChart,
  LineChart
} from 'lucide-react'

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })

export default function Trading() {
  const [userData, setUserData] = useState(null)
  const [selectedToken, setSelectedToken] = useState(null)
  const [orderType, setOrderType] = useState('buy')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [portfolio, setPortfolio] = useState([
    { token: 'TECH', amount: 1250, value: 56.25, change: '+12.5%', color: 'text-green-600' },
    { token: 'GREEN', amount: 890, value: 28.48, change: '+8.7%', color: 'text-green-600' },
    { token: 'HEALTH', amount: 340, value: 9.52, change: '+12.4%', color: 'text-green-600' },
    { token: 'STX', amount: 150, value: 180, change: '+2.1%', color: 'text-green-600' }
  ])

  const [tokens, setTokens] = useState([
    {
      symbol: 'TECH',
      name: 'TechFlow AI',
      price: 0.045,
      change: '+15.2%',
      volume: '45.2K STX',
      marketCap: '45K',
      holders: 234,
      trend: 'up',
      logo: '🤖'
    },
    {
      symbol: 'GREEN',
      name: 'GreenChain Solutions',
      price: 0.032,
      change: '+8.7%',
      volume: '32.1K STX',
      marketCap: '32K',
      holders: 198,
      trend: 'up',
      logo: '🌱'
    },
    {
      symbol: 'HEALTH',
      name: 'HealthSync Pro',
      price: 0.028,
      change: '+12.4%',
      volume: '28.5K STX',
      marketCap: '28K',
      holders: 167,
      trend: 'up',
      logo: '⚕️'
    },
    {
      symbol: 'LEARN',
      name: 'CryptoLearn',
      price: 0.019,
      change: '+3.1%',
      volume: '19.8K STX',
      marketCap: '19K',
      holders: 145,
      trend: 'up',
      logo: '📚'
    },
    {
      symbol: 'DEV',
      name: 'DevTools Studio',
      price: 0.015,
      change: '+6.8%',
      volume: '15.3K STX',
      marketCap: '15K',
      holders: 123,
      trend: 'up',
      logo: '🛠️'
    },
    {
      symbol: 'FOOD',
      name: 'FoodChain Tracker',
      price: 0.022,
      change: '-2.1%',
      volume: '22.1K STX',
      marketCap: '22K',
      holders: 98,
      trend: 'down',
      logo: '🍎'
    }
  ])

  const [recentTrades, setRecentTrades] = useState([
    { type: 'buy', token: 'TECH', amount: 100, price: 0.044, time: '2 min ago', status: 'completed' },
    { type: 'sell', token: 'GREEN', amount: 50, price: 0.031, time: '5 min ago', status: 'completed' },
    { type: 'buy', token: 'HEALTH', amount: 75, price: 0.027, time: '12 min ago', status: 'completed' },
    { type: 'buy', token: 'LEARN', amount: 200, price: 0.019, time: '18 min ago', status: 'pending' }
  ])

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData() as any)
    }
  }, [])

  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const portfolioValue = portfolio.reduce((total, item) => total + item.value, 0)

  const handleTrade = () => {
    if (!selectedToken || !amount || !price) {
      alert('Please fill all fields')
      return
    }

    const newTrade = {
      type: orderType,
      token: selectedToken.symbol,
      amount: parseInt(amount),
      price: parseFloat(price),
      time: 'just now',
      status: 'pending'
    }

    setRecentTrades([newTrade, ...recentTrades])
    setAmount('')
    setPrice('')
    
    setTimeout(() => {
      setRecentTrades(prev => 
        prev.map(trade => 
          trade.time === 'just now' ? { ...trade, status: 'completed', time: '1 min ago' } : trade
        )
      )
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Rocket className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                StartEx
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                Home
              </a>
              <a href="/dashboard" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                Dashboard
              </a>
              <a href="/competitions" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                Competitions
              </a>
              <a href="/leaderboard" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                Leaderboard
              </a>
              <a href="/trading" className="text-orange-600 font-medium">
                Trading
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              {userData && (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full">
                  <Wallet className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">${portfolioValue.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900">
            Token
            <span className="block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
              Trading
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Trade startup tokens and build your investment portfolio
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Wallet className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Portfolio Value</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">${portfolioValue.toFixed(2)}</div>
            <div className="text-sm text-green-600 font-medium">+8.7% today</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600">24h Change</span>
            </div>
            <div className="text-3xl font-bold text-green-600">+$12.45</div>
            <div className="text-sm text-green-600 font-medium">+4.8%</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Coins className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Total Tokens</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">4</div>
            <div className="text-sm text-gray-600">Different assets</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">Active Trades</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">2</div>
            <div className="text-sm text-orange-600 font-medium">Pending orders</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>
              <button className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:border-orange-500 transition-colors">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Token Cards */}
            <div className="space-y-4">
              {filteredTokens.map((token) => (
                <div key={token.symbol} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer"
                     onClick={() => setSelectedToken(token)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl flex items-center justify-center text-2xl">
                        {token.logo}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{token.name}</h3>
                        <p className="text-sm text-gray-600">{token.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold text-gray-900">${token.price.toFixed(3)}</div>
                      <div className={`text-sm font-medium ${
                        token.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {token.change}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1 text-sm text-gray-500">
                      <div>Vol: {token.volume}</div>
                      <div>Cap: ${token.marketCap}</div>
                      <div>{token.holders} holders</div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedToken(token)
                          setOrderType('buy')
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
                      >
                        Buy
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedToken(token)
                          setOrderType('sell')
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all"
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* Trade Form */}
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Place Order</h3>
              
              {selectedToken ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                    <div className="text-2xl">{selectedToken.logo}</div>
                    <div>
                      <div className="font-bold text-gray-900">{selectedToken.symbol}</div>
                      <div className="text-sm text-gray-600">{selectedToken.name}</div>
                      <div className="text-lg font-bold text-gray-900">${selectedToken.price.toFixed(3)}</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setOrderType('buy')}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        orderType === 'buy'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setOrderType('sell')}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        orderType === 'sell'
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Sell
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (STX)</label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={selectedToken.price.toFixed(3)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {amount && price && (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-bold">{(parseFloat(amount) * parseFloat(price)).toFixed(3)} STX</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fee:</span>
                        <span>0.1%</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleTrade}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      orderType === 'buy'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                        : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                    }`}
                  >
                    {orderType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Coins className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a token to start trading</p>
                </div>
              )}
            </div>

            {/* Portfolio */}
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Your Portfolio</h3>
              <div className="space-y-4">
                {portfolio.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-900">{item.token}</div>
                      <div className="text-sm text-gray-500">{item.amount} tokens</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${item.value.toFixed(2)}</div>
                      <div className={`text-sm ${item.color}`}>{item.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Trades */}
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Trades</h3>
                <RefreshCw className="w-5 h-5 text-gray-400 cursor-pointer hover:text-orange-500" />
              </div>
              <div className="space-y-3">
                {recentTrades.map((trade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {trade.type.toUpperCase()} {trade.token}
                        </div>
                        <div className="text-sm text-gray-500">{trade.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{trade.amount} @ ${trade.price.toFixed(3)}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        trade.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {trade.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}