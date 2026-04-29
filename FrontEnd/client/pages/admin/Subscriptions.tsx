import { useState, useEffect } from "react";
import { Search, X, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/Admin/AdminSideBar";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Sub {
  subs_id: string;
  status: string;
  start_date: string;
  end_date: string;
  domicile: string;
  customer_name: string;
  email: string;
  guide_name: string | null;
  // dari getSubscriptionDetail
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
  const [deleting, setDeleting] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assigningGuide, setAssigningGuide] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        alert('Pemandu berhasil ditugaskan.');
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
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const d = detail || sub;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
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
            {/* Status badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-sm font-semibold">Status Subscription</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusConfig[d.status]?.color || ''}`}>
                {statusConfig[d.status]?.label || d.status}
              </span>
            </div>

            {/* User info */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Informasi Pengguna</div>
              {[
                { label: 'Nama', value: d.customer_name },
                { label: 'Email', value: d.email },
                { label: 'Kondisi Pengguna', value: d.customer_category || '-' },
                { label: 'Nomor Telepon', value: d.phone_number || '-' },
                { label: 'Domisili', value: d.domicile },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Emergency contact */}
            {(d.emergency_contact_name || d.emergency_contact_phone) && (
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Kontak Darurat</div>
                {[
                  { label: 'Nama', value: d.emergency_contact_name || '-' },
                  { label: 'Nomor Telepon', value: d.emergency_contact_phone || '-' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Guide info */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Informasi Pemandu</div>
              {[
                { label: 'Pemandu', value: d.guide_name || 'Belum ditugaskan' },
                { label: 'Telepon Pemandu', value: d.guide_phone || '-' },
                { label: 'Mulai', value: d.start_date || '-' },
                { label: 'Berakhir', value: d.end_date || '-' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Specific needs */}
            {d.specific_needs && (
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Kebutuhan Khusus</div>
                <p className="text-sm">{d.specific_needs}</p>
              </div>
            )}

            {/* Assign guide */}
            <div className="rounded-xl border border-border p-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Tugaskan Pemandu</div>
              <div className="flex gap-2">
                <Input value={assignEmployeeId} onChange={(e) => setAssignEmployeeId(e.target.value)}
                  placeholder="Masukkan Employee ID pemandu..."
                  className="h-9 text-xs" />
                <Button size="sm" className="h-9 text-xs" disabled={assigningGuide || !assignEmployeeId.trim()}
                  onClick={handleAssignGuide}>
                  {assigningGuide ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Tugaskan'}
                </Button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Status change */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Ubah Status</div>
          <div className="flex gap-2 flex-wrap">
            {['Active', 'Pending', 'Expired', 'Cancelled'].map((s) => (
              <Button key={s} size="sm"
                variant={d.status === s ? 'default' : 'outline'}
                className="flex-1 text-xs h-9"
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

        {/* Delete */}
        <Button variant="outline" className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
          disabled={deleting}
          onClick={async () => {
            if (!confirm(`Hapus subscription ${sub.subs_id}?`)) return;
            setDeleting(true);
            await onDelete(sub.subs_id);
            setDeleting(false);
            onClose();
          }}>
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Trash2 className="h-3.5 w-3.5 mr-2" />}
          Hapus Subscription
        </Button>
      </div>
    </div>
  );
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
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

  // Filter category di frontend
  const filtered = subs;

  const handleStatusChange = async (subsId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/admin/subscriptions/${subsId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (res.ok) {
        fetchSubs(filterStatus, search);
      } else {
        alert(json.message);
      }
    } catch {
      alert('Gagal mengubah status.');
    }
  };

  const handleDelete = async (subsId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/admin/subscriptions/${subsId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        fetchSubs(filterStatus, search);
      } else {
        alert(json.message);
      }
    } catch {
      alert('Gagal menghapus subscription.');
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

      <main className="flex-1 overflow-auto">
        <div className="p-8">

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Manajemen Subscription</h1>
            <p className="text-muted-foreground text-sm">Kelola subscription pengguna ARAHIN</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Subscription', val: stats.total, color: 'text-primary' },
              { label: 'Aktif', val: stats.active, color: 'text-emerald-600' },
              { label: 'Pending', val: stats.pending, color: 'text-amber-600' },
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
                placeholder="Cari berdasarkan nama..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                {['All', 'Active', 'Pending', 'Expired', 'Cancelled'].map((s) => (
                  <Button key={s} size="sm"
                    variant={filterStatus === s ? 'default' : 'outline'}
                    className="h-9 px-3 text-xs font-semibold"
                    onClick={() => handleFilterStatus(s)}>
                    {s === 'All' ? 'Semua Status' : statusConfig[s]?.label || s}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Pengguna</th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Pemandu</th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Periode</th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                      Tidak ada subscription yang ditemukan.
                    </td>
                  </tr>
                ) : filtered.map((sub) => (
                  <tr key={sub.subs_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                          {sub.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{sub.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{sub.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {sub.guide_name || <span className="text-muted-foreground italic text-xs">Belum ditugaskan</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                      <div className="flex flex-col">
                        <span>{new Date(sub.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        <span className="text-[10px] text-muted-foreground/60">sampai</span>
                        <span className="text-foreground">{new Date(sub.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusConfig[sub.status]?.color || ''}`}>
                        {statusConfig[sub.status]?.label || sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="outline" className="h-8 text-xs"
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