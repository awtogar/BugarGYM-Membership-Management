import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import {
  RiPulseLine,
  RiGroupLine,
  RiBankCardLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiArrowRightLine,
  RiAlertLine,
  RiTimeLine,
} from '@remixicon/react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [supabaseStatus, setSupabaseStatus] = useState('checking')
  const [stats, setStats] = useState({
    todayVisits: 0,
    memberVisits: 0,
    nonMemberVisits: 0,
    activeMembers: 0,
    expiringMembersCount: 0,
    todayIncome: 0,
    monthIncome: 0,
  })
  const [expiringMembers, setExpiringMembers] = useState([])
  const [todayCheckins, setTodayCheckins] = useState([])

  const loadDashboardData = async () => {
    try {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const h3Date = new Date()
      h3Date.setDate(h3Date.getDate() + 3)

      // 1. Today Checkins
      const { data: checkins } = await supabase
        .from('checkins')
        .select('*')
        .gte('waktu_checkin', startOfDay.toISOString())
        .order('waktu_checkin', { ascending: false })

      // 2. Active & Expiring Members
      const { data: activeMembers } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'aktif')

      const { data: expiring } = await supabase
        .from('members')
        .select('*')
        .lte('tanggal_jatuh_tempo', h3Date.toISOString().split('T')[0])
        .gte('tanggal_jatuh_tempo', new Date().toISOString().split('T')[0])

      // 3. Month Payments
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('jumlah')
        .gte('tanggal_bayar', startOfMonth.toISOString().split('T')[0])

      // 4. Today Payments
      const { data: todayPayments } = await supabase
        .from('payments')
        .select('jumlah')
        .gte('tanggal_bayar', startOfDay.toISOString().split('T')[0])

      const mVisits = checkins?.filter((c) => c.tipe === 'member').length || 0
      const nmVisits = checkins?.filter((c) => c.tipe === 'non-member').length || 0
      const nonMemberRevenue = checkins?.reduce((acc, c) => acc + (Number(c.jumlah_bayar) || 0), 0) || 0
      const todayRenewalRevenue = todayPayments?.reduce((acc, p) => acc + (Number(p.jumlah) || 0), 0) || 0
      const monthRenewalRevenue = monthPayments?.reduce((acc, p) => acc + (Number(p.jumlah) || 0), 0) || 0

      setStats({
        todayVisits: checkins?.length || 0,
        memberVisits: mVisits,
        nonMemberVisits: nmVisits,
        activeMembers: activeMembers?.length || 0,
        expiringMembersCount: expiring?.length || 0,
        todayIncome: nonMemberRevenue + todayRenewalRevenue,
        monthIncome: nonMemberRevenue + monthRenewalRevenue,
      })

      if (expiring) setExpiringMembers(expiring)
      if (checkins) setTodayCheckins(checkins)

      setSupabaseStatus('connected')
    } catch (err) {
      console.error('Dashboard data error:', err)
      setSupabaseStatus('error')
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleApprovePayment = async (id) => {
    try {
      const { error } = await supabase
        .from('checkins')
        .update({ status_bayar: 'lunas' })
        .eq('id', id)

      if (error) throw error
      loadDashboardData()
    } catch (err) {
      console.error('Error approving payment:', err)
      alert('Gagal menyetujui pembayaran: ' + err.message)
    }
  }


  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col font-inter">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#fafafa] tracking-tight uppercase font-geist">Dashboard Overview</h1>
            <p className="text-[#a1a1a1] text-xs font-inter mt-1">Sistem Digital Fitness Management Portal</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold font-geist uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/8 bg-[#0e0e0e]/50">
              {supabaseStatus === 'checking' && (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Connecting...
                </span>
              )}
              {supabaseStatus === 'connected' && (
                <span className="text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  DB Online
                </span>
              )}
              {supabaseStatus === 'error' && (
                <span className="text-red-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  DB Offline
                </span>
              )}
            </div>

            <Link
              to="/checkin"
              className="bg-white hover:bg-[#e5e5e5] text-[#131313] text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-md flex items-center gap-2 font-geist uppercase tracking-wider"
            >
              <span>Form Check-in</span>
              <RiArrowRightLine className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#262626]/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#a1a1a1] text-[10px] font-bold uppercase tracking-wider font-geist">
                Daily Visits
              </span>
              <RiPulseLine className="w-4 h-4 text-[#a1a1a1]" />
            </div>
            <div className="text-3xl font-black text-white mb-1 font-geist">{stats.todayVisits}</div>
            <p className="text-xs text-[#a1a1a1]">
              Member: <strong className="text-white font-semibold">{stats.memberVisits}</strong> | Non: <strong className="text-white font-semibold">{stats.nonMemberVisits}</strong>
            </p>
          </div>

          <div className="bg-[#262626]/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#a1a1a1] text-[10px] font-bold uppercase tracking-wider font-geist">
                Active Members
              </span>
              <RiGroupLine className="w-4 h-4 text-[#a1a1a1]" />
            </div>
            <div className="text-3xl font-black text-white mb-1 font-geist">{stats.activeMembers}</div>
            <p className="text-xs text-[#a1a1a1]">
              Expired (H-3): <strong className="text-[#fafafa] font-semibold">{stats.expiringMembersCount}</strong>
            </p>
          </div>

          <div className="bg-[#262626]/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#a1a1a1] text-[10px] font-bold uppercase tracking-wider font-geist">
                Hari Ini
              </span>
              <RiBankCardLine className="w-4 h-4 text-[#a1a1a1]" />
            </div>
            <div className="text-2xl font-extrabold text-white mb-1 font-geist">
              Rp {stats.todayIncome.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-[#a1a1a1]">Visitor + perpanjang</p>
          </div>

          <div className="bg-[#262626]/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#a1a1a1] text-[10px] font-bold uppercase tracking-wider font-geist">
                Bulan Ini
              </span>
              <RiBankCardLine className="w-4 h-4 text-[#a1a1a1]" />
            </div>
            <div className="text-2xl font-extrabold text-white mb-1 font-geist">
              Rp {stats.monthIncome.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-[#a1a1a1]">Akumulasi transaksi</p>
          </div>
        </div>

        {/* Real-time Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Expiring Members Warning Section */}
          <div className="lg:col-span-6 bg-[#262626]/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/8">
              <h3 className="font-geist font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <RiAlertLine className="w-4 h-4 text-white" />
                Masa Aktif Hampir Habis (H-3)
              </h3>
              <span className="text-[10px] font-bold bg-white/5 border border-white/8 text-[#fafafa] px-2.5 py-1 rounded-full uppercase tracking-wider">
                {expiringMembers.length} Member
              </span>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {expiringMembers.length === 0 ? (
                <div className="text-center py-8 text-[#a1a1a1] text-xs font-mono">
                  Tidak ada member yang akan expired dalam 3 hari ke depan.
                </div>
              ) : (
                expiringMembers.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-[#0e0e0e] border border-white/8 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-geist font-bold text-white text-sm uppercase tracking-wide">{m.nama}</h4>
                      <p className="text-xs text-[#a1a1a1] mt-0.5 font-mono">
                        No HP: {m.no_hp || '-'} | Due: {m.tanggal_jatuh_tempo}
                      </p>
                    </div>

                    <Link
                      to="/members"
                      className="text-[10px] text-[#fafafa] font-geist font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Perpanjang
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today's Stream */}
          <div className="lg:col-span-6 bg-[#262626]/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/8">
              <h3 className="font-geist font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <RiTimeLine className="w-4 h-4 text-white" />
                Kunjungan Hari Ini
              </h3>
              <span className="text-[10px] font-bold bg-white/5 border border-white/8 text-[#fafafa] px-2.5 py-1 rounded-full uppercase tracking-wider">
                {todayCheckins.length} Kunjungan
              </span>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {todayCheckins.length === 0 ? (
                <div className="text-center py-8 text-[#a1a1a1] text-xs font-mono">
                  Belum ada kunjungan hari ini.
                </div>
              ) : (
                todayCheckins.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#0e0e0e] border border-white/8 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-geist font-bold text-white text-sm uppercase tracking-wide">{item.nama}</span>
                        <span
                          className={`text-[9px] font-bold font-geist uppercase px-2 py-0.5 rounded border ${
                            item.tipe === 'member'
                              ? 'bg-white/10 text-white border-white/20'
                              : 'bg-white/5 text-[#a1a1a1] border-white/10'
                          }`}
                        >
                          {item.tipe}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#a1a1a1] font-mono mt-1">
                        {new Date(item.waktu_checkin).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • Status:{' '}
                        <span
                          className={
                            item.status_bayar === 'lunas' ? 'text-white font-semibold' : 'text-amber-400 font-semibold'
                          }
                        >
                          {item.status_bayar.toUpperCase()}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.jumlah_bayar > 0 && (
                        <span className="text-xs font-semibold text-white font-mono">
                          Rp {Number(item.jumlah_bayar).toLocaleString('id-ID')}
                        </span>
                      )}
                      {item.tipe === 'non-member' && item.status_bayar === 'belum_bayar' && (
                        <button
                          onClick={() => handleApprovePayment(item.id)}
                          className="text-[9px] font-bold font-geist uppercase bg-white text-[#131313] px-2.5 py-1 rounded border border-white hover:bg-[#e5e5e5] transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
