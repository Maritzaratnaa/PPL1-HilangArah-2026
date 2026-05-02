import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Trash2,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/Admin/AdminSideBar";
import { Pagination } from '@/components/Admin/Pagination';

interface User {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  category_status: string;
  role: string;
  is_Active: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// 👇 PERBAIKAN 1: Menambahkan Mapper agar tabel menampilkan Bahasa Indonesia
const CATEGORY_MAP: Record<string, string> = {
  'general': 'General',
  'disability': 'Penyandang Disabilitas',
  'elderly': 'Lansia',
  'women': 'Perempuan',
  'pregnant': 'Hamil',
  'children': 'Anak-Anak',
  'vulnerable-illness': 'Situasi Rentan'
};

// 👇 PERBAIKAN 2: Mengubah value 'vulnerable' menjadi 'vulnerable-illness' sesuai database
const CATEGORIES: { label: string; value: string }[] = [
  { label: "Semua Kategori", value: "All" },
  { label: "Penyandang Disabilitas", value: "disability" },
  { label: "Lansia", value: "elderly" },
  { label: "Perempuan", value: "women" },
  { label: "Situasi Rentan", value: "vulnerable-illness" }, 
  { label: "Anak-Anak", value: "children" },
  { label: "Hamil", value: "pregnant" },
  { label: "General", value: "general" },
];

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type ToastType = "success" | "error";

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: ToastType;
  onClose: () => void;
}) {
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

function DeleteModal({
  user,
  loading,
  onConfirm,
  onCancel,
}: {
  user: User;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!loading ? onCancel : undefined} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl overflow-y-auto max-h-[90vh]">
        <h3 className="text-lg font-bold mb-2">Hapus Pengguna</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Apakah kamu yakin ingin menghapus akun{" "}
          <strong>{user.full_name}</strong>? Tindakan ini tidak dapat
          dibatalkan.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="flex-1 min-w-[100px]"
            onClick={onCancel}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            className="flex-1 min-w-[100px] bg-rose-600 hover:bg-rose-700 text-white"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {loading ? "Menghapus..." : "Hapus"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl overflow-y-auto max-h-[90vh]">
        <h3 className="text-lg font-bold mb-4">Detail Pengguna</h3>
        <div className="space-y-3 mb-6">
          {/* 👇 PERBAIKAN 3: Role Dihapus, dan Kategori menggunakan Mapper 👇 */}
          {[
            { label: "Nama Lengkap", value: user.full_name || "-" },
            { label: "Username", value: user.username },
            { label: "Email", value: user.email },
            { label: "Nomor Telepon", value: user.phone_number || "-" },
            { label: "Kategori", value: CATEGORY_MAP[user.category_status] || user.category_status || "-" },
            { label: "Status", value: user.is_Active ? "Aktif" : "Suspended" },
            {
              label: "Bergabung",
              value: new Date(user.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-wrap justify-between text-sm gap-1 border-b border-border/50 pb-2">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-right">{item.value}</span>
            </div>
          ))}

          {!user.is_Active && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex gap-2 items-start text-rose-700 text-xs leading-relaxed dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Akses Login Diblokir:</strong> Akun ini berstatus Suspended. Pengguna tidak dapat melakukan login sampai statusnya diaktifkan kembali.
              </div>
            </div>
          )}
        </div>
        <Button variant="outline" className="w-full" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [statsTotal, setStatsTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [detailTarget, setDetailTarget] = useState<User | null>(null);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filterCategory !== "All") params.append("category", filterCategory);

      const res = await fetch(
        `${API_BASE}/admin/users?${params.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengambil data pengguna.");
      }

      const json = await res.json();
      setStatsTotal(json.data.stats.total);
      setUsers(json.data.list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterCategory]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = async (user: User) => {
    setActionLoading(user.user_id);
    try {
      const newStatus = !user.is_Active;
      const res = await fetch(
        `${API_BASE}/admin/users/${user.user_id}/status`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ is_Active: newStatus }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengubah status.");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id ? { ...u, is_Active: newStatus } : u
        )
      );

      showToast(
        newStatus
          ? `Akun ${user.full_name || user.username} berhasil diaktifkan.`
          : `Akun ${user.full_name || user.username} berhasil disuspend.`,
        "success"
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      showToast(message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.user_id);
    try {
      const res = await fetch(
        `${API_BASE}/admin/users/${deleteTarget.user_id}`,
        { method: "DELETE", headers: getAuthHeaders() }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menghapus pengguna.");
      }

      setUsers((prev) => prev.filter((u) => u.user_id !== deleteTarget.user_id));
      setStatsTotal((prev) => prev - 1);

      showToast(`Akun ${deleteTarget.full_name || deleteTarget.username} berhasil dihapus.`, "success");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      showToast(message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filterCategory]);

  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Manajemen Pengguna</h1>
              <p className="text-muted-foreground text-sm">
                Kelola akun pengguna ARAHIN
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Pengguna", val: statsTotal, color: "text-primary" },
              { label: "Pengguna Aktif", val: users.filter((u) => u.is_Active).length, color: "text-emerald-600" },
              { label: "Pengguna Suspended", val: users.filter((u) => !u.is_Active).length, color: "text-rose-600" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-card rounded-xl border border-border p-5 shadow-sm"
              >
                <div className={`text-2xl md:text-3xl font-bold ${s.color} mb-1 truncate`}>
                  {loading ? (
                    <span className="inline-block h-9 w-12 bg-muted animate-pulse rounded-md" />
                  ) : (
                    s.val
                  )}
                </div>
                <div className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pengguna..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  size="sm"
                  variant={filterCategory === cat.value ? "default" : "outline"}
                  className="h-9 px-3 text-xs font-semibold whitespace-nowrap"
                  onClick={() => setFilterCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Table dengan Horizontal Scroll */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full scrollbar-thin">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Pengguna", "Kategori", "Status", "Bergabung", "Aksi"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-muted animate-pulse rounded-md w-3/4" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-muted-foreground text-sm"
                      >
                        Tidak ada pengguna yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => {
                      const isActioning = actionLoading === user.user_id;
                      return (
                        <tr
                          key={user.user_id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                                {user.full_name
                                  ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                                  : "?"}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate max-w-[150px]">
                                  {user.full_name || "-"}
                                </div>
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>

                        {/* Kategori - Ditambahkan Map */}
                        <td className="px-6 py-4">
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 px-2.5 py-1 rounded-full font-semibold">
                            {CATEGORY_MAP[user.category_status] || user.category_status || "-"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              user.is_Active
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                            }`}
                          >
                            {user.is_Active ? "Aktif" : "Suspended"}
                          </span>
                        </td>

                        {/* Bergabung */}
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </td>

                        {/* Aksi */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => setDetailTarget(user)}
                              disabled={isActioning}
                            >
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-8 text-xs ${
                                user.is_Active
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                              }`}
                            >
                              {user.is_Active ? "Aktif" : "Suspended"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(user.created_at)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] px-2"
                                onClick={() => setDetailTarget(user)}
                                disabled={isActioning}
                              >
                                Detail
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className={`h-8 text-[10px] px-2 ${
                                  user.is_Active
                                    ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                                    : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                }`}
                                onClick={() => toggleStatus(user)}
                                disabled={isActioning}
                              >
                                {isActioning ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : user.is_Active ? (
                                  <UserX className="h-3.5 w-3.5 mr-1" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                                )}
                                {!isActioning && (user.is_Active ? "Suspend" : "Aktifkan")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                                onClick={() => setDeleteTarget(user)}
                                disabled={isActioning}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

          {!loading && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalItems={users.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          loading={actionLoading === deleteTarget.user_id}
          onConfirm={deleteUser}
          onCancel={() => {
            if (actionLoading !== deleteTarget.user_id) setDeleteTarget(null);
          }}
        />
      )}
      {detailTarget && (
        <DetailModal
          user={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
