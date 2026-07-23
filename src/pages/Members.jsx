import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateMemberCode } from '../lib/codeGenerator'
import Navbar from '../components/Navbar'
import {
  RiUserAddLine,
  RiSearchLine,
  RiRefreshLine,
  RiForbidLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiBankCardLine,
  RiQrCodeLine,
  RiCalendarEventLine,
  RiPhoneLine,
  RiMailLine,
  RiCloseLine,
  RiEyeLine,
  RiTimeLine,
  RiSparklingLine,
} from '@remixicon/react'

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberDetailLogs, setMemberDetailLogs] = useState({
    payments: [],
    checkins: [],
    holidays: [],
  })
  const [detailTab, setDetailTab] = useState('payments')
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [metodeBayar, setMetodeBayar] = useState('qris')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const [newMember, setNewMember] = useState({
    nama: '',
    no_hp: '',
    email: '',
    tipe_tarif: 'pelajar',
  })

  const fetchMembers = async () => {
    setLoading(true)
    let query = supabase.from('members').select('*').order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (search.trim()) {
      query = query.or(`nama.ilike.%${search}%,no_hp.ilike.%${search}%,unique_code.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      setMembers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMembers()
  }, [search, statusFilter])

  const handleOpenDetail = async (member) => {
    setSelectedMember(member)
    setShowDetailModal(true)
    setLoadingDetail(true)
    setDetailTab('payments')

    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })

      const { data: checkins } = await supabase
        .from('checkins')
        .select('*')
        .eq('member_id', member.id)
        .order('waktu_checkin', { ascending: false })

      const { data: holidays } = await supabase
        .from('holidays')
        .select('*')
        .order('created_at', { ascending: false })

      setMemberDetailLogs({
        payments: payments || [],
        checkins: checkins || [],
        holidays: holidays || [],
      })
    } catch (err) {
      console.error('Error fetching member details:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const today = new Date()
      const dueDate = new Date()
      dueDate.setMonth(dueDate.getMonth() + 1)

      const uniqueCode = generateMemberCode()

      const payload = {
        nama: newMember.nama,
        no_hp: newMember.no_hp || null,
        email: newMember.email || null,
        tipe_tarif: newMember.tipe_tarif,
        unique_code: uniqueCode,
        tanggal_daftar: today.toISOString().split('T')[0],
        tanggal_bayar_terakhir: today.toISOString().split('T')[0],
        tanggal_jatuh_tempo: dueDate.toISOString().split('T')[0],
        status: 'aktif',
      }

      const { data, error } = await supabase.from('members').insert([payload]).select().single()
      if (error) throw error

      const price = newMember.tipe_tarif === 'pelajar' ? 130000 : 150000
      await supabase.from('payments').insert([
        {
          member_id: data.id,
          tanggal_bayar: today.toISOString().split('T')[0],
          jumlah: price,
          metode: metodeBayar,
          periode_berlaku_sampai: dueDate.toISOString().split('T')[0],
        },
      ])

      setMessage({
        type: 'success',
        text: `Member ${newMember.nama} berhasil didaftarkan! Kode Unik: ${uniqueCode}`,
      })
      setShowAddModal(false)
      setNewMember({ nama: '', no_hp: '', email: '', tipe_tarif: 'pelajar' })
      fetchMembers()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal mendaftarkan member.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRenewMember = async (e) => {
    e.preventDefault()
    if (!selectedMember) return

    setSubmitting(true)
    setMessage(null)

    try {
      const today = new Date()

      let baseDate = new Date(selectedMember.tanggal_jatuh_tempo)
      if (isNaN(baseDate.getTime()) || baseDate < today) {
        baseDate = new Date()
      }
      baseDate.setMonth(baseDate.getMonth() + 1)

      const newDueDate = baseDate.toISOString().split('T')[0]
      const price = selectedMember.tipe_tarif === 'pelajar' ? 130000 : 150000

      const { error: updateError } = await supabase
        .from('members')
        .update({
          tanggal_bayar_terakhir: today.toISOString().split('T')[0],
          tanggal_jatuh_tempo: newDueDate,
          status: 'aktif',
        })
        .eq('id', selectedMember.id)

      if (updateError) throw updateError

      await supabase.from('payments').insert([
        {
          member_id: selectedMember.id,
          tanggal_bayar: today.toISOString().split('T')[0],
          jumlah: price,
          metode: metodeBayar,
          periode_berlaku_sampai: newDueDate,
        },
      ])

      setMessage({
        type: 'success',
        text: `Membership ${selectedMember.nama} diperpanjang s/d ${newDueDate}!`,
      })
      setShowRenewModal(false)
      setSelectedMember(null)
      fetchMembers()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal memperpanjang member.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuspendMember = async (member) => {
    const confirm = window.confirm(`Apakah Anda yakin ingin me-suspend member ${member.nama}?`)
    if (!confirm) return

    try {
      const { error } = await supabase
        .from('members')
        .update({ status: 'suspend' })
        .eq('id', member.id)

      if (error) throw error
      fetchMembers()
    } catch (err) {
      alert('Gagal suspend member: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-inter">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase font-geist">Database Anggota</h1>
            <p className="text-muted text-xs font-inter mt-1">
              Kelola data pendaftaran, perpanjangan, dan kode unik self check-in anggota gym
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white hover:bg-[#e5e5e5] text-canvas text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-geist uppercase tracking-wider"
          >
            <RiUserAddLine className="w-4 h-4" />
            <span>Tambah Member Baru</span>
          </button>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-xs font-mono border ${
              message.type === 'success'
                ? 'bg-white/5 border-white/10 text-[#fafafa]'
                : 'bg-red-500/5 border-red-500/15 text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <RiCheckboxCircleLine className="w-4 h-4 flex-shrink-0" />
            ) : (
              <RiCloseCircleLine className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <RiSearchLine className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode..."
              className="w-full bg-surface-lowest border border-white/8 text-white rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-white/30 font-inter placeholder:text-neutral-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {['all', 'aktif', 'akan_habis', 'expired', 'suspend'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-geist uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-white text-canvas'
                    : 'bg-white/5 text-muted border border-white/8 hover:text-white'
                }`}
              >
                {status === 'all' ? 'Semua' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-lowest text-muted text-[10px] font-bold uppercase tracking-wider border-b border-white/8">
                <tr>
                  <th className="px-6 py-4">Kode Unik</th>
                  <th className="px-6 py-4">Nama Member</th>
                  <th className="px-6 py-4">Tipe Tarif</th>
                  <th className="px-6 py-4">Kontak</th>
                  <th className="px-6 py-4">Jatuh Tempo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-ink">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-muted text-xs font-mono">
                      Memuat data anggota...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-muted text-xs font-mono">
                      Tidak ada anggota yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white bg-white/10 border border-white/10 px-2.5 py-1 rounded-md text-[10px]">
                          {member.unique_code || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-geist font-bold text-white uppercase tracking-wide">
                        <button
                          onClick={() => handleOpenDetail(member)}
                          className="hover:text-white/80 text-left font-bold transition-colors cursor-pointer"
                        >
                          {member.nama}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-surface-lowest border border-white/8 px-2.5 py-1 rounded-md text-[10px] font-medium font-mono text-muted">
                          {member.tipe_tarif}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted">
                        {member.no_hp && (
                          <div className="flex items-center gap-1.5">
                            <RiPhoneLine className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{member.no_hp}</span>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center gap-1.5 text-neutral-500 mt-0.5">
                            <RiMailLine className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{member.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium font-mono">
                        <div className="flex items-center gap-1">
                          <RiCalendarEventLine className="w-3.5 h-3.5 text-muted" />
                          <span>{member.tanggal_jatuh_tempo || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[9px] font-bold font-geist uppercase px-2.5 py-1 rounded-full border ${
                            member.status === 'aktif'
                              ? 'bg-white/10 text-white border-white/20'
                              : member.status === 'akan_habis'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : member.status === 'expired'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-white/5 border border-white/10 text-neutral-500'
                          }`}
                        >
                          {member.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(member)}
                            className="bg-surface-lowest hover:bg-white/5 text-white border border-white/8 px-3 py-1.5 rounded-lg text-[10px] font-bold font-geist uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                            title="Lihat Detail & Log"
                          >
                            <RiEyeLine className="w-3.5 h-3.5" />
                            <span>Logs</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedMember(member)
                              setShowRenewModal(true)
                            }}
                            className="bg-white hover:bg-[#e5e5e5] text-canvas px-3 py-1.5 rounded-lg text-[10px] font-bold font-geist uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <RiRefreshLine className="w-3.5 h-3.5" />
                            <span>Renew</span>
                          </button>

                          {member.status !== 'suspend' && (
                            <button
                              onClick={() => handleSuspendMember(member)}
                              className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                              title="Suspend Member"
                            >
                              <RiForbidLine className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Member Detail & Activity Logs */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-elevated border border-white/10 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col font-inter">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/8">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-geist font-black text-white text-lg uppercase tracking-tight">{selectedMember.nama}</h3>
                  <span className="font-mono font-bold text-white bg-white/10 border border-white/10 px-2.5 py-0.5 rounded-md text-[10px]">
                    KODE: {selectedMember.unique_code || '-'}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1 font-mono">
                  Tipe: <strong className="text-white capitalize font-normal">{selectedMember.tipe_tarif}</strong> | HP: {selectedMember.no_hp || '-'}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-neutral-500 hover:text-white p-1 transition-colors"
              >
                <RiCloseLine className="w-5 h-5" />
              </button>
            </div>

            {/* Member Quick Summary Cards */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 bg-surface-lowest border border-white/8 rounded-lg text-center">
                <span className="text-[10px] text-muted uppercase font-bold font-geist tracking-wide">Jatuh Tempo</span>
                <p className="font-bold text-white font-mono text-xs mt-0.5">{selectedMember.tanggal_jatuh_tempo || '-'}</p>
              </div>

              <div className="p-3 bg-surface-lowest border border-white/8 rounded-lg text-center">
                <span className="text-[10px] text-muted uppercase font-bold font-geist tracking-wide">Kompensasi</span>
                <p className="font-bold text-white font-mono text-xs mt-0.5">+{selectedMember.extended_days || 0} Hari</p>
              </div>

              <div className="p-3 bg-surface-lowest border border-white/8 rounded-lg text-center">
                <span className="text-[10px] text-muted uppercase font-bold font-geist tracking-wide">Daftar</span>
                <p className="font-bold text-muted font-mono text-xs mt-0.5">{selectedMember.tanggal_daftar || '-'}</p>
              </div>
            </div>

            {/* Detail Tabs */}
            <div className="flex border-b border-white/8 mb-4">
              <button
                onClick={() => setDetailTab('payments')}
                className={`pb-2.5 px-4 font-bold text-[10px] font-geist uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'payments'
                    ? 'border-white text-white'
                    : 'border-transparent text-muted hover:text-white'
                }`}
              >
                <RiBankCardLine className="w-3.5 h-3.5" />
                Bayar ({memberDetailLogs.payments.length})
              </button>

              <button
                onClick={() => setDetailTab('checkins')}
                className={`pb-2.5 px-4 font-bold text-[10px] font-geist uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'checkins'
                    ? 'border-white text-white'
                    : 'border-transparent text-muted hover:text-white'
                }`}
              >
                <RiTimeLine className="w-3.5 h-3.5" />
                Check-in ({memberDetailLogs.checkins.length})
              </button>

              <button
                onClick={() => setDetailTab('holidays')}
                className={`pb-2.5 px-4 font-bold text-[10px] font-geist uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'holidays'
                    ? 'border-white text-white'
                    : 'border-transparent text-muted hover:text-white'
                }`}
              >
                <RiCalendarEventLine className="w-3.5 h-3.5" />
                Libur ({memberDetailLogs.holidays.length})
              </button>
            </div>

            {/* Tab Body Content */}
            <div className="flex-1 overflow-y-auto max-h-[300px] pr-1">
              {loadingDetail ? (
                <div className="text-center py-8 text-muted text-xs font-mono">Memuat log...</div>
              ) : detailTab === 'payments' ? (
                memberDetailLogs.payments.length === 0 ? (
                  <div className="text-center py-8 text-muted text-xs font-mono">Belum ada riwayat perpanjangan.</div>
                ) : (
                  <div className="space-y-2.5">
                    {memberDetailLogs.payments.map((p) => (
                      <div key={p.id} className="p-3 bg-surface-lowest border border-white/8 rounded-lg flex items-center justify-between text-xs font-inter">
                        <div>
                          <p className="font-geist font-bold text-white uppercase tracking-wide text-[11px]">Perpanjangan Membership</p>
                          <p className="text-muted font-mono text-[10px] mt-0.5">
                            Tgl: {p.tanggal_bayar} | Metode: <span className="uppercase text-white">{p.metode}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white font-mono">Rp {Number(p.jumlah).toLocaleString('id-ID')}</span>
                          <p className="text-[9px] text-muted font-mono mt-0.5">S/D {p.periode_berlaku_sampai}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : detailTab === 'checkins' ? (
                memberDetailLogs.checkins.length === 0 ? (
                  <div className="text-center py-8 text-muted text-xs font-mono">Belum ada riwayat kunjungan.</div>
                ) : (
                  <div className="space-y-2.5">
                    {memberDetailLogs.checkins.map((c) => (
                      <div key={c.id} className="p-3 bg-surface-lowest border border-white/8 rounded-lg flex items-center justify-between text-xs font-inter">
                        <div>
                          <p className="font-geist font-bold text-white uppercase tracking-wide text-[11px]">Kunjungan Gym</p>
                          <p className="text-muted font-mono text-[10px] mt-0.5">
                            Waktu: {new Date(c.waktu_checkin).toLocaleString('id-ID')}
                          </p>
                        </div>

                        {c.tanda_tangan_url ? (
                          <div className="bg-white/95 px-2 py-1 rounded border border-white/10">
                            <img src={c.tanda_tangan_url} alt="TTD" className="h-6 object-contain" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-650 font-mono italic">no signature</span>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                memberDetailLogs.holidays.length === 0 ? (
                  <div className="text-center py-8 text-muted text-xs font-mono">Belum ada kompensasi hari libur.</div>
                ) : (
                  <div className="space-y-2.5">
                    {memberDetailLogs.holidays.map((h) => (
                      <div key={h.id} className="p-3 bg-surface-lowest border border-white/8 rounded-lg flex items-center justify-between text-xs font-inter">
                        <div>
                          <p className="font-geist font-bold text-white uppercase tracking-wide text-[11px]">{h.title}</p>
                          <p className="text-muted font-mono text-[10px] mt-0.5">
                            Libur: {h.start_date} s/d {h.end_date}
                          </p>
                        </div>
                        <span className="font-bold text-white bg-white/10 border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-mono">
                          +{h.total_days} Hari
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-elevated border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl relative font-inter">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/8">
              <h3 className="font-geist font-black text-white text-base uppercase tracking-tight">Pendaftaran Member Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-500 hover:text-white p-1 transition-colors"
              >
                <RiCloseLine className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1 font-geist">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={newMember.nama}
                  onChange={(e) => setNewMember({ ...newMember, nama: e.target.value })}
                  placeholder="Nama member"
                  className="w-full bg-surface-lowest border border-white/8 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-white/30 font-inter placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1 font-geist">
                  Nomor HP (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={newMember.no_hp}
                  onChange={(e) => setNewMember({ ...newMember, no_hp: e.target.value })}
                  placeholder="08123456789"
                  className="w-full bg-surface-lowest border border-white/8 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-white/30 font-inter placeholder:text-neutral-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1 font-geist">
                  Email Notifikasi
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="email@member.com"
                  className="w-full bg-surface-lowest border border-white/8 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-white/30 font-inter placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1 font-geist">
                  Pilihan Tipe Tarif
                </label>
                <select
                  value={newMember.tipe_tarif}
                  onChange={(e) => setNewMember({ ...newMember, tipe_tarif: e.target.value })}
                  className="w-full bg-surface-lowest border border-white/8 text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-white/30 font-inter"
                >
                  <option value="pelajar">Pelajar / Mahasiswa — Rp 130.000 / bln</option>
                  <option value="karyawan">Karyawan / Umum — Rp 150.000 / bln</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 font-geist">
                  Metode Pembayaran Pertama
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMetodeBayar('qris')}
                    className={`py-2 px-3 rounded-lg border text-[10px] font-bold font-geist uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      metodeBayar === 'qris'
                        ? 'bg-white text-canvas border-white'
                        : 'bg-surface-lowest text-muted border-white/8 hover:text-white'
                    }`}
                  >
                    <RiQrCodeLine className="w-4 h-4" /> QRIS Statis
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodeBayar('tunai')}
                    className={`py-2 px-3 rounded-lg border text-[10px] font-bold font-geist uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      metodeBayar === 'tunai'
                        ? 'bg-white text-canvas border-white'
                        : 'bg-surface-lowest text-muted border-white/8 hover:text-white'
                    }`}
                  >
                    <RiBankCardLine className="w-4 h-4" /> Tunai / Cash
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white hover:bg-[#e5e5e5] text-canvas font-bold py-2.5 rounded-lg transition-all shadow-md mt-2 cursor-pointer font-geist uppercase tracking-wider text-xs"
              >
                {submitting ? 'Mendaftarkan...' : 'Daftarkan Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Renew Member */}
      {showRenewModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-elevated border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl relative font-inter">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/8">
              <div>
                <h3 className="font-geist font-black text-white text-base uppercase tracking-tight">Perpanjangan Membership</h3>
                <p className="text-xs text-muted font-mono mt-0.5">{selectedMember.nama}</p>
              </div>
              <button
                onClick={() => setShowRenewModal(false)}
                className="text-neutral-500 hover:text-white p-1 transition-colors"
              >
                <RiCloseLine className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenewMember} className="space-y-4">
              <div className="p-4 bg-surface-lowest border border-white/8 rounded-lg space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted">Tipe Tarif:</span>
                  <span className="font-semibold text-white capitalize">{selectedMember.tipe_tarif}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Pembayaran:</span>
                  <span className="font-bold text-white text-sm">
                    Rp{' '}
                    {(selectedMember.tipe_tarif === 'pelajar' ? 130000 : 150000).toLocaleString(
                      'id-ID'
                    )}{' '}
                    (+1 Bulan)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 font-geist">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMetodeBayar('qris')}
                    className={`py-2.5 px-3 rounded-lg border text-[10px] font-bold font-geist uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      metodeBayar === 'qris'
                        ? 'bg-white text-canvas border-white'
                        : 'bg-surface-lowest text-muted border-white/8 hover:text-white'
                    }`}
                  >
                    <RiQrCodeLine className="w-4 h-4" /> QRIS Statis
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodeBayar('tunai')}
                    className={`py-2.5 px-3 rounded-lg border text-[10px] font-bold font-geist uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      metodeBayar === 'tunai'
                        ? 'bg-white text-canvas border-white'
                        : 'bg-surface-lowest text-muted border-white/8 hover:text-white'
                    }`}
                  >
                    <RiBankCardLine className="w-4 h-4" /> Tunai / Cash
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white hover:bg-[#e5e5e5] text-canvas font-bold py-2.5 rounded-lg transition-all shadow-md mt-2 cursor-pointer font-geist uppercase tracking-wider text-xs"
              >
                {submitting ? 'Memproses...' : 'Konfirmasi Perpanjangan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
