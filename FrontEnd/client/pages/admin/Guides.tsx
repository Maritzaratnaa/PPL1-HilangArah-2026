import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Trash2,
  Pencil,
  Plus,
  X,
  UserCheck,
  Users,
  Zap,
  BarChart3,
  FileText,
  Bus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminSidebar } from '@/components/Admin/AdminSideBar';

const dummyGuides = [
  {
    employee_id: "EMP001",
    full_name: "Andi Prasetyo",
    phone_number: "+62 812 1111 2222",
    domicile: "Jakarta Selatan",
    is_available: true,
  },
  {
    employee_id: "EMP002",
    full_name: "Sari Dewi",
    phone_number: "+62 813 2222 3333",
    domicile: "Jakarta Barat",
    is_available: true,
  },
  {
    employee_id: "EMP003",
    full_name: "Budi Hartono",
    phone_number: "+62 814 3333 4444",
    domicile: "Jakarta Pusat",
    is_available: false,
  },
  {
    employee_id: "EMP004",
    full_name: "Rina Kusuma",
    phone_number: "+62 815 4444 5555",
    domicile: "Jakarta Timur",
    is_available: true,
  },
  {
    employee_id: "EMP005",
    full_name: "Doni Setiawan",
    phone_number: "+62 816 5555 6666",
    domicile: "Jakarta Utara",
    is_available: false,
  },
];

type Guide = (typeof dummyGuides)[0];

const emptyForm = {
  employee_id: "",
  full_name: "",
  phone_number: "",
  domicile: "",
  is_available: true,
};

function GuideModal({
  guide,
  onSave,
  onClose,
}: {
  guide: Partial<Guide> & { employee_id: string };
  onSave: (g: Guide) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...emptyForm, ...guide });
  const isEdit = !!guide.full_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">
            {isEdit ? "Edit Pemandu" : "Tambah Pemandu"}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">
              ID Karyawan
            </Label>
            <Input
              value={form.employee_id}
              onChange={(e) =>
                setForm({ ...form, employee_id: e.target.value })
              }
              placeholder="EMP001"
              disabled={isEdit}
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">
              Nama Lengkap
            </Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Masukkan nama lengkap"
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">
              Nomor Telepon
            </Label>
            <Input
              value={form.phone_number}
              onChange={(e) =>
                setForm({ ...form, phone_number: e.target.value })
              }
              placeholder="+62 812 xxxx xxxx"
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">
              Domisili
            </Label>
            <Input
              value={form.domicile}
              onChange={(e) => setForm({ ...form, domicile: e.target.value })}
              placeholder="Jakarta Selatan"
              className="h-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_available"
              checked={form.is_available}
              onChange={(e) =>
                setForm({ ...form, is_available: e.target.checked })
              }
              className="h-4 w-4"
            />
            <Label
              htmlFor="is_available"
              className="text-sm font-semibold cursor-pointer"
            >
              Tersedia untuk bertugas
            </Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              if (!form.employee_id || !form.full_name) return;
              onSave(form as Guide);
            }}
          >
            {isEdit ? "Simpan Perubahan" : "Tambah Pemandu"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  guide,
  onConfirm,
  onCancel,
}: {
  guide: Guide;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">Hapus Pemandu</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Apakah kamu yakin ingin menghapus pemandu{" "}
          <strong>{guide.full_name}</strong>? Tindakan ini tidak dapat
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

export default function AdminGuides() {
  const [guides, setGuides] = useState(dummyGuides);
  const [search, setSearch] = useState("");
  const [modalGuide, setModalGuide] = useState<Partial<Guide> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guide | null>(null);
  const [filterAvailability, setFilterAvailability] = useState("All");

  const filtered = guides.filter((g) => {
    const matchSearch =
      g.full_name.toLowerCase().includes(search.toLowerCase()) ||
      g.domicile.toLowerCase().includes(search.toLowerCase()) ||
      g.employee_id.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterAvailability === "All" ||
      (filterAvailability === "Tersedia" && g.is_available) ||
      (filterAvailability === "Tidak Tersedia" && !g.is_available);
    return matchSearch && matchFilter;
  });

  const handleSave = (guide: Guide) => {
    const exists = guides.find((g) => g.employee_id === guide.employee_id);
    if (exists) {
      setGuides((prev) =>
        prev.map((g) => (g.employee_id === guide.employee_id ? guide : g)),
      );
    } else {
      setGuides((prev) => [...prev, guide]);
    }
    setModalGuide(null);
  };

  const handleDelete = (employeeId: string) => {
    setGuides((prev) => prev.filter((g) => g.employee_id !== employeeId));
    setDeleteTarget(null);
  };

  const toggleAvailability = (employeeId: string) => {
    setGuides((prev) =>
      prev.map((g) =>
        g.employee_id === employeeId
          ? { ...g, is_available: !g.is_available }
          : g,
      ),
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Manajemen Pemandu</h1>
              <p className="text-muted-foreground text-sm">
                Kelola data pemandu ARAHIN
              </p>
            </div>
            <Button className="gap-2" onClick={() => setModalGuide(emptyForm)}>
              <Plus className="h-4 w-4" />
              Tambah Pemandu
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              {
                label: "Total Pemandu",
                val: guides.length,
                color: "text-primary",
              },
              {
                label: "Tersedia",
                val: guides.filter((g) => g.is_available).length,
                color: "text-emerald-600",
              },
              {
                label: "Tidak Tersedia",
                val: guides.filter((g) => !g.is_available).length,
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
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pemandu berdasarkan nama, ID, atau domisili..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex gap-2">
              {["All", "Tersedia", "Tidak Tersedia"].map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filterAvailability === f ? "default" : "outline"}
                  className="h-11 px-4 text-xs font-semibold"
                  onClick={() => setFilterAvailability(f)}
                >
                  {f === "All" ? "Semua" : f}
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
                    Pemandu
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    ID Karyawan
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Domisili
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
                {filtered.map((guide) => (
                  <tr
                    key={guide.employee_id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                          {guide.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {guide.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {guide.phone_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                      {guide.employee_id}
                    </td>
                    <td className="px-6 py-4 text-sm">{guide.domicile}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          guide.is_available
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                        }`}
                      >
                        {guide.is_available
                          ? "Tersedia"
                          : "Tidak Tersedia"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setModalGuide(guide)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-8 text-xs ${
                            guide.is_available
                              ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                              : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          }`}
                          onClick={() => toggleAvailability(guide.employee_id)}
                        >
                          {guide.is_available ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => setDeleteTarget(guide)}
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
                      Tidak ada pemandu yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      {modalGuide && (
        <GuideModal
          guide={modalGuide as Guide}
          onSave={handleSave}
          onClose={() => setModalGuide(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          guide={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.employee_id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
