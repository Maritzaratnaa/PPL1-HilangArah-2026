import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ShieldMinus,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/Admin/AdminSideBar";

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

type ToastType = "success" | "error";

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200"
          : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
      )}
      {message}
    </div>
  );
}

function AddAdminModal({
  loading,
  onConfirm,
  onCancel,
}: {
  loading: boolean;
  onConfirm: (userId: string) => void;
  onCancel: () => void;
}) {
  const [userId, setUserId] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={!loading ? onCancel : undefined} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">Tambah Admin Baru</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Masukkan ID User pengguna yang ingin dijadikan Admin.
        </p>
        <Input
          placeholder="Contoh: 12 atau user-uuid"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="mb-6"
        />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button
            className="flex-1"
            onClick={() => onConfirm(userId)}
            disabled={loading || !userId.trim()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            {loading ? "Memproses..." : "Jadikan Admin"}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={!loading ? onCancel : undefined} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">Cabut Akses Admin</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Apakah kamu yakin ingin mencabut akses admin dari{" "}
          <strong>{admin.username}</strong>? Akun ini akan kembali menjadi Pengguna biasa.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
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
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [statsTotal, setStatsTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);

  const [removeTarget, setRemoveTarget] = useState<Admin | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // GET Admins (Sesuai dengan getAllAdmins)
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      // PERUBAHAN: dari /admins menjadi /admin/manage
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
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // POST Assign Admin (Sesuai dengan assignAdminRole)
  const handleAssignAdmin = async (target_user_id: string) => {
    setActionLoading("add");
    try {
      // PERUBAHAN: dari /admins/assign menjadi /admin/manage/assign
      const res = await fetch(`${API_BASE}/admin/manage/assign`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ target_user_id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menjadikan admin.");

      showToast(`Berhasil! ${json.data.username} sekarang adalah Admin.`, "success");
      setShowAddModal(false);
      fetchAdmins(); 
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan server.";
      showToast(message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // PUT Update Admin Status (Sesuai dengan updateAdmin)
  const toggleAdminStatus = async (admin: Admin) => {
    setActionLoading(admin.user_id);
    try {
      const newStatus = admin.is_active ? "0" : "1"; 
      
      // PERUBAHAN: dari /admins/${admin.user_id} menjadi /admin/manage/${admin.user_id}
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

      showToast(`Status admin ${admin.username} berhasil diubah.`, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      showToast(message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // DELETE Remove Admin Role (Sesuai dengan removeAdminAccess)
  const removeAdminAccess = async () => {
    if (!removeTarget) return;
    setActionLoading(removeTarget.user_id);
    try {
      // PERUBAHAN: dari /admins/${removeTarget.user_id} menjadi /admin/manage/${removeTarget.user_id}
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

      showToast(`Akses admin ${removeTarget.username} berhasil dicabut.`, "success");
      setRemoveTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      showToast(message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.username.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      admin.email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Manajemen Admin</h1>
              <p className="text-muted-foreground text-sm">Kelola akses dan hak prerogatif Admin Utama.</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Tambah Admin
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Admin", val: statsTotal, color: "text-primary" },
              { label: "Admin Aktif", val: admins.filter((a) => a.is_active).length, color: "text-emerald-600" },
              { label: "Admin Nonaktif", val: admins.filter((a) => !a.is_active).length, color: "text-rose-600" },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-5">
                <div className={`text-3xl font-bold ${s.color} mb-1`}>
                  {loading ? <span className="inline-block h-9 w-12 bg-muted animate-pulse rounded-md" /> : s.val}
                </div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari admin berdasarkan username atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 max-w-md"
            />
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Info Admin", "Role", "Status", "Aksi"].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
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
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">
                      Tidak ada admin yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => {
                    const isActioning = actionLoading === admin.user_id;
                    return (
                      <tr key={admin.user_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                              {admin.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{admin.username}</div>
                              <div className="text-xs text-muted-foreground">{admin.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 px-2.5 py-1 rounded-full font-semibold flex items-center w-fit gap-1">
                            <UserCog className="h-3 w-3" />
                            {admin.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              admin.is_active
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                            }`}
                          >
                            {admin.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
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
                              className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}