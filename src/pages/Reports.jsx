import { useState, useEffect } from "react";
import XLSX from "xlsx-js-style";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { RiFileExcelLine } from "@remixicon/react";

export default function Reports() {
  const [filterType, setFilterType] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [checkinsData, setCheckinsData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [activeTab, setActiveTab] = useState("checkins");
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    let start = new Date();
    let end = new Date();

    if (filterType === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (filterType === "week") {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (filterType === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (filterType === "custom" && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const { data: checkins } = await supabase
      .from("checkins")
      .select("*")
      .gte("waktu_checkin", start.toISOString())
      .lte("waktu_checkin", end.toISOString())
      .order("waktu_checkin", { ascending: false });

    const { data: payments } = await supabase
      .from("payments")
      .select("*, members(nama, tipe_tarif)")
      .gte("tanggal_bayar", start.toISOString().split("T")[0])
      .lte("tanggal_bayar", end.toISOString().split("T")[0])
      .order("created_at", { ascending: false });

    if (checkins) setCheckinsData(checkins);
    if (payments) setPaymentsData(payments);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [filterType, startDate, endDate]);

  // Export to Excel using SheetJS
  const exportToExcel = () => {
    const todayStr = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    if (activeTab === "checkins") {
      const formattedCheckins = checkinsData.map((item, index) => ({
        No: index + 1,
        "Waktu Check-in": new Date(item.waktu_checkin).toLocaleString("id-ID"),
        Nama: item.nama,
        Tipe: item.tipe === 'member' ? 'Member Active' : 'Non-Member (Harian)',
        "Status Bayar": item.status_bayar === 'lunas' ? 'Lunas' : 'Belum Bayar',
        "Jumlah Bayar (Rp)": item.jumlah_bayar || 0,
      }));

      const titleRows = [
        ["BUGAR GYM - LAPORAN KUNJUNGAN CHECK-IN"],
        [`Tanggal Cetak: ${todayStr} (Waktu Sistem)`],
        [`Total Kunjungan: ${formattedCheckins.length} kali`],
        []
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(titleRows);
      XLSX.utils.sheet_add_json(worksheet, formattedCheckins, { origin: "A5" });

      const totalRevenue = checkinsData.reduce((sum, item) => sum + (item.jumlah_bayar || 0), 0);
      const nextRow = 5 + formattedCheckins.length + 2;
      XLSX.utils.sheet_add_aoa(worksheet, [
        ["Total Pendapatan Check-in", "", "", "", "", totalRevenue]
      ], { origin: `A${nextRow}` });

      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: nextRow - 1, c: 0 }, e: { r: nextRow - 1, c: 4 } }
      ];

      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = worksheet[cell_ref];
          if (!cell) continue;

          if (R === 0) {
            cell.s = {
              font: { name: "Segoe UI", bold: true, sz: 14, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "131313" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          } else if (R === 1 || R === 2) {
            cell.s = {
              font: { name: "Segoe UI", italic: true, sz: 10, color: { rgb: "6B7280" } }
            };
          } else if (R === 4) {
            cell.s = {
              font: { name: "Segoe UI", bold: true, sz: 11, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "262626" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "4B5563" } },
                bottom: { style: "medium", color: { rgb: "111827" } }
              }
            };
          } else if (R === nextRow - 1) {
            cell.s = {
              font: { name: "Segoe UI", bold: true, sz: 11, color: { rgb: "111827" } },
              fill: { fgColor: { rgb: "F3F4F6" } },
              alignment: { horizontal: C === 5 ? "right" : "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "D1D5DB" } },
                bottom: { style: "double", color: { rgb: "111827" } }
              }
            };
          } else if (R > 4) {
            const isEven = R % 2 === 0;
            cell.s = {
              font: { name: "Segoe UI", sz: 10 },
              fill: { fgColor: { rgb: isEven ? "F9FAFB" : "FFFFFF" } },
              alignment: {
                horizontal: (C === 0 || C === 3 || C === 4) ? "center" : (C === 5 ? "right" : "left"),
                vertical: "center"
              },
              border: {
                bottom: { style: "thin", color: { rgb: "E5E7EB" } }
              }
            };
          }
        }
      }

      worksheet["!cols"] = [
        { wch: 6 }, { wch: 22 }, { wch: 25 }, { wch: 22 }, { wch: 15 }, { wch: 22 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Checkin");
      XLSX.writeFile(workbook, `Laporan_Checkin_Gym_${new Date().toISOString().split("T")[0]}.xlsx`);
    } else {
      const formattedPayments = paymentsData.map((item, index) => ({
        No: index + 1,
        "Tanggal Bayar": item.tanggal_bayar,
        Member: item.members?.nama || "-",
        Tarif: item.members?.tipe_tarif === 'pelajar' ? 'Pelajar/Mahasiswa' : 'Karyawan/Umum',
        Metode: item.metode.toUpperCase(),
        "Nominal (Rp)": item.jumlah || 0,
        "Berlaku Sampai": item.periode_berlaku_sampai,
      }));

      const titleRows = [
        ["BUGAR GYM - LAPORAN TRANSAKSI PEMBAYARAN MEMBERSHIP"],
        [`Tanggal Cetak: ${todayStr} (Waktu Sistem)`],
        [`Total Transaksi: ${formattedPayments.length} transaksi`],
        []
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(titleRows);

      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }
      ];

      XLSX.utils.sheet_add_json(worksheet, formattedPayments, { origin: "A5" });

      const totalIncome = paymentsData.reduce((sum, item) => sum + (item.jumlah || 0), 0);
      const nextRow = 5 + formattedPayments.length + 2;
      
      XLSX.utils.sheet_add_aoa(worksheet, [
        ["Total Pendapatan Membership", "", "", "", "", totalIncome, ""]
      ], { origin: `A${nextRow}` });

      worksheet["!merges"].push({
        s: { r: nextRow - 1, c: 0 },
        e: { r: nextRow - 1, c: 4 }
      });

      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = worksheet[cell_ref];
          if (!cell) continue;

          if (R === 0) {
            cell.s = {
              font: { name: "Segoe UI", bold: true, sz: 14, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "131313" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          } else if (R === 1 || R === 2) {
            cell.s = {
              font: { name: "Segoe UI", italic: true, sz: 10, color: { rgb: "6B7280" } }
            };
          } else if (R === 4) {
            cell.s = {
              font: { name: "Segoe UI", bold: true, sz: 11, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "262626" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "4B5563" } },
                bottom: { style: "medium", color: { rgb: "111827" } }
              }
            };
          } else if (R === nextRow - 1) {
            cell.s = {
              font: { name: "Segoe UI", bold: true, sz: 11, color: { rgb: "111827" } },
              fill: { fgColor: { rgb: "F3F4F6" } },
              alignment: { horizontal: C === 5 ? "right" : "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "D1D5DB" } },
                bottom: { style: "double", color: { rgb: "111827" } }
              }
            };
          } else if (R > 4) {
            const isEven = R % 2 === 0;
            cell.s = {
              font: { name: "Segoe UI", sz: 10 },
              fill: { fgColor: { rgb: isEven ? "F9FAFB" : "FFFFFF" } },
              alignment: {
                horizontal: (C === 0 || C === 4) ? "center" : (C === 5 ? "right" : "left"),
                vertical: "center"
              },
              border: {
                bottom: { style: "thin", color: { rgb: "E5E7EB" } }
              }
            };
          }
        }
      }

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 25 },
        { wch: 20 },
        { wch: 12 },
        { wch: 22 },
        { wch: 18 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Pembayaran");
      XLSX.writeFile(workbook, `Laporan_Pembayaran_Gym_${new Date().toISOString().split("T")[0]}.xlsx`);
    }
  };


  const totalCheckinIncome = checkinsData.reduce(
    (acc, curr) => acc + (Number(curr.jumlah_bayar) || 0),
    0
  );
  const totalPaymentIncome = paymentsData.reduce(
    (acc, curr) => acc + (Number(curr.jumlah) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-inter">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase font-geist">
              Laporan & Analytic
            </h1>
            <p className="text-muted text-xs font-inter mt-1">
              Rekapitulasi kunjungan harian, riwayat transaksi, dan export data Excel
            </p>
          </div>

          <button
            onClick={exportToExcel}
            className="bg-white hover:bg-[#e5e5e5] text-canvas text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-geist uppercase tracking-wider"
          >
            <RiFileExcelLine className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>

        {/* Filters Header */}
        <div className="bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {[
              { id: "today", label: "Hari Ini" },
              { id: "week", label: "7 Hari Terakhir" },
              { id: "month", label: "Bulan Ini" },
              { id: "custom", label: "Custom Date" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3.5 py-2 rounded-lg text-[10px] font-bold font-geist uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${filterType === f.id
                  ? "bg-white text-canvas"
                  : "bg-white/5 text-muted border border-white/8 hover:text-white"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filterType === "custom" && (
            <div className="flex items-center gap-2 text-xs w-full md:w-auto font-mono">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-surface-lowest border border-white/8 text-white rounded-lg py-1.5 px-3 focus:outline-none focus:border-white/30"
              />
              <span className="text-muted">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-surface-lowest border border-white/8 text-white rounded-lg py-1.5 px-3 focus:outline-none focus:border-white/30"
              />
            </div>
          )}
        </div>

        {/* Metric Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-5">
            <span className="text-muted text-[10px] font-bold uppercase tracking-wider font-geist">
              Total Kunjungan
            </span>
            <div className="text-2xl font-black text-white mt-1 font-geist">
              {checkinsData.length} Kunjungan
            </div>
          </div>

          <div className="bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-5">
            <span className="text-muted text-[10px] font-bold uppercase tracking-wider font-geist">
              Pendapatan Non-Member
            </span>
            <div className="text-2xl font-black text-white mt-1 font-geist font-mono">
              Rp {totalCheckinIncome.toLocaleString("id-ID")}
            </div>
          </div>

          <div className="bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-5">
            <span className="text-muted text-[10px] font-bold uppercase tracking-wider font-geist">
              Pendapatan Renewal Member
            </span>
            <div className="text-2xl font-black text-white mt-1 font-geist font-mono">
              Rp {totalPaymentIncome.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8 mb-6">
          <button
            onClick={() => setActiveTab("checkins")}
            className={`pb-3 px-4 font-bold text-[10px] font-geist uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === "checkins"
              ? "border-white text-white"
              : "border-transparent text-muted hover:text-white"
              }`}
          >
            Kunjungan Check-in ({checkinsData.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-3 px-4 font-bold text-[10px] font-geist uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === "payments"
              ? "border-white text-white"
              : "border-transparent text-muted hover:text-white"
              }`}
          >
            Transaksi Keanggotaan ({paymentsData.length})
          </button>
        </div>

        {/* Table View */}
        <div className="bg-surface-card/70 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            {activeTab === "checkins" ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-lowest text-muted text-[10px] font-bold uppercase tracking-wider border-b border-white/8">
                  <tr>
                    <th className="px-6 py-4">Waktu Check-in</th>
                    <th className="px-6 py-4">Nama Pengunjung</th>
                    <th className="px-6 py-4">Tipe</th>
                    <th className="px-6 py-4">Status Bayar</th>
                    <th className="px-6 py-4 text-right">Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-ink">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-muted text-xs font-mono">
                        Memuat data...
                      </td>
                    </tr>
                  ) : checkinsData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-muted text-xs font-mono">
                        Tidak ada data check-in dalam periode ini.
                      </td>
                    </tr>
                  ) : (
                    checkinsData.map((row) => (
                      <tr key={row.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-muted">
                          {new Date(row.waktu_checkin).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 font-geist font-bold text-white uppercase tracking-wide">
                          {row.nama}
                        </td>
                        <td className="px-6 py-4 capitalize">
                          <span
                            className={`text-[9px] font-bold font-geist uppercase px-2.5 py-0.5 rounded border ${row.tipe === "member"
                              ? "bg-white/10 text-white border-white/20"
                              : "bg-white/5 text-muted border-white/10"
                              }`}
                          >
                            {row.tipe}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs uppercase">
                          <span className={row.status_bayar === "lunas" ? "text-white font-semibold" : "text-amber-400 font-semibold"}>
                            {row.status_bayar}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-white">
                          Rp {Number(row.jumlah_bayar || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-lowest text-muted text-[10px] font-bold uppercase tracking-wider border-b border-white/8">
                  <tr>
                    <th className="px-6 py-4">Tanggal Bayar</th>
                    <th className="px-6 py-4">Nama Member</th>
                    <th className="px-6 py-4">Tipe Tarif</th>
                    <th className="px-6 py-4">Metode</th>
                    <th className="px-6 py-4">Periode Berlaku</th>
                    <th className="px-6 py-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-ink">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-muted text-xs font-mono">
                        Memuat data...
                      </td>
                    </tr>
                  ) : paymentsData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-muted text-xs font-mono">
                        Tidak ada transaksi pembayaran dalam periode ini.
                      </td>
                    </tr>
                  ) : (
                    paymentsData.map((row) => (
                      <tr key={row.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-muted">
                          {row.tanggal_bayar}
                        </td>
                        <td className="px-6 py-4 font-geist font-bold text-white uppercase tracking-wide">
                          {row.members?.nama || "-"}
                        </td>
                        <td className="px-6 py-4 capitalize text-xs">
                          {row.members?.tipe_tarif || "-"}
                        </td>
                        <td className="px-6 py-4 uppercase font-bold text-white font-mono text-xs">
                          {row.metode}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-muted">
                          s/d {row.periode_berlaku_sampai}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-white">
                          Rp {Number(row.jumlah || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
