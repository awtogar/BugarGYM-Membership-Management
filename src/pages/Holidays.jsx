import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import {
  RiCalendarEventLine,
  RiAddLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiTimeLine,
  RiSparklingLine,
} from '@remixicon/react'

export default function Holidays() {
  const [holidays, setHolidays] = useState([])
  const [activeMembersCount, setActiveMembersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const [form, setForm] = useState({
    title: '',
    start_date: '',
    end_date: '',
  })

  // Calculate live total days
  const calculateTotalDays = () => {
    if (!form.start_date || !form.end_date) return 0
    const start = new Date(form.start_date)
    const end = new Date(form.end_date)
    if (end < start) return 0
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const fetchHolidays = async () => {
    setLoading(true)
    const { data: holidayData } = await supabase
      .from('holidays')
      .select('*')
      .order('created_at', { ascending: false })

    const { count: memberCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aktif')

    if (holidayData) setHolidays(holidayData)
    if (memberCount !== null) setActiveMembersCount(memberCount)
    setLoading(false)
  }

  useEffect(() => {
    fetchHolidays()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const totalDays = calculateTotalDays()

    if (totalDays <= 0) {
      setMessage({ type: 'error', text: 'Tanggal selesai harus sama atau setelah tanggal mulai.' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      // Insert holiday record
      const { data: newHoliday, error: insertError } = await supabase
        .from('holidays')
        .insert([
          {
            title: form.title,
            start_date: form.start_date,
            end_date: form.end_date,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Client-side fallback to update active members if DB trigger isn't applied yet
      const { data: activeMembers } = await supabase
        .from('members')
        .select('id, tanggal_jatuh_tempo, extended_days')
        .eq('status', 'aktif')

      if (activeMembers && activeMembers.length > 0) {
        for (const member of activeMembers) {
          const currentDueDate = new Date(member.tanggal_jatuh_tempo)
          currentDueDate.setDate(currentDueDate.getDate() + totalDays)

          await supabase
            .from('members')
            .update({
              tanggal_jatuh_tempo: currentDueDate.toISOString().split('T')[0],
              extended_days: (member.extended_days || 0) + totalDays,
            })
            .eq('id', member.id)
        }
      }

      setMessage({
        type: 'success',
        text: `Hari libur "${form.title}" (${totalDays} hari) berhasil disimpan! Tanggal jatuh tempo ${activeMembersCount} member aktif otomatis diperpanjang +${totalDays} hari.`,
      })

      setForm({ title: '', start_date: '', end_date: '' })
      fetchHolidays()
    } catch (err) {
      console.error('Error adding holiday:', err)
      setMessage({ type: 'error', text: err.message || 'Gagal menambahkan hari libur.' })
    } finally {
      setSubmitting(false)
    }
  }

  const totalDaysCalculated = calculateTotalDays()

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col font-inter">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase font-geist">Kompensasi Hari Libur</h1>
          <p className="text-[#a1a1a1] text-xs font-inter mt-1">
            Input tanggal libur gym untuk memperpanjang tanggal jatuh tempo member aktif secara otomatis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Card */}
          <div className="lg:col-span-6 bg-[#262626]/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/8">
              <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-white">
                <RiSparklingLine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-geist font-bold text-white text-xs uppercase tracking-wider">Form Input Libur Gym</h3>
                <p className="text-xs text-[#a1a1a1] font-mono mt-0.5">
                  Member aktif saat ini: <strong className="text-white font-semibold">{activeMembersCount} member</strong>
                </p>
              </div>
            </div>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-xs font-mono border ${
                  message.type === 'success'
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-red-500/5 border-red-500/15 text-red-400'
                }`}
              >
                {message.type === 'success' ? (
                  <RiCheckLine className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <RiErrorWarningLine className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#a1a1a1] uppercase tracking-wider mb-2 font-geist">
                  Nama Hari Libur / Keterangan *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Libur Hari Raya Idul Fitri"
                  className="w-full bg-[#0e0e0e] border border-white/8 text-white rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-white/30 font-inter placeholder:text-neutral-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1a1] uppercase tracking-wider mb-2 font-geist">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full bg-[#0e0e0e] border border-white/8 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-white/30 font-inter font-mono transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1a1] uppercase tracking-wider mb-2 font-geist">
                    Tanggal Selesai *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full bg-[#0e0e0e] border border-white/8 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-white/30 font-inter font-mono transition-colors"
                  />
                </div>
              </div>

              {totalDaysCalculated > 0 && (
                <div className="p-4 bg-[#0e0e0e] border border-white/8 rounded-lg flex items-center justify-between text-xs font-mono">
                  <span className="text-[#a1a1a1] flex items-center gap-1.5 font-geist uppercase font-bold tracking-wide text-[10px]">
                    <RiTimeLine className="w-4 h-4 text-white" /> Kompensasi Ditambahkan:
                  </span>
                  <span className="font-bold text-white text-sm">
                    +{totalDaysCalculated} Hari
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white hover:bg-[#e5e5e5] text-[#131313] font-bold py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-geist uppercase tracking-wider text-xs"
              >
                <RiAddLine className="w-4 h-4" />
                {submitting ? 'Memproses Kompensasi...' : 'Terapkan Kompensasi Hari Libur'}
              </button>
            </form>
          </div>

          {/* History Card */}
          <div className="lg:col-span-6 bg-[#262626]/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/8">
              <h3 className="font-geist font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <RiCalendarEventLine className="w-4 h-4 text-white" />
                Riwayat Hari Libur Gym
              </h3>
              <span className="text-[10px] font-bold bg-white/5 border border-white/8 text-[#fafafa] px-2.5 py-1 rounded-full uppercase tracking-wider">
                {holidays.length} Entri
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[450px] pr-1">
              {loading ? (
                <div className="text-center py-8 text-[#a1a1a1] text-xs font-mono">Memuat riwayat libur...</div>
              ) : holidays.length === 0 ? (
                <div className="text-center py-8 text-[#a1a1a1] text-xs font-mono">
                  Belum ada data hari libur yang diinput.
                </div>
              ) : (
                holidays.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 bg-[#0e0e0e] border border-white/8 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-geist font-bold text-white text-sm uppercase tracking-wide">{h.title}</h4>
                      <p className="text-xs text-[#a1a1a1] font-mono mt-1">
                        {h.start_date} s/d {h.end_date}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-white bg-white/10 border border-white/15 px-2.5 py-1 rounded-full font-mono">
                        +{h.total_days || 0} Hari
                      </span>
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
