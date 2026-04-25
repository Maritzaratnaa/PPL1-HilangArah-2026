import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, X, Users, UserCheck, Zap, FileText, BarChart3, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminSidebar } from '@/components/Admin/AdminSideBar';

const dummyReports = [
  {
    report_id: 'RPT001',
    reporter_name: 'Budi Santoso',
    category: 'Fasilitas',
    stop_name: 'Halte Sudirman',
    description: 'Lift di halte ini sudah tidak berfungsi sejak 3 hari yang lalu. Sangat menyulitkan pengguna kursi roda.',
    status: 'Pending',
    created_at: '2026-03-20 08:30',
    resolved_by: null,
  },
  {
    report_id: 'RPT002',
    reporter_name: 'Siti Rahma',
    category: 'Fasilitas',
    stop_name: 'Halte Blok M',
    description: 'Ramp untuk kursi roda rusak dan berbahaya untuk digunakan.',
    status: 'Processed',
    created_at: '2026-03-19 14:20',
    resolved_by: 'Admin',
  },
  {
    report_id: 'RPT003',
    reporter_name: 'Ahmad Rizal',
    category: 'Pemandu',
    stop_name: null,
    description: 'Pemandu tidak datang tepat waktu dan tidak responsif saat dihubungi.',
    status: 'Resolved',
    created_at: '2026-03-18 10:00',
    resolved_by: 'Admin',
  },
  {
    report_id: 'RPT004',
    reporter_name: 'Rinta Sari',
    category: 'Fasilitas',
    stop_name: 'Stasiun Manggarai',
    description: 'Guiding block di stasiun ini banyak yang rusak dan terhalang oleh pedagang.',
    status: 'Pending',
    created_at: '2026-03-21 09:15',
    resolved_by: null,
  },
  {
    report_id: 'RPT005',
    reporter_name: 'Dewi Ayu',
    category: 'Pemandu',
    stop_name: null,
    description: 'Pemandu bersikap tidak sopan dan tidak sabar saat mendampingi.',
    status: 'Processed',
    created_at: '2026-03-17 16:45',
    resolved_by: 'Admin',
  },
];

type Report = typeof dummyReports[0];

const statusConfig: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' },
  Processed: { label: 'Diproses', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' },
  Resolved: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' },
};

const categoryConfig: Record<string, string> = {
  Fasilitas: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300',
  Pemandu: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300',
};

function DetailModal({ report, onClose, onStatusChange }: {
  report: Report;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Detail Laporan</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Status + kategori */}
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusConfig[report.status].color}`}>
              {statusConfig[report.status].label}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${categoryConfig[report.category]}`}>
              {report.category}
            </span>
          </div>

          {/* Info */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Informasi Laporan</div>
            {[
              { label: 'ID Laporan', value: report.report_id },
              { label: 'Pelapor', value: report.reporter_name },
              { label: 'Kategori', value: report.category },
              { label: 'Lokasi', value: report.stop_name || '-' },
              { label: 'Tanggal', value: report.created_at },
              { label: 'Diselesaikan oleh', value: report.resolved_by || '-' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Deskripsi */}
          <div className="rounded-xl border border-border p-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Deskripsi Laporan</div>
            <p className="text-sm leading-relaxed">{report.description}</p>
          </div>
        </div>

        {/* Status change */}
        <div className="mb-4">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tandai Sebagai</div>
          <div className="flex gap-2">
            {['Pending', 'Processed', 'Resolved'].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={report.status === s ? 'default' : 'outline'}
                className="flex-1 text-xs h-9"
                onClick={() => {
                  onStatusChange(report.report_id, s);
                  onClose();
                }}>
                {statusConfig[s].label}
              </Button>
            ))}
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button>
      </div>
    </div>
  );
}

function DeleteModal({ report, onConfirm, onCancel }: {
  report: Report;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">Hapus Laporan</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Apakah kamu yakin ingin menghapus laporan dari <strong>{report.reporter_name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Batal</Button>
          <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={onConfirm}>Hapus</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [reports, setReports] = useState(dummyReports);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [detailTarget, setDetailTarget] = useState<Report | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);

  const filtered = reports.filter(r => {
    const matchSearch =
      r.reporter_name.toLowerCase().includes(search.toLowerCase()) ||
      r.report_id.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchCategory = filterCategory === 'All' || r.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const handleStatusChange = (reportId: string, status: string) => {
    setReports(prev => prev.map(r => r.report_id === reportId ? { ...r, status } : r));
  };

  const handleDelete = (reportId: string) => {
    setReports(prev => prev.filter(r => r.report_id !== reportId));
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Manajemen Laporan</h1>
            <p className="text-muted-foreground text-sm">Kelola laporan dari pengguna ARAHIN</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Laporan', val: reports.length, color: 'text-primary' },
              { label: 'Pending', val: reports.filter(r => r.status === 'Pending').length, color: 'text-amber-600' },
              { label: 'Selesai', val: reports.filter(r => r.status === 'Resolved').length, color: 'text-emerald-600' },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-5">
                <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.val}</div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama pelapor, ID, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-2">
                {['All', 'Pending', 'Processed', 'Resolved'].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={filterStatus === s ? 'default' : 'outline'}
                    className="h-9 px-3 text-xs font-semibold"
                    onClick={() => setFilterStatus(s)}>
                    {s === 'All' ? 'Semua Status' : statusConfig[s].label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                {['All', 'Fasilitas', 'Pemandu'].map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={filterCategory === c ? 'default' : 'outline'}
                    className="h-9 px-3 text-xs font-semibold"
                    onClick={() => setFilterCategory(c)}>
                    {c === 'All' ? 'Semua Kategori' : c}
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
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Pelapor</th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Kategori</th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Lokasi</th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Deskripsi</th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Tanggal</th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((report) => (
                  <tr key={report.report_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                          {report.reporter_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-sm font-semibold">{report.reporter_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${categoryConfig[report.category]}`}>
                        {report.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{report.stop_name || '-'}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">{report.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusConfig[report.status].color}`}>
                        {statusConfig[report.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{report.created_at}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setDetailTarget(report)}>
                          Detail
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => setDeleteTarget(report)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-sm">
                      Tidak ada laporan yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>

      {/* Modals */}
      {detailTarget && (
        <DetailModal
          report={detailTarget}
          onClose={() => setDetailTarget(null)}
          onStatusChange={handleStatusChange}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          report={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.report_id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

    </div>
  );
}