import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import {
  RiPulseLine,
  RiDashboardLine,
  RiUserFollowLine,
  RiGroupLine,
  RiCalendarEventLine,
  RiFileChartLine,
  RiLogoutBoxRLine,
  RiMenuLine,
  RiCloseLine,
} from '@remixicon/react'

export default function Navbar() {
  const location = useLocation()
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: RiDashboardLine },
    { name: 'Pengunjung', path: '/checkin', icon: RiUserFollowLine },
    { name: 'Members', path: '/members', icon: RiGroupLine },
    { name: 'Kompensasi', path: '/holidays', icon: RiCalendarEventLine },
    { name: 'Laporan', path: '/reports', icon: RiFileChartLine },
  ]

  return (
    <header className="border-b border-white/8 bg-canvas/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="p-2 bg-white/5 border border-white/10 rounded-lg text-white group-hover:bg-white/10 transition-colors">
              <RiPulseLine className="w-5 h-5" />
            </div>
            <span className="font-geist font-extrabold text-base text-white tracking-tight uppercase whitespace-nowrap">
              BugarGym
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all font-geist ${isActive
                    ? 'bg-white text-canvas shadow-md shadow-white/5'
                    : 'text-muted hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={logout}
            className="hidden lg:flex text-xs text-muted hover:text-white items-center gap-1.5 px-3 py-2 rounded-lg border border-white/8 hover:bg-white/5 transition-colors cursor-pointer uppercase font-geist font-semibold tracking-wider"
          >
            <RiLogoutBoxRLine className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-muted hover:text-white rounded-lg border border-white/8 hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <RiCloseLine className="w-4 h-4" /> : <RiMenuLine className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="lg:hidden border-t border-white/8 bg-canvas/95 backdrop-blur-md px-4 py-3 space-y-2.5 animate-fade-in">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all font-geist ${isActive
                    ? 'bg-white text-canvas shadow-md'
                    : 'text-muted hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="pt-2 border-t border-white/8">
            <button
              onClick={() => {
                setIsOpen(false)
                logout()
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-red-500/10 transition-all cursor-pointer font-geist"
            >
              <RiLogoutBoxRLine className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
