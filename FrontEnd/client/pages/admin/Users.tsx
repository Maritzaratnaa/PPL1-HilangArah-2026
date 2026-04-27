import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Trash2,
  UserCheck,
  UserX,
  ChevronDown,
  Users,
  BarChart3,
  Zap,
  FileText,
  Bus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/Admin/AdminSideBar";

const dummyUsers = [
  {
    user_id: "1",
    username: "budisantoso",
    email: "budi@email.com",
    full_name: "Budi Santoso",
    phone_number: "+62 812 3456 7890",
    category_status: "Penyandang Disabilitas",
    role: "Pengguna",
    is_Active: true,
    created_at: "2025-03-01",
  },
  {
    user_id: "2",
    username: "sitirahma",
    email: "siti@email.com",
    full_name: "Siti Rahma",
    phone_number: "+62 813 2345 6789",
    category_status: "Lansia",
    role: "Pengguna",
    is_Active: true,
    created_at: "2025-03-05",
  },
  {
    user_id: "3",
    username: "dewiayu",
    email: "dewi@email.com",
    full_name: "Dewi Ayu",
    phone_number: "+62 814 3456 7890",
    category_status: "Perempuan",
    role: "Pengguna",
    is_Active: false,
    created_at: "2025-03-10",
  },
  {
    user_id: "4",
    username: "ahmadrizal",
    email: "ahmad@email.com",
    full_name: "Ahmad Rizal",
    phone_number: "+62 815 4567 8901",
    category_status: "Situasi Rentan",
    role: "Pengguna",
    is_Active: true,
    created_at: "2025-03-12",
  },
  {
    user_id: "5",
    username: "rintasari",
    email: "rinta@email.com",
    full_name: "Rinta Sari",
    phone_number: "+62 816 5678 9012",
    category_status: "Anak-Anak",
    role: "Pengguna",
    is_Active: true,
    created_at: "2025-03-15",
  },
  {
    user_id: "6",
    username: "jokoheru",
    email: "joko@email.com",
    full_name: "Joko Heru",
    phone_number: "+62 817 6789 0123",
    category_status: "General",
    role: "Pengguna",
    is_Active: false,
    created_at: "2025-03-18",
  },
];

type User = (typeof dummyUsers)[0];

function DeleteModal({
  user,
  onConfirm,
  onCancel,
}: {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">Hapus Pengguna</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Apakah kamu yakin ingin menghapus akun{" "}
          <strong>{user.full_name}</strong>? Tindakan ini tidak dapat
          dibatalkan.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Batal
          </Button>
          <Button
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
            onClick={onConfirm}
          >
            Hapus
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-4">Detail Pengguna</h3>
        <div className="space-y-3 mb-6">
          {[
            { label: "Nama Lengkap", value: user.full_name },
            { label: "Username", value: user.username },
            { label: "Email", value: user.email },
            { label: "Nomor Telepon", value: user.phone_number },
            { label: "Kategori", value: user.category_status },
            { label: "Role", value: user.role },
            { label: "Status", value: user.is_Active ? "Aktif" : "Nonaktif" },
            { label: "Bergabung", value: user.created_at },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState(dummyUsers);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [detailTarget, setDetailTarget] = useState<User | null>(null);
  const [filterCategory, setFilterCategory] = useState("All");

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      filterCategory === "All" || u.category_status === filterCategory;
    return matchSearch && matchCategory;
  });

  const toggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.user_id === userId ? { ...u, is_Active: !u.is_Active } : u,
      ),
    );
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.user_id !== userId));
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
            <h1 className="text-2xl font-bold mb-1">Manajemen Pengguna</h1>
            <p className="text-muted-foreground text-sm">
              Kelola akun pengguna ARAHIN
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              {
                label: "Total Pengguna",
                val: users.length,
                color: "text-primary",
              },
              {
                label: "Pengguna Aktif",
                val: users.filter((u) => u.is_Active).length,
                color: "text-emerald-600",
              },
              {
                label: "Pengguna Nonaktif",
                val: users.filter((u) => !u.is_Active).length,
                color: "text-rose-600",
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
                placeholder="Cari pengguna berdasarkan nama, email, atau username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "All",
                "Penyandang Disabilitas",
                "Lansia",
                "Perempuan",
                "Situasi Rentan",
                "Anak-Anak",
                "General",
              ].map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={filterCategory === cat ? "default" : "outline"}
                  className="h-9 px-3 text-xs font-semibold"
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat === "All" ? "Semua Kategori" : cat}
                </Button>
              ))}
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
                    Kategori
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Bergabung
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => (
                  <tr
                    key={user.user_id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                          {user.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {user.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 px-2.5 py-1 rounded-full font-semibold">
                        {user.category_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          user.is_Active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                        }`}
                      >
                        {user.is_Active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.created_at}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setDetailTarget(user)}
                        >
                          Detail
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-8 text-xs ${
                            user.is_Active
                              ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                              : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          }`}
                          onClick={() => toggleStatus(user.user_id)}
                        >
                          {user.is_Active ? (
                            <UserX className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                          )}
                          {user.is_Active ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground text-sm"
                    >
                      Tidak ada pengguna yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onConfirm={() => deleteUser(deleteTarget.user_id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {detailTarget && (
        <DetailModal
          user={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
}
