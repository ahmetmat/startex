'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Rocket, Sparkles } from 'lucide-react'

export type NavItem = {
  href: string
  label: string
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Competitions', href: '/competitions' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Trading', href: '/trading' },
]

type MainHeaderProps = {
  navItems?: NavItem[]
  highlightPath?: string
  rightSlot?: ReactNode
  showSparkles?: boolean
  className?: string
}

const getIsActive = (currentPath: string, targetPath: string) => {
  if (targetPath === '/') {
    return currentPath === '/'
  }
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

export function MainHeader({
  navItems = DEFAULT_NAV_ITEMS,
  highlightPath,
  rightSlot,
  showSparkles = false,
  className = '',
}: MainHeaderProps) {
  const pathname = usePathname() ?? '/'
  const activePath = highlightPath ?? pathname

  return (
    <header className={`bg-white/80 backdrop-blur-sm border-b border-orange-200/50 shadow-sm relative z-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <Rocket className="w-10 h-10 text-orange-500 group-hover:text-red-500 transition-all duration-300 transform group-hover:rotate-6" />
              {showSparkles && (
                <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              )}
            </div>
            <span className="text-3xl font-black bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
              StartEx
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = getIsActive(activePath, item.href)
              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className={`relative group text-sm font-medium transition-colors duration-300 ${
                    isActive ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center space-x-4">
            {rightSlot}
          </div>
        </div>
      </div>
    </header>
  )
}
