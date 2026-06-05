import { useState, useEffect } from "react";
import { Search, X, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/Admin/AdminSideBar";
import { Pagination } from '@/components/Admin/Pagination';
import { toast } from "sonner";
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Sub {
  subs_id: string;
  status: string;
  start_date: string;
  end_date: string;
  domicile: string;
  customer_name: string;
  email: string;
  guide_name: string | null;
  phone_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  specific_needs?: string;
  customer_category?: string;
  guide_phone?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  Active: { label: "Aktif", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" },
  Pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" },
  Expired: { label: "Expired", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300" },
  Cancelled: { label: "Dibatalkan", color: "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-300" },
};

// --- KUSTOMISASI GAYA TOAST SAMA DENGAN BUTTON & FONT DIPERBESAR ---
const customToastStyle = {
  className: "!bg-primary !text-primary-foreground border-none font-medium !text-[16px] !p-4",
};

// --- MODAL KONFIRMASI HAPUS BARU ---
function DeleteModal({ sub, onConfirm, onCancel, deleting }: {
  sub: Sub;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!deleting ? onCancel : undefined} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold mb-2">Hapus Subscription</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Apakah kamu yakin ingin menghapus subscription atas nama <strong>{sub.customer_name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1 order-2 sm:order-1" onClick={onCancel} disabled={deleting}>Batal</Button>
          <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white order-1 sm:order-2" onClick={onConfirm} disabled={deleting}>
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {deleting ? "Menghapus..." : "Hapus"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ sub, onClose, onStatusChange, onDelete, onSuccess }: {
  sub: Sub;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSuccess: () => void;
}) {
  const [detail, setDetail] = useState<Sub | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // State untuk modal hapus
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assigningGuide, setAssigningGuide] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  interface GuideOption {
  employee_id: string;
  full_name: string;
  domicile: string;
}

const [availableGuides, setAvailableGuides] = useState<GuideOption[]>([]);
const [loadingGuides, setLoadingGuides] = useState(false);

useEffect(() => {
  const fetchAvailableGuides = async () => {
    setLoadingGuides(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/admin/guides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        const available = (json.data?.list || []).filter(
          (g: any) => g.is_available === true || g.is_available === 1
        );
        setAvailableGuides(available);
      }
    } catch {
      console.error('Gagal fetch pemandu');
    } finally {
      setLoadingGuides(false);
    }
  };
  fetchAvailableGuides();
}, []);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_URL}/api/admin/subscriptions/${sub.subs_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) setDetail(json.data);
        else setErrorMsg(json.message);
      } catch {
        setErrorMsg('Gagal memuat detail.');
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [sub.subs_id]);

  const handleAssignGuide = async () => {
    if (!assignEmployeeId.trim()) return;
    setAssigningGuide(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/admin/subscriptions/${sub.subs_id}/assign-guide`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employee_id: assignEmployeeId }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Pemandu berhasil ditugaskan.", customToastStyle);
        onSuccess();
        onClose();
      } else {
        setErrorMsg(json.message);
      }
    } catch {
      setErrorMsg('Gagal menugaskan pemandu.');
    } finally {
      setAssigningGuide(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    await onDelete(sub.subs_id);
    setDeleting(false);
    setShowDeleteModal(false);
    onClose();
  };

  const d = detail || sub;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold">Detail Subscription</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-muted/50 gap-2">
                <span className="text-sm font-semibold">Status Subscription</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusConfig[d.status]?.color || ''}`}>
                  {statusConfig[d.status]?.label || d.status}
                </span>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Informasi Pengguna</div>
                {[
                  { label: 'Nama', value: d.customer_name },
                  { label: 'Email', value: d.email },
                  { label: 'Kondisi Pengguna', value: d.customer_category || '-' },
                  { label: 'Nomor Telepon', value: d.phone_number || '-' },
                  { label: 'Domisili', value: d.domicile },
                ].map((item) => (
                  <div key={item.label} className="flex flex-wrap justify-between text-sm gap-2 border-b border-border/50 pb-1 last:border-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-right break-all">{item.value}</span>
                  </div>
                ))}
              </div>

              {(d.emergency_contact_name || d.emergency_contact_phone) && (
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Kontak Darurat</div>
                  {[
                    { label: 'Nama', value: d.emergency_contact_name || '-' },
                    { label: 'Nomor Telepon', value: d.emergency_contact_phone || '-' },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-wrap justify-between text-sm gap-2 border-b border-border/50 pb-1 last:border-0">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-right break-all">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Informasi Pemandu</div>
                {[
                  { label: 'Pemandu', value: d.guide_name || 'Belum ditugaskan' },
                  { label: 'Telepon Pemandu', value: d.guide_phone || '-' },
                  { label: 'Mulai', value: d.start_date || '-' },
                  { label: 'Berakhir', value: d.end_date || '-' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-wrap justify-between text-sm gap-2 border-b border-border/50 pb-1 last:border-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-right break-all">{item.value}</span>
                  </div>
                ))}
              </div>

              {d.specific_needs && (
                <div className="rounded-xl border border-border p-4">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Kebutuhan Khusus</div>
                  <p className="text-sm bg-muted/20 p-2 rounded-md whitespace-pre-wrap">{d.specific_needs}</p>
                </div>
              )}

              <div className="rounded-xl border border-border p-4 bg-muted/10">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Tugaskan Pemandu
                </div>
                {loadingGuides ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat daftar pemandu...
                  </div>
                ) : availableGuides.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Tidak ada pemandu yang tersedia saat ini.</p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <SearchableDropdown
                      options={availableGuides.map(g => ({
                        value: g.employee_id,
                        label: g.full_name,
                        detail: `ID: ${g.employee_id} · ${g.domicile || ''}`,
                      }))}
                      value={assignEmployeeId}
                      onChange={setAssignEmployeeId}
                      placeholder="Pilih pemandu tersedia..."
                      searchPlaceholder="Cari nama atau ID pemandu..."
                      className="flex-1"
                      triggerClassName="h-9 text-xs"
                      dropdownClassName="text-xs"
                    />
                    <Button
                      size="sm"
                      className="h-9 text-xs sm:w-24 flex-shrink-0"
                      disabled={assigningGuide || !assignEmployeeId.trim()}
                      onClick={handleAssignGuide}>
                      {assigningGuide ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Tugaskan'}
                    </Button>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                  {errorMsg}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 mb-4">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Ubah Status</div>
            <div className="grid grid-cols-2 gap-2">
              {['Active', 'Pending', 'Expired', 'Cancelled'].map((s) => (
                <Button key={s} size="sm"
                  variant={d.status === s ? 'default' : 'outline'}
                  className="text-[10px] h-8 px-1"
                  disabled={updatingStatus}
                  onClick={async () => {
                    setUpdatingStatus(true);
                    await onStatusChange(sub.subs_id, s);
                    setUpdatingStatus(false);
                    onClose();
                  }}>
                  {updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (statusConfig[s]?.label || s)}
                </Button>
              ))}
            </div>
          </div>

          <Button variant="outline" className="w-full text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50 h-9"
            onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Hapus Subscription
          </Button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal 
          sub={d} 
          onConfirm={handleConfirmDelete} 
          onCancel={() => setShowDeleteModal(false)}
          deleting={deleting}
        />
      )}
    </>
  );
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [detailTarget, setDetailTarget] = useState<Sub | null>(null);

  const fetchSubs = async (status?: string, searchQuery?: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (status && status !== 'All') params.append('status', status);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`${BASE_URL}/api/admin/subscriptions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setSubs(json.data);
      else setErrorMsg(json.message);
    } catch {
      setErrorMsg('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    fetchSubs(filterStatus, val);
  };

  const handleFilterStatus = (status: string) => {
    setFilterStatus(status);
    fetchSubs(status, search);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => { setCurrentPage(1); }, [search, filterStatus]);

  const paginatedSubs = subs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusChange = async (subsId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/admin/subscriptions/${subsId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Status berhasil diperbarui.", customToastStyle);
        fetchSubs(filterStatus, search);
      } else {
        const json = await res.json();
        toast.error(json.message || "Gagal mengubah status.", customToastStyle);
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan saat mengubah status.', customToastStyle);
    }
  };

  const handleDelete = async (subsId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/admin/subscriptions/${subsId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Subscription berhasil dihapus.", customToastStyle);
        fetchSubs(filterStatus, search);
      } else {
        const json = await res.json();
        toast.error(json.message || "Gagal menghapus subscription.", customToastStyle);
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan saat menghapus subscription.', customToastStyle);
    }
  };

  const stats = {
    total: subs.length,
    active: subs.filter(s => s.status === 'Active').length,
    pending: subs.filter(s => s.status === 'Pending').length,
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 md:p-8">

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Manajemen Subscription</h1>
            <p className="text-muted-foreground text-sm">Kelola subscription pengguna ARAHIN</p>
          </div>

          {/* Stats - Grid Adaptif */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Subscription', val: stats.total, color: 'text-primary' },
              { label: 'Aktif', val: stats.active, color: 'text-emerald-600' },
              { label: 'Pending', val: stats.pending, color: 'text-amber-600' },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <div className={`text-2xl md:text-3xl font-bold ${s.color} mb-1 truncate`}>{s.val}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-11 w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
              {['All', 'Active', 'Pending', 'Expired', 'Cancelled'].map((s) => (
                <Button key={s} size="sm"
                  variant={filterStatus === s ? 'default' : 'outline'}
                  className="h-9 px-3 text-xs font-semibold whitespace-nowrap"
                  onClick={() => handleFilterStatus(s)}>
                  {s === 'All' ? 'Semua Status' : statusConfig[s]?.label || s}
                </Button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Table Container dengan Horizontal Scroll */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full scrollbar-thin">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Pengguna", "Pemandu", "Periode", "Status", "Aksi"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                      </td>
                    </tr>
                  ) : paginatedSubs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                        Tidak ada subscription yang ditemukan.
                      </td>
                    </tr>
                  ) : paginatedSubs.map((sub) => (
                    <tr key={sub.subs_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                            {sub.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate max-w-[150px]">{sub.customer_name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">{sub.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <span className="truncate max-w-[150px] block">
                          {sub.guide_name || <span className="text-muted-foreground italic text-xs">Belum ditugaskan</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-medium whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{new Date(sub.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          <span className="text-[10px] text-muted-foreground/60">s/d</span>
                          <span className="text-foreground">{new Date(sub.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusConfig[sub.status]?.color || ''}`}>
                          {statusConfig[sub.status]?.label || sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] px-3"
                          onClick={() => setDetailTarget(sub)}>
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalItems={subs.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>

      {detailTarget && (
        <DetailModal
          sub={detailTarget}
          onClose={() => setDetailTarget(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onSuccess={() => fetchSubs(filterStatus, search)}
        />
      )}
    </div>
  );
}