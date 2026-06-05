import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ShieldMinus,
  ShieldCheck,
  Loader2,
  AlertCircle,
  PlusCircle,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/Admin/AdminSideBar";
import { useNavigate } from "react-router-dom";
import { Pagination } from '@/components/Admin/Pagination';
import { toast } from "sonner";

interface Admin {
  user_id: string | number;
  username: string;
  email: string;
  role: string;
  is_active: number | boolean; 
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const customToastStyle = {
  className: "!bg-primary !text-primary-foreground border-none font-medium !text-[16px] !p-4",
};

function AddAdminModal({
  loading,
  onConfirm,
  onCancel,
}: {
  loading: boolean;
  onConfirm: (email: string, password: string) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("admin123");

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const isFormValid = isEmailValid && isPasswordValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!loading ? onCancel : undefined} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-2">Tambah Admin Baru</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Masukkan Email dan Password untuk membuat Admin baru.
        </p>
        
        <div className="flex flex-col gap-3 mb-6">
          <div>
            <label className="text-xs font-medium mb-1 block">Email</label>
            <Input
              type="email"
              placeholder="Contoh: admin@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={!isEmailValid && email.length > 0 ? "border-rose-500 focus-visible:ring-rose-500" : ""}
            />
            {!isEmailValid && email.length > 0 && (
              <p className="text-[10px] text-rose-500 mt-1">
                Format email tidak valid (harus mengandung @ dan domain).
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Password</label>
            <Input
              type="text"
              placeholder="Password default"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={!isPasswordValid && password.length > 0 ? "border-rose-500 focus-visible:ring-rose-500" : ""}
            />
            {!isPasswordValid && password.length > 0 && (
              <p className="text-[10px] text-rose-500 mt-1">
                Password minimal 6 karakter.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1 order-2 sm:order-1" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button
            className="flex-1 order-1 sm:order-2"
            onClick={() => onConfirm(email, password)}
            disabled={loading || !isFormValid}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            {loading ? "Memproses..." : "Tambah Admin"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RemoveAdminModal({
  admin,
  loading,
  onConfirm,
  onCancel,
}: {
  admin: Admin;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!loading ? onCancel : undefined} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-2">Cabut Akses Admin</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Apakah kamu yakin ingin mencabut akses admin dari{" "}
          <strong className="break-all">{admin.username}</strong>? Akun ini akan kembali menjadi Pengguna biasa.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1 order-2 sm:order-1" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white order-1 sm:order-2"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {loading ? "Memproses..." : "Cabut Akses"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [statsTotal, setStatsTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);

  const [removeTarget, setRemoveTarget] = useState<Admin | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email !== "arahin.support@gmail.com") {
      navigate("/admin/reports");
    }
  }, [navigate]);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/manage`, { headers: getAuthHeaders() });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengambil data admin.");
      }

      const json = await res.json();
      setStatsTotal(json.total_admins);
      setAdmins(json.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat load data.";
      toast.error(message, customToastStyle);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAssignAdmin = async (email: string, password: string) => {
    setActionLoading("add");
    try {
      const res = await fetch(`${API_BASE}/admin/manage/assign`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menambahkan admin.");

      const adminName = json.data?.username || email;
      toast.success(`Berhasil! ${adminName} sekarang adalah Admin.`, customToastStyle);
      
      setShowAddModal(false);
      fetchAdmins(); 
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan server.";
      toast.error(message, customToastStyle);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAdminStatus = async (admin: Admin) => {
    setActionLoading(admin.user_id);
    try {
      const newStatus = admin.is_active ? "0" : "1"; 
      
      const res = await fetch(`${API_BASE}/admin/manage/${admin.user_id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ username: admin.username, status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengubah status admin.");
      }

      setAdmins((prev) =>
        prev.map((a) => (a.user_id === admin.user_id ? { ...a, is_active: newStatus === "1" ? 1 : 0 } : a))
      );

      toast.success(`Status admin ${admin.username} berhasil diubah.`, customToastStyle);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(message, customToastStyle);
    } finally {
      setActionLoading(null);
    }
  };

  const removeAdminAccess = async () => {
    if (!removeTarget) return;
    setActionLoading(removeTarget.user_id);
    try {
      const res = await fetch(`${API_BASE}/admin/manage/${removeTarget.user_id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mencabut akses admin.");
      }

      setAdmins((prev) => prev.filter((a) => a.user_id !== removeTarget.user_id));
      setStatsTotal((prev) => prev - 1);

      toast.success(`Akses admin ${removeTarget.username} berhasil dicabut.`, customToastStyle);
      setRemoveTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(message, customToastStyle);
    } finally {
      setActionLoading(null);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.username.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      admin.email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 sm:p-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Manajemen Admin</h1>
              <p className="text-muted-foreground text-sm">Kelola akses dan hak prerogatif Admin Utama.</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Admin</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Admin", val: statsTotal, color: "text-primary" },
              { label: "Admin Aktif", val: admins.filter((a) => a.is_active).length, color: "text-emerald-600" },
              { label: "Admin Nonaktif", val: admins.filter((a) => !a.is_active).length, color: "text-rose-600" },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <div className={`text-2xl sm:text-3xl font-bold ${s.color} mb-1 truncate`}>
                  {loading ? <span className="inline-block h-9 w-12 bg-muted animate-pulse rounded-md" /> : s.val}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 w-full max-w-md"
            />
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full scrollbar-thin">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Info Admin", "Role", "Status", "Aksi"].map((h) => (
                      <th key={h} className="text-left text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-muted animate-pulse rounded-md w-3/4" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginatedAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">
                        Tidak ada admin yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedAdmins.map((admin) => {
                      const isActioning = actionLoading === admin.user_id;
                      return (
                        <tr key={admin.user_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                                {admin.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate max-w-[150px]">{admin.username}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">{admin.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 px-2.5 py-1 rounded-full font-semibold flex items-center w-fit gap-1">
                              <UserCog className="h-3 w-3" />
                              {admin.role}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                                admin.is_active
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                              }`}
                            >
                              {admin.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px]"
                                onClick={() => toggleAdminStatus(admin)}
                                disabled={isActioning}
                              >
                                {isActioning ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  "Ubah Status"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] text-rose-600 border-rose-200 hover:bg-rose-50"
                                onClick={() => setRemoveTarget(admin)}
                                disabled={isActioning}
                              >
                                <ShieldMinus className="h-3.5 w-3.5 mr-1" />
                                Cabut Akses
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredAdmins.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>

      {showAddModal && (
        <AddAdminModal
          loading={actionLoading === "add"}
          onConfirm={handleAssignAdmin}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {removeTarget && (
        <RemoveAdminModal
          admin={removeTarget}
          loading={actionLoading === removeTarget.user_id}
          onConfirm={removeAdminAccess}
          onCancel={() => {
            if (actionLoading !== removeTarget.user_id) setRemoveTarget(null);
          }}
        />
      )}
    </div>
  );
}