import { useState, useRef, useEffect } from 'react'
import SignaturePad from '../components/SignaturePad'
import { supabase } from '../lib/supabase'
import {
  RiPulseLine,
  RiQrCodeLine,
  RiUserFollowLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiErrorWarningLine,
  RiEditLine,
  RiRefreshLine,
  RiArrowRightLine,
  RiGroupLine,
} from '@remixicon/react'

export default function SelfCheckIn() {
  const [activeTab, setActiveTab] = useState('member')

  const [memberCode, setMemberCode] = useState('')

  const [nonMemberName, setNonMemberName] = useState('')
  const [showSignature, setShowSignature] = useState(false)
  const sigCanvasRef = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  // Auto-reset success message after 15 seconds as a fallback
  useEffect(() => {
    if (result && result.type === 'success') {
      const timer = setTimeout(() => {
        setResult(null)
        setMemberCode('')
        setNonMemberName('')
        setShowSignature(false)
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [result])

  const handleMemberSubmit = async (e) => {
    e.preventDefault()
    const cleanCode = memberCode.trim().toUpperCase()

    if (!cleanCode) return

    setSubmitting(true)
    setResult(null)

    try {
      // 1. Query member by unique_code
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('unique_code', cleanCode)
        .maybeSingle()

      if (error) throw error

      if (!member) {
        setResult({
          type: 'error',
          title: 'Kode Tidak Ditemukan',
          text: `Kode "${cleanCode}" tidak terdaftar di sistem. Harap periksa kembali atau minta bantuan admin.`,
        })
        setSubmitting(false)
        return
      }

      if (member.status === 'expired' || member.status === 'suspend') {
        setResult({
          type: 'warning',
          title: 'Membership Non-Aktif',
          text: `Status membership ${member.nama} saat ini adalah "${member.status.toUpperCase()}". Harap lakukan perpanjangan di kasir admin.`,
        })
        setSubmitting(false)
        return
      }

      // 2. Check if member has ALREADY checked in today (Client Check)
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const { data: existingCheckin } = await supabase
        .from('checkins')
        .select('waktu_checkin')
        .eq('member_id', member.id)
        .gte('waktu_checkin', startOfDay.toISOString())
        .maybeSingle()

      if (existingCheckin) {
        const timeStr = new Date(existingCheckin.waktu_checkin).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
        setResult({
          type: 'warning',
          title: 'Sudah Check-in Hari Ini',
          text: `Halo ${member.nama}, Anda sudah melakukan check-in hari ini pada jam ${timeStr}. Selamat berlatih!`,
        })
        setSubmitting(false)
        return
      }

      const { error: insertError } = await supabase.from('checkins').insert([
        {
          nama: member.nama,
          tipe: 'member',
          member_id: member.id,
          status_bayar: 'lunas',
          jumlah_bayar: 0,
          waktu_checkin: new Date().toISOString(),
        },
      ])

      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.includes('idx_unique_member_daily_checkin')) {
          setResult({
            type: 'warning',
            title: 'Sudah Check-in Hari Ini',
            text: `Halo ${member.nama}, Anda sudah melakukan check-in hari ini. Check-in ganda ditolak oleh database.`,
          })
          setSubmitting(false)
          return
        }
        throw insertError
      }

      setResult({
        type: 'success',
        title: `Selamat Datang, ${member.nama}! 💪`,
        text: `Check-in berhasil dicatat. Status Membership: ${member.status.toUpperCase()} (Berlaku s/d ${member.tanggal_jatuh_tempo}). Selamat berlatih!`,
      })
    } catch (err) {
      console.error('Self checkin error:', err)
      setResult({
        type: 'error',
        title: 'Gagal Check-in',
        text: err.message || 'Terjadi kesalahan sistem.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleNonMemberSubmit = async (e) => {
    e.preventDefault()

    if (!nonMemberName.trim()) return

    setSubmitting(true)
    setResult(null)

    try {
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

      const { error: insertError } = await supabase.from('checkins').insert([
        {
          nama: nonMemberName,
          tipe: 'non-member',
          member_id: null,
          tanda_tangan_url: signatureUrl,
          status_bayar: 'belum_bayar',
          jumlah_bayar: 15000,
          waktu_checkin: new Date().toISOString(),
        },
      ])

      if (insertError) throw insertError

      setResult({
        type: 'success',
        title: `Check-in Berhasil, ${nonMemberName}!`,
        text: 'Data kunjungan harian dicatat. Harap lakukan pembayaran Rp 15.000 di meja kasir/admin.',
      })
    } catch (err) {
      console.error('Non-member checkin error:', err)
      setResult({
        type: 'error',
        title: 'Gagal Check-in',
        text: err.message || 'Terjadi kesalahan sistem.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between p-4 sm:p-6">
      {/* Header Branding */}
      <header className="max-w-xl mx-auto w-full text-center pt-4 pb-6">
        <div className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-lg text-white mb-3 shadow-xl">
          <RiPulseLine className="w-10 h-10 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Self Check-in Gym</h1>
        <p className="text-muted text-sm mt-1">Masukkan kode member Anda untuk langsung latihan</p>
      </header>

      {/* Main Form Container */}
      <main className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-6 sm:p-8 shadow-2xl">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-surface-lowest border border-white/8 rounded-lg mb-8">
            <button
              type="button"
              onClick={() => {
                setActiveTab('member')
                setResult(null)
              }}
              className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'member'
                ? 'bg-white text-canvas shadow-lg'
                : 'text-muted hover:text-white'
                }`}
            >
              <RiQrCodeLine className="w-4 h-4" />
              Member Active
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('non-member')
                setResult(null)
              }}
              className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'non-member'
                ? 'bg-white text-canvas shadow-lg'
                : 'text-muted hover:text-white'
                }`}
            >
              <RiGroupLine className="w-4 h-4" />
              Non-Member (Harian)
            </button>
          </div>

          {/* Feedback Screen (Warnings and Errors) */}
          {result && result.type !== 'success' && (
            <div
              className={`mb-6 p-6 rounded-lg border flex flex-col items-center text-center animate-fade-in ${
                result.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {result.type === 'warning' && <RiErrorWarningLine className="w-12 h-12 mb-2 text-amber-400" />}
              {result.type === 'error' && <RiCloseCircleLine className="w-12 h-12 mb-2 text-red-400" />}

              <h3 className="text-lg font-bold text-white mb-1">{result.title}</h3>
              <p className="text-xs opacity-90 max-w-sm">{result.text}</p>
            </div>
          )}

          {/* Member Self Checkin Form */}
          {activeTab === 'member' ? (
            <form onSubmit={handleMemberSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 text-center">
                  Masukkan Kode Unik Member Anda
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
                  placeholder="KODE (6 DIGIT)"
                  className="w-full bg-surface-lowest border-2 border-white/8 focus:border-white/30 text-white rounded-lg py-3 text-center font-mono font-bold text-2xl tracking-widest uppercase focus:outline-none transition-all placeholder:text-neutral-600"
                />
                <p className="text-[11px] text-muted-soft text-center mt-2">
                  Kode dapat dilihat di kartu member atau ditanyakan ke meja admin.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || !memberCode.trim()}
                className="w-full bg-white hover:bg-[#e5e5e5] text-canvas font-bold py-2.5 rounded-lg transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs font-geist uppercase tracking-wider"
              >
                <span>{submitting ? 'Memverifikasi...' : 'Check-in Sekarang'}</span>
                <RiArrowRightLine className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Non-Member Self Checkin Form */
            <form onSubmit={handleNonMemberSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Nama Lengkap Pengunjung
                </label>
                <input
                  type="text"
                  required
                  value={nonMemberName}
                  onChange={(e) => setNonMemberName(e.target.value)}
                  placeholder="Ketik nama lengkap Anda..."
                  className="w-full bg-surface-lowest border border-white/8 text-white rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Digital Signature */}
              <div className="border border-white/8 rounded-lg p-4 bg-surface-lowest">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <RiEditLine className="w-4 h-4 text-white" />
                    Tanda Tangan Digital (Opsional)
                  </span>

                  {showSignature && (
                    <button
                      type="button"
                      onClick={() => sigCanvasRef.current?.clear()}
                      className="text-xs text-muted hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/8"
                    >
                      <RiRefreshLine className="w-3.5 h-3.5" /> Reset
                    </button>
                  )}
                </div>

                {showSignature ? (
                  <div className="border border-white/8 rounded-lg overflow-hidden">
                    <SignaturePad ref={sigCanvasRef} penColor="#ffffff" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSignature(true)}
                    className="w-full py-2.5 border border-dashed border-white/8 rounded-lg text-xs text-white hover:bg-white/5 transition-colors"
                  >
                    + Sentuh di sini untuk tanda tangan
                  </button>
                )}
              </div>

              <div className="p-4 bg-surface-lowest border border-white/8 rounded-lg flex items-center justify-between text-xs">
                <span className="text-muted font-medium">Biaya Kunjungan Harian:</span>
                <span className="font-bold text-white text-sm">Rp 15.000 (Bayar di Kasir)</span>
              </div>

              <button
                type="submit"
                disabled={submitting || !nonMemberName.trim()}
                className="w-full bg-white hover:bg-[#e5e5e5] text-canvas font-bold py-2.5 rounded-lg transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs font-geist uppercase tracking-wider"
              >
                <span>{submitting ? 'Menyimpan...' : 'Submit Check-in'}</span>
                <RiArrowRightLine className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-4 text-xs text-muted-soft">
        Bugar Gym straight up healthy
      </footer>

      {/* Success Modal Pop-up */}
      {result && result.type === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-elevated border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-center flex flex-col items-center font-inter animate-fade-in">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 mb-4">
              <RiCheckboxCircleLine className="w-12 h-12" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 font-geist uppercase tracking-wide">
              {result.title}
            </h3>
            
            <p className="text-xs text-muted leading-relaxed mb-6 max-w-xs font-mono">
              {result.text}
            </p>

            <button
              onClick={() => {
                setResult(null)
                setMemberCode('')
                setNonMemberName('')
                setShowSignature(false)
              }}
              className="w-full bg-white hover:bg-[#e5e5e5] text-canvas font-bold py-2.5 rounded-lg transition-all shadow-md cursor-pointer font-geist uppercase tracking-wider text-xs"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
