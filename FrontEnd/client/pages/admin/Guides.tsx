import { useState, useEffect } from "react";
import { Search, Trash2, Pencil, Plus, X, Loader2, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminSidebar } from '@/components/Admin/AdminSideBar';
import { Pagination } from '@/components/Admin/Pagination';
import { toast } from "sonner";

interface Guide {
  employee_id: string;
  full_name: string;
  phone_number: string;
  domicile: string;
  gender: string;
  age: number;
  detail: string;
  is_available: boolean;
}

const emptyForm: Guide = {
  employee_id: "",
  full_name: "",
  phone_number: "",
  domicile: "",
  gender: "",
  age: 0,
  detail: "",
  is_available: true,
};

const customToastStyle = {
  className: "!bg-primary !text-primary-foreground border-none font-medium !text-[16px] !p-4",
};

function GuideModal({ guide, onSave, onClose }: {
  guide: Partial<Guide> & { employee_id: string };
  onSave: (g: Partial<Guide>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...emptyForm, ...guide });
  const isEdit = !!guide.full_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? "Edit Pemandu" : "Tambah Pemandu"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {isEdit && (
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">ID Karyawan</Label>
              <Input value={form.employee_id} disabled className="h-10 bg-muted/50" />
            </div>
          )}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Nama Lengkap</Label>
            <Input value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Masukkan nama lengkap" className="h-10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Jenis Kelamin</Label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
                <option value="">Pilih...</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Usia</Label>
              <Input type="number" min={18} max={65} value={form.age || ''}
                onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                placeholder="Usia" className="h-10" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Nomor Telepon</Label>
            <Input value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="+62 812 xxxx xxxx" className="h-10" />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Domisili</Label>
            <Input value={form.domicile}
              onChange={(e) => setForm({ ...form, domicile: e.target.value })}
              placeholder="Jakarta Selatan" className="h-10" />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Detail / Keterangan</Label>
            <textarea value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
              placeholder="Pengalaman, keahlian khusus, catatan lainnya..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex-1 min-w-[100px]" onClick={onClose}>Batal</Button>
          <Button className="flex-1 min-w-[100px]" onClick={() => {
            if (!form.full_name || !form.phone_number || !form.domicile || !form.gender) {
              toast.error("Nama, telepon, domisili, dan jenis kelamin wajib diisi!", customToastStyle);
              return;
            }
            onSave(form);
          }}>
            {isEdit ? "Simpan" : "Tambah"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Detail Pemandu</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold flex-shrink-0">
              {guide.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>
          {[
            { label: 'ID Karyawan', value: guide.employee_id },
            { label: 'Nama Lengkap', value: guide.full_name },
            { label: 'Jenis Kelamin', value: guide.gender || '-' },
            { label: 'Usia', value: guide.age ? `${guide.age} tahun` : '-' },
            { label: 'Nomor Telepon', value: guide.phone_number },
            { label: 'Domisili', value: guide.domicile },
            { label: 'Status', value: guide.is_available ? 'Tersedia' : 'Tidak Tersedia' },
          ].map((item) => (
            <div key={item.label} className="flex flex-wrap justify-between text-sm border-b border-border pb-2 gap-2">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-right">{item.value}</span>
            </div>
          ))}
          {guide.detail && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Detail / Keterangan</div>
              <p className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{guide.detail}</p>
            </div>
          )}
        </div>
        <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button>
      </div>
    </div>
  );
}

