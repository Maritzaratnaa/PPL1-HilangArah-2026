import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
  Users,
  UserCheck,
  Zap,
  FileText,
  BarChart3,
  Bus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from '@/components/Admin/AdminSideBar';

const dummySubs = [
  {
    subs_id: "SUB001",
    user_id: "1",
    employee_id: "EMP001",
    full_name: "Budi Santoso",
    category_status: "Penyandang Disabilitas",
    phone_number: "+62 812 3456 7890",
    emergency_contact_name: "Siti Santoso",
    emergency_contact_phone: "+62 812 9999 8888",
    domicile: "Jakarta Selatan",
    specific_needs:
      "Membutuhkan kursi roda dan pemandu yang berpengalaman dengan penyandang disabilitas fisik.",
    status: "Active",
    start_date: "2026-03-01",
    end_date: "2026-03-31",
    guide_name: "Andi Prasetyo",
  },
  {
    subs_id: "SUB002",
    user_id: "2",
    employee_id: "EMP002",
    full_name: "Siti Rahma",
    category_status: "Lansia",
    phone_number: "+62 813 2345 6789",
    emergency_contact_name: "Ahmad Rahma",
    emergency_contact_phone: "+62 813 7777 6666",
    domicile: "Jakarta Barat",
    specific_needs:
      "Membutuhkan pemandu yang sabar dan memahami kebutuhan lansia.",
    status: "Active",
    start_date: "2026-03-05",
    end_date: "2026-04-05",
    guide_name: "Sari Dewi",
  },
  {
    subs_id: "SUB003",
    user_id: "4",
    employee_id: "EMP003",
    full_name: "Ahmad Rizal",
    category_status: "Situasi Rentan",
    phone_number: "+62 815 4567 8901",
    emergency_contact_name: "Dewi Rizal",
    emergency_contact_phone: "+62 815 5555 4444",
    domicile: "Jakarta Timur",
    specific_needs:
      "Membutuhkan pendampingan ekstra saat menggunakan transportasi umum.",
    status: "Pending",
    start_date: "2026-03-12",
    end_date: "2026-04-12",
    guide_name: "Budi Hartono",
  },
  {
    subs_id: "SUB004",
    user_id: "5",
    employee_id: "EMP004",
    full_name: "Rinta Sari",
    category_status: "Anak-Anak",
    phone_number: "+62 816 5678 9012",
    emergency_contact_name: "Ibu Rinta",
    emergency_contact_phone: "+62 816 3333 2222",
    domicile: "Jakarta Utara",
    specific_needs: "Anak usia 10 tahun, membutuhkan pemandu yang ramah anak.",
    status: "Expired",
    start_date: "2026-02-01",
    end_date: "2026-03-01",
    guide_name: "Rina Kusuma",
  },
];

type Sub = (typeof dummySubs)[0];

const statusConfig: Record<string, { label: string; color: string }> = {
  Active: {
    label: "Aktif",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  Pending: {
    label: "Pending",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  },
  Expired: {
    label: "Expired",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
  },
};

function DetailModal({
  sub,
  onClose,
  onStatusChange,
}: {
  sub: Sub;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Detail Subscription</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Status badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <span className="text-sm font-semibold">Status Subscription</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusConfig[sub.status].color}`}
            >
              {statusConfig[sub.status].label}
            </span>
          </div>

          {/* User info */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Informasi Pengguna
            </div>
            {[
              { label: "Nama", value: sub.full_name },
              { label: "Kondisi Pengguna", value: sub.category_status },
              { label: "Nomor Telepon", value: sub.phone_number },
              { label: "Domisili", value: sub.domicile },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Emergency contact */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Kontak Darurat
            </div>
            {[
              { label: "Nama", value: sub.emergency_contact_name },
              { label: "Nomor Telepon", value: sub.emergency_contact_phone },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Guide info */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Informasi Pemandu
            </div>
            {[
              { label: "Pemandu", value: sub.guide_name },
              { label: "Mulai", value: sub.start_date },
              { label: "Berakhir", value: sub.end_date },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Specific needs */}
          <div className="rounded-xl border border-border p-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Kebutuhan Khusus
            </div>
            <p className="text-sm">{sub.specific_needs}</p>
          </div>
        </div>

        {/* Status change buttons */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Ubah Status
          </div>
          <div className="flex gap-2">
            {["Active", "Pending", "Expired"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={sub.status === s ? "default" : "outline"}
                className="flex-1 text-xs h-9"
                onClick={() => {
                  onStatusChange(sub.subs_id, s);
                  onClose();
                }}
              >
                {statusConfig[s].label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState(dummySubs);
  const [search, setSearch] = useState("");
  const [detailTarget, setDetailTarget] = useState<Sub | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const allCategories = [
    "All",
    "Penyandang Disabilitas",
    "Lansia",
    "Situasi Rentan",
    "Anak-Anak",
  ];

  const filtered = subs.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.subs_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || s.status === filterStatus;
    const matchCategory =
      filterCategory === "All" || s.category_status === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const handleStatusChange = (subsId: string, status: string) => {
    setSubs((prev) =>
      prev.map((s) => (s.subs_id === subsId ? { ...s, status } : s)),
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Manajemen Subscription</h1>
            <p className="text-muted-foreground text-sm">
              Kelola subscription pengguna ARAHIN
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              {
                label: "Total Subscription",
                val: subs.length,
                color: "text-primary",
              },
              {
                label: "Aktif",
                val: subs.filter((s) => s.status === "Active").length,
                color: "text-emerald-600",
              },
              {
                label: "Pending",
                val: subs.filter((s) => s.status === "Pending").length,
                color: "text-amber-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-card rounded-xl border border-border p-5"
              >
                <div className={`text-3xl font-bold ${s.color} mb-1`}>
                  {s.val}
                </div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau ID subscription..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Filter Status */}
              <div className="flex gap-2">
                {["All", "Active", "Pending", "Expired"].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={filterStatus === s ? "default" : "outline"}
                    className="h-9 px-3 text-xs font-semibold"
                    onClick={() => setFilterStatus(s)}
                  >
                    {s === "All" ? "Semua Status" : s}
                  </Button>
                ))}
              </div>
              {/* Filter Kondisi */}
              <div className="flex flex-wrap gap-2">
                {allCategories.map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={filterCategory === c ? "default" : "outline"}
                    className="h-9 px-3 text-xs font-semibold"
                    onClick={() => setFilterCategory(c)}
                  >
                    {c === "All" ? "Semua Kondisi" : c}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Pengguna
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Kondisi
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Pemandu
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Periode
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((sub) => (
                  <tr
                    key={sub.subs_id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                          {sub.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {sub.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {sub.phone_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 px-2.5 py-1 rounded-full font-semibold">
                        {sub.category_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{sub.guide_name}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <div>{sub.start_date}</div>
                      <div>→ {sub.end_date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusConfig[sub.status].color}`}
                      >
                        {statusConfig[sub.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setDetailTarget(sub)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted-foreground text-sm"
                    >
                      Tidak ada subscription yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {detailTarget && (
        <DetailModal
          sub={detailTarget}
          onClose={() => setDetailTarget(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
