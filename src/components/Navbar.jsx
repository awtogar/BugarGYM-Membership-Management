import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  RiPulseLine,
  RiDashboardLine,
  RiUserFollowLine,
  RiGroupLine,
  RiCalendarEventLine,
  RiFileChartLine,
  RiLogoutBoxRLine,
  RiUserLine,
} from '@remixicon/react'

export default function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuth()

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
            <span className="font-geist font-extrabold text-base text-white tracking-tight uppercase">
              BugarGym
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
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

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-ink text-xs font-mono px-3 py-1.5 rounded-lg bg-surface-lowest/50 border border-white/8">
            <RiUserLine className="w-3.5 h-3.5 text-muted" />
            <span>{user?.email}</span>
          </div>

          <button
            onClick={logout}
            className="text-xs text-muted hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/8 hover:bg-white/5 transition-colors cursor-pointer uppercase font-geist font-semibold tracking-wider"
          >
            <RiLogoutBoxRLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