function DeleteModal({ guide, onConfirm, onCancel }: { guide: Guide; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold mb-2">Hapus Pemandu</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Apakah kamu yakin ingin menghapus pemandu <strong>{guide.full_name}</strong>?
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex-1 min-w-[100px]" onClick={onCancel}>Batal</Button>
          <Button className="flex-1 min-w-[100px] bg-rose-600 hover:bg-rose-700 text-white" onClick={onConfirm}>Hapus</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminGuides() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [search, setSearch] = useState("");
  const [modalGuide, setModalGuide] = useState<Partial<Guide> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guide | null>(null);
  const [detailTarget, setDetailTarget] = useState<Guide | null>(null);
  const [filterAvailability, setFilterAvailability] = useState("All");
  const [filterGender, setFilterGender] = useState("All");

  const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/admin/guides` : "http://localhost:3000/api/admin/guides";
  const token = localStorage.getItem("token");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => { setCurrentPage(1); }, [search, filterAvailability, filterGender]);

  const fetchGuides = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        const mappedGuides = json.data.list.map((g: any) => ({
          ...g,
          is_available: g.is_available === 1
        }));
        setGuides(mappedGuides);
      }
    } catch (error) {
      console.error("Gagal mengambil data pemandu", error);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const filtered = guides.filter((g) => {
    const matchSearch =
      g.full_name.toLowerCase().includes(search.toLowerCase()) ||
      g.domicile.toLowerCase().includes(search.toLowerCase()) ||
      g.employee_id.toLowerCase().includes(search.toLowerCase());
    const matchAvailability =
      filterAvailability === "All" ||
      (filterAvailability === "Tersedia" && g.is_available) ||
      (filterAvailability === "Tidak Tersedia" && !g.is_available);
    const matchGender =
      filterGender === "All" || g.gender === filterGender;
    return matchSearch && matchAvailability && matchGender;
  });

  const handleSave = async (guideData: Partial<Guide>) => {
    const isEdit = !!guideData.employee_id;
    const url = isEdit ? `${API_URL}/${guideData.employee_id}` : API_URL;
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(guideData),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || "Data pemandu berhasil disimpan.", customToastStyle);
        fetchGuides();
        setModalGuide(null);
      } else {
        toast.error(json.message || "Gagal menyimpan data.", customToastStyle);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.", customToastStyle);
    }
  };

  const handleDelete = async (employeeId: string) => {
    try {
      const res = await fetch(`${API_URL}/${employeeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Pemandu berhasil dihapus.", customToastStyle);
        fetchGuides();
        setDeleteTarget(null);
      } else {
        toast.error(json.message || "Gagal menghapus pemandu.", customToastStyle);
      }
    } catch {
      toast.error("Gagal menghapus data. Terjadi kesalahan jaringan.", customToastStyle);
    }
  };

  const toggleAvailability = async (guide: Guide) => {
    const newStatus = !guide.is_available;
    try {
      const res = await fetch(`${API_URL}/${guide.employee_id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_available: newStatus }),
      });
      if (res.ok) {
        toast.success(`Status berhasil diubah menjadi ${newStatus ? 'Tersedia' : 'Tidak Tersedia'}.`, customToastStyle);
        fetchGuides();
      } else {
        const json = await res.json();
        toast.error(json.message || "Gagal mengubah status.", customToastStyle);
      }
    } catch {
      toast.error("Gagal mengubah status. Terjadi kesalahan jaringan.", customToastStyle);
    }
  };

  const paginatedGuides = filtered.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 md:p-8">
          <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Manajemen Pemandu</h1>
              <p className="text-muted-foreground text-sm">Kelola data pemandu ARAHIN</p>
            </div>
            <Button className="gap-2 w-full sm:w-auto" onClick={() => setModalGuide(emptyForm)}>
              <Plus className="h-4 w-4" /> Tambah Pemandu
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Pemandu", val: guides.length, color: "text-primary" },
              { label: "Tersedia", val: guides.filter(g => g.is_available).length, color: "text-emerald-600" },
              { label: "Tidak Tersedia", val: guides.filter(g => !g.is_available).length, color: "text-rose-600" },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <div className={`text-2xl md:text-3xl font-bold ${s.color} mb-1 truncate`}>{s.val}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pemandu berdasarkan nama, ID, atau domisili..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 w-full"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Ketersediaan:</label>
                <select value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="All">Semua</option>
                  <option value="Tersedia">Tersedia</option>
                  <option value="Tidak Tersedia">Tidak Tersedia</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Jenis Kelamin:</label>
                <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="All">Semua</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full scrollbar-thin">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Pemandu", "ID Karyawan", "Jenis Kelamin", "Usia", "Domisili", "Status", "Aksi"].map((header) => (
                      <th key={header} className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedGuides.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-sm">
                        Tidak ada pemandu yang ditemukan.
                      </td>
                    </tr>
                  ) : paginatedGuides.map((guide) => (
                    <tr key={guide.employee_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                            {guide.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold truncate max-w-[150px]">{guide.full_name}</div>
                            <div className="text-xs text-muted-foreground">{guide.phone_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono whitespace-nowrap">{guide.employee_id}</td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">{guide.gender || '-'}</td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">{guide.age ? `${guide.age} th` : '-'}</td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap truncate max-w-[120px]">{guide.domicile}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${guide.is_available ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"}`}>
                          {guide.is_available ? "Tersedia" : "Tidak Tersedia"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-8 text-[10px] px-2"
                            onClick={() => setDetailTarget(guide)}>
                            Detail
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-[10px] px-2"
                            onClick={() => setModalGuide(guide)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline"
                            className={`h-8 text-[10px] px-2 ${guide.is_available ? "text-rose-600 border-rose-200 hover:bg-rose-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
                            onClick={() => toggleAvailability(guide)}>
                            {guide.is_available ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-[10px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => setDeleteTarget(guide)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
              totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>

      {modalGuide && <GuideModal guide={modalGuide as Guide} onSave={handleSave} onClose={() => setModalGuide(null)} />}
      {detailTarget && <DetailModal guide={detailTarget} onClose={() => setDetailTarget(null)} />}
      {deleteTarget && <DeleteModal guide={deleteTarget} onConfirm={() => handleDelete(deleteTarget.employee_id)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}