import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  RiPulseLine,
  RiQrCodeLine,
  RiArrowRightLine,
  RiCheckLine,
  RiCloseLine,
  RiSparklingLine,
  RiDashboardLine,
  RiGlobalLine,
  RiCodeLine,
  RiRefreshLine,
} from "@remixicon/react";

export default function Landing() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col font-inter">
      {/* Top Navigation */}
      <header className="border-b border-white/8 bg-[#131313]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-geist font-extrabold text-xl text-white tracking-tight uppercase">
              Bugar Gym
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#Fasilitas" className="text-xs font-semibold text-[#a1a1a1] hover:text-[#fafafa] uppercase tracking-wider transition-colors duration-200">
              Fasilitas
            </a>
            <a href="#Harga" className="text-xs font-semibold text-[#a1a1a1] hover:text-[#fafafa] uppercase tracking-wider transition-colors duration-200">
              Harga
            </a>
            <a href="#TentangKami" className="text-xs font-semibold text-[#a1a1a1] hover:text-[#fafafa] uppercase tracking-wider transition-colors duration-200">
              Tentang Kami
            </a>
          </nav>

          {/* CTA / Auth Link */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin"
                  className="bg-white hover:bg-[#e5e5e5] text-[#131313] text-xs font-bold px-5 py-2.5 rounded-md transition-all font-geist uppercase tracking-wider flex items-center gap-2"
                >
                  <RiDashboardLine className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-semibold text-[#a1a1a1] hover:text-[#fafafa] px-3 py-2 transition-colors uppercase tracking-wider font-geist"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/checkin-self"
                  className="text-xs font-semibold text-[#a1a1a1] hover:text-[#fafafa] uppercase tracking-wider transition-colors duration-200"
                >
                  Check-In
                </Link>
                <span className="text-xs text-[#6b6b6b] uppercase tracking-wider">atau</span>
                <Link
                  to="/login"
                  className="bg-white hover:bg-[#e5e5e5] text-[#131313] text-xs font-bold px-5 py-2.5 rounded-md transition-all font-geist uppercase tracking-wider"
                >
                  Masuk
                </Link>
              </div>

            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8 text-[#fafafa] text-[10px] font-bold uppercase tracking-wider font-geist mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Buka Setiap Hari</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#fafafa] tracking-tight leading-[1.15] uppercase font-geist mb-6">
              Mulai Kebugaran Anda Bareng Komunitas yang Suportif
            </h1>

            <p className="text-[#a1a1a1] text-sm sm:text-base leading-relaxed font-inter mb-8 max-w-xl">
              Tempat latihan santai tanpa tekanan. Peralatan lengkap untuk latihan dasar, dan teman-teman gym yang selalu siap bantu kalau Anda butuh arahan.
            </p>

            <div className="flex flex-row items-center gap-4 w-full sm:w-auto">
              <a
                href="#Harga"
                className="bg-white hover:bg-[#e5e5e5] text-[#131313] text-xs font-bold px-6 py-3.5 rounded-md transition-all font-geist uppercase tracking-wider text-center shadow-lg shadow-white/5"
              >
                Gabung Member
              </a>

              <a
                href="#Harga"
                className="bg-transparent hover:bg-white/5 text-white border border-white/10 text-xs font-bold px-6 py-3.5 rounded-md transition-all font-geist uppercase tracking-wider text-center"
              >
                Lihat Harga
              </a>
            </div>
          </div>

          {/* Right Hero Image/Mockup */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/10] rounded-xl overflow-hidden border border-white/8 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop"
              alt="Bugar Gym Interior"
              className="w-full h-full object-cover filter brightness-90 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Bento Grid ("Kenapa Pilih Kami?") */}
      <section id="Fasilitas" className="py-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/8">
        <div className="mb-10">
          <h2 className="text-xs font-bold text-white tracking-widest uppercase font-geist border-b-2 border-white w-fit pb-1.5">
            Kenapa Pilih Kami?
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bento Left: Large Featured Image Card */}
          <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-auto lg:h-full rounded-xl overflow-hidden border border-white/8 group flex flex-col justify-end p-8">
            <img
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop"
              alt="Weightlifter"
              className="w-full h-full object-cover filter grayscale contrast-125 brightness-75 absolute inset-0 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-black/40 to-transparent z-0" />

            <div className="relative z-10">
              <span className="inline-flex items-center text-[10px] font-bold text-white bg-white/10 border border-white/20 px-2.5 py-1 rounded-md uppercase tracking-wider w-fit mb-4 font-geist">
                Tanpa Gengsi
              </span>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight font-geist mb-2">
                Latihan Mu Pasti Dibantu
              </h3>
              <p className="text-[#a1a1a1] text-xs sm:text-sm font-inter leading-relaxed max-w-md">
                Cocok buat pemula sampai yang udah rutin. Nggak ada tekanan buat tampil sempurna.
              </p>
            </div>
          </div>

          {/* Bento Right Column Container */}
          <div className="flex flex-col gap-6">
            {/* Top Row: Elite Performance Card */}
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-white/8 group flex flex-col justify-end p-8">
              <img
                src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop"
                alt="Group workout class"
                className="w-full h-full object-cover filter brightness-[0.7] contrast-110 absolute inset-0 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-black/30 to-transparent z-0" />

              <div className="absolute top-6 right-6 z-10 text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                BUGAR GYM - ELITE PERFORMANCE
              </div>

              <div className="relative z-10">
                <span className="inline-flex items-center text-[10px] font-bold text-white bg-white/10 border border-white/20 px-2.5 py-1 rounded-md uppercase tracking-wider w-fit mb-3 font-geist">
                  Penuhi Goals Kamu
                </span>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight font-geist">
                  Bersama Member Lainnya
                </h3>
              </div>
            </div>

            {/* Bottom Row: 2-up subgrid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Bottom Col 1: Harga Terjangkau */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/8 group flex flex-col justify-end p-6">
                <img
                  src="https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=600&auto=format&fit=crop"
                  alt="Gym Reception"
                  className="w-full h-full object-cover filter brightness-[0.6] absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-0" />

                <div className="relative z-10">
                  <span className="inline-flex items-center text-[9px] font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-md uppercase tracking-wider w-fit mb-2 font-geist">
                    Harga Terjangkau
                  </span>
                  <p className="text-white text-xs font-semibold uppercase tracking-wide leading-snug">
                    Member bulanan mulai dari 130rb-an. Khusus pelajar.
                  </p>
                </div>
              </div>

              {/* Bottom Col 2: Jam Operasional */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/8 group flex flex-col justify-end p-6">
                <img
                  src="https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=600&auto=format&fit=crop"
                  alt="Dumbbells rack"
                  className="w-full h-full object-cover filter brightness-[0.6] absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-0" />

                <div className="relative z-10">
                  <span className="inline-flex items-center text-[9px] font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-md uppercase tracking-wider w-fit mb-2 font-geist">
                    Buka Setiap Hari
                  </span>
                  <p className="text-white text-xs font-semibold uppercase tracking-wide leading-snug">
                    Jam 6 Pagi Sampai 9 Malam
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Digital Section */}
      <section className="py-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xs font-bold text-white tracking-widest uppercase font-geist">
            Fitur Digital
          </h2>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Operational Specifications V1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Card 1: Kios 6-Digit */}
          <div className="bg-[#1c1b1b]/50 border border-white/8 p-8 rounded-xl flex flex-col items-start">
            <div className="p-3 bg-white/5 border border-white/8 rounded-lg text-white mb-6">
              <RiQrCodeLine className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wide mb-3 font-geist">
              Kios 6-Digit
            </h3>
            <p className="text-[#a1a1a1] text-xs leading-relaxed font-inter">
              Antarmuka mandiri untuk anggota. Check-in dalam hitungan detik menggunakan kode PIN unik tanpa intervensi staf.
            </p>
          </div>

          {/* Card 2: Kompensasi Otomatis */}
          <div className="bg-[#1c1b1b]/50 border border-white/8 p-8 rounded-xl flex flex-col items-start">
            <div className="p-3 bg-white/5 border border-white/8 rounded-lg text-white mb-6">
              <RiRefreshLine className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wide mb-3 font-geist">
              Kompensasi Otomatis
            </h3>
            <p className="text-[#a1a1a1] text-xs leading-relaxed font-inter">
              Sistem secara cerdas menyesuaikan masa berlaku keanggotaan saat hari libur nasional atau penutupan darurat.
            </p>
          </div>

          {/* Card 3: Resepsionis Cepat */}
          <div className="bg-[#1c1b1b]/50 border border-white/8 p-8 rounded-xl flex flex-col items-start">
            <div className="p-3 bg-white/5 border border-white/8 rounded-lg text-white mb-6">
              <RiPulseLine className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wide mb-3 font-geist">
              Resepsionis Cepat
            </h3>
            <p className="text-[#a1a1a1] text-xs leading-relaxed font-inter">
              Alur kerja pendaftaran anggota baru yang dioptimalkan untuk meminimalkan waktu antrean pada jam sibuk.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / Daftar Harga Section */}
      <section id="Harga" className="py-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/8">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-extrabold text-white tracking-tight uppercase font-geist">
            Daftar Harga
          </h2>
          <p className="text-[#a1a1a1] text-sm mt-3 font-inter max-w-2xl mx-auto">
            Choose your level of commitment. Every membership grants access to our world-class facilities and recovery lounge.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Card 1: Visitor */}
          <div className="bg-[#1c1b1b] border border-white/8 p-8 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[#a1a1a1] text-xs font-bold uppercase tracking-wider font-geist">
                Visitor
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-black text-white font-geist">15k</span>
                <span className="text-zinc-500 text-sm font-inter">/sesi</span>
              </div>
              <ul className="mt-8 space-y-4 text-xs font-inter">
                <li className="flex items-center gap-3 text-zinc-300">
                  <RiCheckLine className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Cukup 15.000 untuk setiap sesi</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <RiCheckLine className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Locker & Akses Mushola</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <RiCheckLine className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Komunitas Latihan</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-600 line-through">
                  <RiCloseLine className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span>Digital Tracking App</span>
                </li>
              </ul>
            </div>
            <a
              href="#cta"
              className="mt-8 w-full bg-[#262626] border border-white/8 hover:bg-[#323232] text-zinc-300 font-semibold py-3 rounded-md text-xs text-center font-geist uppercase tracking-wider transition-all block"
            >
              Select Tier
            </a>
          </div>

          {/* Card 2: Membership Pelajar (Featured - White background) */}
          <div className="bg-white border-2 border-white shadow-2xl p-8 rounded-xl flex flex-col justify-between relative lg:-translate-y-2 lg:scale-105 z-10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#131313] text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-md tracking-wider font-geist">
              Recommended
            </span>
            <div>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider font-geist">
                Membership Pelajar
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-black text-black font-geist">130k</span>
                <span className="text-zinc-400 text-sm font-inter">/bulan</span>
              </div>
              <ul className="mt-8 space-y-4 text-xs font-inter">
                <li className="flex items-center gap-3 text-zinc-800">
                  <RiCheckLine className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Perpanjangan Kompensasi Libur</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-800">
                  <RiCheckLine className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Locker & Akses Mushola</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-800">
                  <RiCheckLine className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Komunitas Latihan</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-800">
                  <RiCheckLine className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Digital Tracking App</span>
                </li>
              </ul>
            </div>
            <a
              href="#cta"
              className="mt-8 w-full bg-[#131313] hover:bg-[#242424] text-white font-bold py-3.5 rounded-md text-xs text-center font-geist uppercase tracking-wider transition-all block shadow-lg"
            >
              Join Elite
            </a>
          </div>

          {/* Card 3: Membership Umum */}
          <div className="bg-[#1c1b1b] border border-white/8 p-8 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[#a1a1a1] text-xs font-bold uppercase tracking-wider font-geist">
                Membership Umum
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-black text-white font-geist">150k</span>
                <span className="text-zinc-500 text-sm font-inter">/bulan</span>
              </div>
              <ul className="mt-8 space-y-4 text-xs font-inter">
                <li className="flex items-center gap-3 text-zinc-300">
                  <RiCheckLine className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Perpanjangan Kompensasi Libur</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <RiCheckLine className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Locker & Akses Mushola</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <RiCheckLine className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Komunitas Latihan</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <RiCheckLine className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Digital Tracking App</span>
                </li>
              </ul>
            </div>
            <a
              href="#cta"
              className="mt-8 w-full bg-[#262626] border border-white/8 hover:bg-[#323232] text-zinc-300 font-semibold py-3 rounded-md text-xs text-center font-geist uppercase tracking-wider transition-all block"
            >
              Select Tier
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/8">
        <div className="relative overflow-hidden rounded-xl border border-white/8 py-20 px-8 text-center bg-[#1c1b1b] shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop"
            alt="Workout background"
            className="w-full h-full object-cover filter brightness-[0.15] contrast-100 absolute inset-0 z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1c1b1b]/90 via-transparent to-[#1c1b1b]/90 pointer-events-none z-0" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase font-geist mb-4">
              Yuk, Mulai Kebiasaan Sehat Bareng Kami
            </h2>
            <p className="text-[#a1a1a1] text-sm sm:text-base font-inter max-w-xl mx-auto mb-8">
              Nggak perlu alat mahal atau gym mewah buat mulai. Yang penting niat, sisanya bisa dipelajari bareng-bareng di sini.
            </p>
            <a
              href="https://wa.me/628274274274?text=Halo%20Bugar%20Gym%2C%20saya%20tertarik%20untuk%20datang%20dan%20mencoba%20latihan%20di%20sini."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white hover:bg-[#e5e5e5] text-[#131313] font-bold px-8 py-3.5 rounded-full transition-all text-xs font-geist uppercase tracking-wider cursor-pointer shadow-lg"
            >
              Datang & Coba Gym
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight font-geist">15 Jam</div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
              Operasional Per Hari
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight font-geist">7/7</div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
              Buka Tiap Hari
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight font-geist">15rb</div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
              Saja Untuk Tiap Sesi
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight font-geist">130rb-an</div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
              Untuk Pelajar
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="TentangKami" className="bg-[#0a0a0a] border-t border-white/8 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
            {/* Col 1: Brand Info */}
            <div className="flex flex-col items-start">
              <span className="font-geist font-extrabold text-lg text-white uppercase tracking-tight">
                Bugar Gym
              </span>
              <p className="text-zinc-500 text-xs font-inter leading-relaxed mt-4 mb-6 max-w-xs">
                Sistem manajemen fasilitas kebugaran generasi masa depan. Menggabungkan kemudahan penggunaan dengan fungsionalitas tingkat industri.
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-8 h-8 rounded-full border border-white/10 hover:border-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                >
                  <RiGlobalLine className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full border border-white/10 hover:border-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                >
                  <RiCodeLine className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Spacer */}
            <div className="hidden lg:block" />

            {/* Col 3: Navigation */}
            <div>
              <h4 className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest mb-4">
                Navigasi
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-zinc-500 hover:text-white text-xs transition-colors py-1 block">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-zinc-500 hover:text-white text-xs transition-colors py-1 block">
                    Login Admin
                  </Link>
                </li>
                <li>
                  <Link to="/checkin-self" className="text-zinc-500 hover:text-white text-xs transition-colors py-1 block">
                    Check-in Membership
                  </Link>
                </li>
                <li>
                  <a href="#TentangKami" className="text-zinc-500 hover:text-white text-xs transition-colors py-1 block">
                    Tentang Kami
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Legal */}
            <div>
              <h4 className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest mb-4">
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-zinc-500 hover:text-white text-xs transition-colors py-1 block">
                    Privasi
                  </a>
                </li>
                <li>
                  <a href="#" className="text-zinc-500 hover:text-white text-xs transition-colors py-1 block">
                    Ketentuan Layanan
                  </a>
                </li>
                <li>
                  <a href="#" className="text-zinc-500 hover:text-white text-xs transition-colors py-1 block">
                    SLA
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom copyright */}
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-zinc-600">
            <div>© 2026 Bugar Gym - HEALTHEMA SPONSER.</div>
            <div>Seluruh hak cipta dilindungi.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
