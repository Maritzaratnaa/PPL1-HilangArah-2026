import { useState, useEffect, useRef } from 'react';
import { 
  Search, Trash2, X, ChevronDown, Check, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminSidebar } from '@/components/Admin/AdminSideBar';
import { Pagination } from '@/components/Admin/Pagination';
import { toast } from "sonner"; // Tambahkan import library toast di sini

export interface Report {
  report_id: string;
  reporter_name: string;
  category: string;
  stop_name: string | null;
  description: string;
  status: string;
  created_at: string;
  resolved_by: string | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' },
  Processed: { label: 'Diproses', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' },
  Resolved: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' },
};

const categoryConfig: Record<string, string> = {
  Fasilitas: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300',
  Pemandu: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300',
};

const getStatusInfo = (status: string) =>
  statusConfig[status] || { label: status || 'Unknown', color: 'bg-slate-100 text-slate-700' };

const getCategoryColor = (category: string) =>
  categoryConfig[category] || 'bg-slate-100 text-slate-700';

// --- KUSTOMISASI GAYA TOAST SAMA DENGAN BUTTON & FONT DIPERBESAR ---
const customToastStyle = {
  className: "!bg-primary !text-primary-foreground border-none font-medium !text-[16px] !p-4",
};

// ── DROPDOWN STATUS INLINE DI TABEL ──
function StatusDropdown({ report, onStatusChange }: {
  report: Report;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const statusInfo = getStatusInfo(report.status);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={updating}
        className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-semibold transition-opacity ${statusInfo.color} ${updating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}>
        {updating
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <span>{statusInfo.label}</span>
        }
        {!updating && <ChevronDown className={`h-2.5 w-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-36 bg-card border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            {['Pending', 'Processed', 'Resolved'].map((s) => (
              <button
                key={s}
                onClick={async () => {
                  setIsOpen(false);
                  setUpdating(true);
                  await onStatusChange(report.report_id, s);
                  setUpdating(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  report.status === s
                    ? 'bg-muted/80 font-semibold text-foreground'
                    : 'hover:bg-muted/50 text-muted-foreground'
                }`}>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[s].color}`}>
                  {statusConfig[s].label}
                </span>
                {report.status === s && <Check className="h-3 w-3 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DropdownFilter({ label, options, selectedValue, onSelect, displayMap }: {
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (val: string) => void;
  displayMap?: Record<string, any>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative flex-1 sm:flex-initial">
      <Button variant="outline" className="h-11 w-full flex items-center justify-between gap-2 px-4 bg-card"
        onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-muted-foreground font-normal whitespace-nowrap">{label}:</span>
          <span className="font-semibold text-foreground truncate">
            {selectedValue === 'All' ? 'Semua' : (displayMap && displayMap[selectedValue] ? displayMap[selectedValue].label : selectedValue)}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 opacity-50 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
            {options.map((opt) => (
              <button key={opt} onClick={() => { onSelect(opt); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  selectedValue === opt ? 'bg-muted/80 font-semibold text-foreground' : 'hover:bg-muted/50 text-muted-foreground'
                }`}>
                <span>{opt === 'All' ? 'Semua' : (displayMap && displayMap[opt] ? displayMap[opt].label : opt)}</span>
                {selectedValue === opt && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DetailModal({ report, onClose, onStatusChange }: {
  report: Report;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const statusInfo = getStatusInfo(report.status);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-card z-10 border-b border-border rounded-t-2xl">
          <h3 className="text-lg font-bold">Detail Laporan</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-center gap-2 mt-4 mb-4">
            <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
            <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold ${getCategoryColor(report.category)}`}>{report.category || 'Lainnya'}</span>
          </div>
          <div className="rounded-xl border border-border p-4 space-y-3 mb-4">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Informasi Laporan</div>
            {[
              { label: 'ID Laporan', value: report.report_id },
              { label: 'Pelapor', value: report.reporter_name || 'Anonim' },
              { label: 'Kategori', value: report.category || '-' },
              { label: 'Lokasi', value: report.stop_name || '-' },
              { label: 'Tanggal', value: report.created_at || '-' },
              { label: 'Diselesaikan oleh', value: report.resolved_by || '-' },
            ].map((item) => (
              <div key={item.label} className="flex flex-wrap justify-between gap-2 text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-right break-all">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border p-4 mb-4">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Deskripsi Laporan</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.description || '-'}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button>
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold mb-2">Hapus Laporan</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Apakah kamu yakin ingin menghapus laporan dari <strong>{report.reporter_name || 'pengguna ini'}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1 order-2 sm:order-1" onClick={onCancel}>Batal</Button>
          <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white order-1 sm:order-2" onClick={onConfirm}>Hapus</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [detailTarget, setDetailTarget] = useState<Report | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);

  // --- API SETTINGS ---
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";

  // ── INTEGRASI SAMA PERSIS DENGAN KODE ASLI ──
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/admin/reports/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok) setReports(result.data || []);
      } catch (error) {
        console.error("Gagal mengambil data laporan: ", error);
        toast.error("Gagal mengambil data laporan.", customToastStyle);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [apiUrl]);

  const handleStatusChange = async (reportId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/admin/reports/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ report_id: reportId, status: status })
      });
      if (response.ok) {
        setReports(prev => prev.map(r => r.report_id === reportId ? { ...r, status } : r));
        toast.success("Status laporan berhasil diperbarui.", customToastStyle);
      } else {
        toast.error("Gagal mengubah status di server.", customToastStyle);
      }
    } catch (error) {
      console.error("Error update status:", error);
      toast.error("Terjadi kesalahan jaringan.", customToastStyle);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setReports(prev => prev.filter(r => r.report_id !== reportId));
        setDeleteTarget(null);
        toast.success("Laporan berhasil dihapus.", customToastStyle);
      } else {
        toast.error("Gagal menghapus laporan di server.", customToastStyle);
      }
    } catch (error) {
      console.error("Error delete report: ", error);
      toast.error("Terjadi kesalahan jaringan.", customToastStyle);
    }
  };
  // ── END INTEGRASI ──

  const filtered = reports.filter(r => {
    const reporterName = r.reporter_name || '';
    const reportId = r.report_id || '';
    const description = r.description || '';
    const matchSearch =
      reporterName.toLowerCase().includes(search.toLowerCase()) ||
      reportId.toLowerCase().includes(search.toLowerCase()) ||
      description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchCategory = filterCategory === 'All' || r.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  useEffect(() => { setCurrentPage(1); }, [search, filterStatus, filterCategory]);
  const paginatedReports = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Manajemen Laporan</h1>
            <p className="text-muted-foreground text-sm">Kelola laporan dari pengguna ARAHIN</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Laporan', val: reports.length, color: 'text-primary' },
              { label: 'Pending', val: reports.filter(r => r.status === 'Pending').length, color: 'text-amber-600' },
              { label: 'Selesai', val: reports.filter(r => r.status === 'Resolved').length, color: 'text-emerald-600' },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <div className={`text-2xl sm:text-3xl font-bold ${s.color} mb-1`}>{s.val}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari laporan..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 w-full" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <DropdownFilter label="Status" options={['All', 'Pending', 'Processed', 'Resolved']}
                selectedValue={filterStatus} onSelect={setFilterStatus} displayMap={statusConfig} />
              <DropdownFilter label="Kategori" options={['All', 'Fasilitas', 'Pemandu']}
                selectedValue={filterCategory} onSelect={setFilterCategory} />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full scrollbar-thin">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Pelapor", "Kategori", "Lokasi", "Deskripsi", "Status", "Tanggal", "Aksi"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    </td></tr>
                  ) : paginatedReports.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-sm">
                      Tidak ada laporan yang ditemukan.
                    </td></tr>
                  ) : paginatedReports.map((report) => {
                    const initials = (report.reporter_name || 'NN').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={report.report_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                              {initials}
                            </div>
                            <div className="text-sm font-semibold truncate max-w-[150px]">{report.reporter_name || 'Anonim'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${getCategoryColor(report.category)}`}>
                            {report.category || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{report.stop_name || '-'}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">{report.description}</p>
                        </td>

                        {/* STATUS DROPDOWN INLINE — mengganti badge statis */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusDropdown report={report} onStatusChange={handleStatusChange} />
                        </td>

                        <td className="px-6 py-4 text-[10px] text-muted-foreground whitespace-nowrap">{report.created_at}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-8 text-[10px] px-3"
                              onClick={() => setDetailTarget(report)}>Detail</Button>
                            <Button size="sm" variant="outline" className="h-8 px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => setDeleteTarget(report)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6">
            <Pagination currentPage={currentPage} totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
          </div>
        </div>
      </main>

      {detailTarget && (
        <DetailModal report={detailTarget} onClose={() => setDetailTarget(null)} onStatusChange={handleStatusChange} />
      )}
      {deleteTarget && (
        <DeleteModal report={deleteTarget} onConfirm={() => handleDelete(deleteTarget.report_id)} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}