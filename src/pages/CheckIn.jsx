import { useState, useEffect, useRef } from 'react'
import SignaturePad from '../components/SignaturePad'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import {
  RiUserFollowLine,
  RiSearchLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiCloseCircleLine,
  RiEditLine,
  RiRefreshLine,
  RiSkipRightLine,
  RiTimeLine,
  RiMoneyDollarCircleLine,
  RiCheckLine,
} from '@remixicon/react'

export default function CheckIn() {
  const [visitorType, setVisitorType] = useState('non-member')
  const [visitorName, setVisitorName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberSearchResults, setMemberSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSignature, setShowSignature] = useState(false)
  const [statusBayar, setStatusBayar] = useState('lunas')
  const [jumlahBayar, setJumlahBayar] = useState(15000)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [todayCheckins, setTodayCheckins] = useState([])
  const [loadingList, setLoadingList] = useState(true)

  const sigCanvasRef = useRef(null)

  const fetchTodayCheckins = async () => {
    setLoadingList(true)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('checkins')
      .select('*, members(nama, status)')
      .gte('waktu_checkin', startOfDay.toISOString())
      .order('waktu_checkin', { ascending: false })

    if (!error && data) {
      setTodayCheckins(data)
    }
    setLoadingList(false)
  }

  useEffect(() => {
    fetchTodayCheckins()
  }, [])

  useEffect(() => {
    if (visitorType !== 'member' || searchQuery.trim().length < 2) {
      setMemberSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .or(`nama.ilike.%${searchQuery}%,no_hp.ilike.%${searchQuery}%,unique_code.ilike.%${searchQuery}%`)
        .limit(5)

      if (!error && data) {
        setMemberSearchResults(data)
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, visitorType])

  const handleSelectMember = (member) => {
    setSelectedMember(member)
    setVisitorName(member.nama)
    setSearchQuery('')
    setMemberSearchResults([])
  }

  const handleClearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear()
    }
  }

  const handleCheckInSubmit = async (e) => {
    e.preventDefault()

    if (visitorType === 'member' && !selectedMember) {
      setMessage({ type: 'error', text: 'Silakan pilih member dari hasil pencarian.' })
      return
    }

    if (!visitorName.trim()) {
      setMessage({ type: 'error', text: 'Nama pengunjung tidak boleh kosong.' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      // 1. Enforce 1 check-in per member per day restriction (Client check)
      if (visitorType === 'member' && selectedMember) {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const { data: existingCheckin } = await supabase
          .from('checkins')
          .select('waktu_checkin')
          .eq('member_id', selectedMember.id)
          .gte('waktu_checkin', startOfDay.toISOString())
          .maybeSingle()

        if (existingCheckin) {
          const timeStr = new Date(existingCheckin.waktu_checkin).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })
          setMessage({
            type: 'error',
            text: `Member ${selectedMember.nama} sudah melakukan check-in hari ini pada jam ${timeStr}. Check-in ganda tidak diperbolehkan.`,
          })
          setSubmitting(false)
          return
        }
      }

      let signatureUrl = null

      if (showSignature && sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        const dataUrl = sigCanvasRef.current.toDataURL('image/png')
        const blob = await (await fetch(dataUrl)).blob()
        const fileName = `sig_${Date.now()}_${Math.random().toString(36).substring(7)}.png`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('signatures')
          .upload(fileName, blob, { contentType: 'image/png' })

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('signatures')
            .getPublicUrl(fileName)
          signatureUrl = publicUrlData.publicUrl
        }
      }

      const checkinPayload = {
        nama: visitorName,
        tipe: visitorType,
        member_id: visitorType === 'member' ? selectedMember?.id : null,
        tanda_tangan_url: signatureUrl,
        status_bayar: visitorType === 'non-member' ? statusBayar : 'lunas',
        jumlah_bayar: visitorType === 'non-member' ? Number(jumlahBayar) : 0,
        waktu_checkin: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from('checkins').insert([checkinPayload])

      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.includes('idx_unique_member_daily_checkin')) {
          setMessage({
            type: 'error',
            text: `Member ${visitorName} sudah melakukan check-in hari ini. Check-in ganda ditolak oleh database.`,
          })
          setSubmitting(false)
          return
        }
        throw insertError
      }

      setMessage({ type: 'success', text: `Check-in ${visitorName} berhasil dicatat!` })

      setVisitorName('')
      setSelectedMember(null)
      setSearchQuery('')
      setShowSignature(false)
      if (sigCanvasRef.current) sigCanvasRef.current.clear()

      fetchTodayCheckins()
    } catch (err) {
      console.error('Check-in error:', err)
      setMessage({ type: 'error', text: err.message || 'Gagal mencatat check-in.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprovePayment = async (id) => {
    try {
      const { error } = await supabase
        .from('checkins')
        .update({ status_bayar: 'lunas' })
        .eq('id', id)

      if (error) throw error
      fetchTodayCheckins()
    } catch (err) {
      console.error('Error approving payment:', err)
      alert('Gagal menyetujui pembayaran: ' + err.message)
    }
  }


  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-inter">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase font-geist">Form Pengunjung</h1>
          <p className="text-muted text-xs font-inter mt-1 font-normal">
            Catat kunjungan harian member atau non-member gym
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Check-in Form Card */}
          <div className="lg:col-span-7 bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6 shadow-xl">
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-xs font-mono border ${message.type === 'success'
                  ? 'bg-white/5 border-white/10 text-white'
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

            {/* Visitor Type Selector */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-surface-lowest/50 border border-white/8 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => {
                  setVisitorType('non-member')
                  setSelectedMember(null)
                  setVisitorName('')
                }}
                className={`py-2.5 rounded-md text-xs font-bold uppercase tracking-wider font-geist transition-all cursor-pointer ${visitorType === 'non-member'
                  ? 'bg-white text-canvas shadow-md'
                  : 'text-muted hover:text-white'
                  }`}
              >
                Non-Member (Harian)
              </button>

              <button
                type="button"
                onClick={() => {
                  setVisitorType('member')
                  setVisitorName('')
                }}
                className={`py-2.5 rounded-md text-xs font-bold uppercase tracking-wider font-geist transition-all cursor-pointer ${visitorType === 'member'
                  ? 'bg-white text-canvas shadow-md'
                  : 'text-muted hover:text-white'
                  }`}
              >
                Member Active
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-6">
              {/* Member Autocomplete or Non-Member Input */}
              {visitorType === 'member' ? (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 font-geist">
                    Cari Member (Nama / No. HP / Kode Unik)
                  </label>
                  {!selectedMember ? (
                    <div className="relative">
                      <RiSearchLine className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ketik nama, nomor HP, atau kode..."
                        className="w-full bg-surface-lowest border border-white/8 text-white rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white/30 transition-all font-inter placeholder:text-neutral-600"
                      />

                      {/* Search Results Dropdown */}
                      {isSearching && (
                        <div className="absolute z-10 w-full mt-2 bg-surface-elevated border border-white/8 rounded-lg p-3 text-xs text-muted text-center font-mono">
                          Mencari member...
                        </div>
                      )}

                      {memberSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-surface-elevated border border-white/8 rounded-lg shadow-2xl max-h-60 overflow-y-auto divide-y divide-white/5">
                          {memberSearchResults.map((member) => (
                            <div
                              key={member.id}
                              onClick={() => handleSelectMember(member)}
                              className="p-3 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-geist font-bold text-white text-sm uppercase tracking-wide">{member.nama}</p>
                                  <span className="font-mono text-[9px] text-white bg-white/10 border border-white/10 px-1.5 py-0.5 rounded">
                                    {member.unique_code || '-'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted font-mono mt-0.5">{member.no_hp || 'No HP -'}</p>
                              </div>
                              <span
                                className={`text-[9px] font-bold font-geist uppercase px-2.5 py-1 rounded-full border ${member.status === 'aktif'
                                  ? 'bg-white/10 text-white border-white/20'
                                  : member.status === 'akan_habis'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}
                              >
                                {member.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Selected Member Card */
                    <div className="p-4 bg-surface-lowest border border-white/15 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-geist font-bold text-white text-sm uppercase tracking-wide">{selectedMember.nama}</h4>
                          <span className="font-mono text-[9px] text-white bg-white/10 border border-white/10 px-2 py-0.5 rounded font-bold">
                            {selectedMember.unique_code || '-'}
                          </span>
                          <span
                            className={`text-[9px] font-bold font-geist uppercase px-2.5 py-0.5 rounded-full border ${selectedMember.status === 'aktif'
                              ? 'bg-white/10 text-white border-white/20'
                              : selectedMember.status === 'akan_habis'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}
                          >
                            {selectedMember.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted font-mono mt-1">
                          No HP: {selectedMember.no_hp || '-'} | Due: {selectedMember.tanggal_jatuh_tempo || '-'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(null)
                          setVisitorName('')
                        }}
                        className="text-[10px] text-muted hover:text-white px-2.5 py-1 rounded-md border border-white/8 hover:bg-white/5 transition-all font-geist uppercase tracking-wider"
                      >
                        Ganti
                      </button>
                    </div>
                  )}

                  {/* Warning if Expired */}
                  {selectedMember && selectedMember.status === 'expired' && (
                    <div className="mt-3 p-3 bg-red-500/5 border border-red-500/15 rounded-lg flex items-center gap-2 text-xs text-red-400 font-mono">
                      <RiAlertLine className="w-4 h-4 flex-shrink-0" />
                      <span>Membership expired. Harap lakukan pembayaran perpanjangan terlebih dahulu.</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Non-Member Input */
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 font-geist">
                    Nama Pengunjung Non-Member
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-surface-lowest border border-white/8 text-white rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-white/30 transition-all font-inter placeholder:text-neutral-600"
                  />
                </div>
              )}

              {/* Non-Member Payment Details */}
              {visitorType === 'non-member' && (
                <div className="p-4 bg-surface-lowest/50 border border-white/8 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider font-geist flex items-center gap-1.5">
                      <RiMoneyDollarCircleLine className="w-4 h-4 text-white" />
                      Biaya Kunjungan Harian
                    </span>
                    <span className="font-bold text-white text-base font-mono">
                      Rp {Number(jumlahBayar).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted font-geist uppercase tracking-wider font-semibold">Status Bayar:</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStatusBayar('lunas')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-geist uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${statusBayar === 'lunas'
                          ? 'bg-white text-canvas'
                          : 'bg-white/5 text-muted border border-white/8 hover:text-white'
                          }`}
                      >
                        <RiCheckLine className="w-3.5 h-3.5" />
                        Lunas
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusBayar('belum_bayar')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-geist uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${statusBayar === 'belum_bayar'
                          ? 'bg-white text-canvas'
                          : 'bg-white/5 text-muted border border-white/8 hover:text-white'
                          }`}
                      >
                        Belum Bayar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Digital Signature Canvas Section */}
              <div className="border border-white/8 rounded-lg p-4 bg-surface-lowest/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider font-geist flex items-center gap-1.5">
                    <RiEditLine className="w-4 h-4 text-white" />
                    Tanda Tangan Digital
                  </span>

                  <div className="flex items-center gap-2">
                    {showSignature && (
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="text-[10px] text-muted hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-md border border-white/8 bg-surface-lowest hover:bg-white/5 font-geist uppercase tracking-wider transition-colors"
                      >
                        <RiRefreshLine className="w-3.5 h-3.5" />
                        Reset
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowSignature(!showSignature)}
                      className="text-[10px] text-white font-geist font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {showSignature ? (
                        <>
                          <RiSkipRightLine className="w-3.5 h-3.5" /> Skip
                        </>
                      ) : (
                        '+ Tambah TTD'
                      )}
                    </button>
                  </div>
                </div>

                {showSignature ? (
                  <div className="border border-white/8 rounded-lg overflow-hidden">
                    <SignaturePad ref={sigCanvasRef} penColor="#ffffff" />
                  </div>
                ) : (
                  <p className="text-xs text-muted italic font-inter font-normal">
                    Tanda tangan dilewati. Klik "+ Tambah TTD" jika pengunjung ingin mengisi tanda tangan.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white hover:bg-[#e5e5e5] text-canvas font-bold py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-geist uppercase tracking-wider text-xs"
              >
                <RiUserFollowLine className="w-4 h-4" />
                {submitting ? 'Menyimpan...' : 'Proses Check-in'}
              </button>
            </form>
          </div>

          {/* Today's Realtime Check-ins List */}
          <div className="lg:col-span-5 bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/8">
              <h3 className="font-geist font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <RiTimeLine className="w-4 h-4 text-white" />
                Kunjungan Hari Ini
              </h3>
              <span className="text-[10px] font-bold bg-white/5 border border-white/8 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                {todayCheckins.length} Total
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1">
              {loadingList ? (
                <div className="text-center py-8 text-muted text-xs font-mono">Memuat kunjungan...</div>
              ) : todayCheckins.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs font-mono">
                  Belum ada kunjungan hari ini.
                </div>
              ) : (
                todayCheckins.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-surface-lowest border border-white/8 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-geist font-bold text-white text-sm uppercase tracking-wide">{item.nama}</span>
                        <span
                          className={`text-[9px] font-bold font-geist uppercase px-2 py-0.5 rounded border ${item.tipe === 'member'
                            ? 'bg-white/10 text-white border-white/20'
                            : 'bg-white/5 text-muted border-white/10'
                            }`}
                        >
                          {item.tipe}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted font-mono mt-1">
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
                          className="text-[9px] font-bold font-geist uppercase bg-white text-canvas px-2.5 py-1 rounded border border-white hover:bg-[#e5e5e5] transition-all cursor-pointer"
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
