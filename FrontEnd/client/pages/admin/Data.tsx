import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, Pencil, Plus, X, Users, UserCheck, Zap, BarChart3, FileText, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminSidebar } from '@/components/Admin/AdminSideBar';
import { preview } from 'vite';
import { Pagination } from '@/components/Admin/Pagination';
import { th } from 'zod/v4/locales';

type Trans = {
  trans_id: string;
  name: string;
  type: string;
  is_low_entry: boolean;
  has_wheelchair_slot: boolean;
  has_priority_seat: boolean;
  has_women_area: boolean;
  is_active: boolean;
};

type Stop = {
  stop_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  has_ramp: boolean;
  has_elevator: boolean;
  is_active: boolean;
  hub_id: string;
};

type RouteStop = {
  stop_id: string;
  stop_name: string;
  stop_order: number;
  est_time_minutes: number;
};

type Route = {
  route_id: string;
  trans_id: string;
  route_name: string;
  origin_stop_id: string;
  destination_stop_id: string;
  origin_stop_name: string;
  dest_stop_name: string;
  is_active: boolean;
  route_stops: RouteStop[];
};

const emptyTrans: Trans = {
  trans_id: '', name: '', type: 'Bus',
  is_low_entry: false, has_wheelchair_slot: false,
  has_priority_seat: false, has_women_area: false, is_active: true
};

const emptyStop: Stop = {
  stop_id: '', name: '', address: '',
  latitude: 0, longitude: 0,
  has_ramp: false, has_elevator: false,
  is_active: true, hub_id: ''
};

const emptyRoute: Route = {
  route_id: '', trans_id: '', route_name: '',
  origin_stop_id: '', destination_stop_id: '',
  origin_stop_name: '', dest_stop_name: '',
  is_active: true,
  route_stops: [],
};

// ── TRANS MODAL ──
function TransModal({ trans, onSave, onClose }: { trans: Partial<Trans>; onSave: (t: Trans) => void; onClose: () => void }) {
  const [form, setForm] = useState({ ...emptyTrans, ...trans });
  const isEdit = !!trans.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Edit Transportasi' : 'Tambah Transportasi'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Nama Transportasi</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama transportasi" className="h-10" />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Tipe</Label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
              {['Bus', 'Train', 'LRT', 'MRT'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold block">Fasilitas Aksesibilitas</Label>
            {[
              { key: 'is_low_entry', label: 'Low Entry' },
              { key: 'has_wheelchair_slot', label: 'Slot Kursi Roda' },
              { key: 'has_priority_seat', label: 'Kursi Prioritas' },
              { key: 'has_women_area', label: 'Area Khusus Wanita' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <input type="checkbox" id={key} checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor={key} className="text-sm accent-blue-600 cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input type="checkbox" id="trans_active" checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
            <Label htmlFor="trans_active" className="text-sm accent-blue-600 cursor-pointer">Aktif</Label>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
          <Button className="flex-1" onClick={() => { if (!form.name) return; onSave(form as Trans); }}>
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── STOP MODAL ──
function StopModal({ stop, onSave, onClose }: { stop: Partial<Stop>; onSave: (s: Stop) => void; onClose: () => void }) {
  const [form, setForm] = useState({ ...emptyStop, ...stop });
  const isEdit = !!stop.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Edit Halte' : 'Tambah Halte'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Nama Halte</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama halte" className="h-10" />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Alamat</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat halte" className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Latitude</Label>
              <Input type="number" step="any" value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
                placeholder="-6.2088" className="h-10" />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Longitude</Label>
              <Input type="number" step="any" value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                placeholder="106.8456" className="h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold block">Fasilitas Aksesibilitas</Label>
            {[
              { key: 'has_ramp', label: 'Ramp' },
              { key: 'has_elevator', label: 'Elevator' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <input type="checkbox" id={key} checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor={key} className="text-sm accent-blue-600 cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input type="checkbox" id="stop_active" checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
            <Label htmlFor="stop_active" className="text-sm accent-blue-600 cursor-pointer">Aktif</Label>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
          <Button className="flex-1" onClick={() => { if (!form.name) return; onSave(form as Stop); }}>
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── ROUTE MODAL ──
function RouteModal({ route, transList, stopsList, onSave, onClose }: {
  route: Partial<Route>;
  transList: Trans[];
  stopsList: Stop[];
  onSave: (r: Route) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Route>({ ...emptyRoute, ...route });
  const isEdit = !!route.route_name;

  const addRouteStop = () => {
    const nextOrder = form.route_stops.length + 1;
    setForm({
      ...form,
      route_stops: [...form.route_stops, { stop_id: '', stop_name: '', stop_order: nextOrder, est_time_minutes: 0 }],
    });
  };

  const removeRouteStop = (idx: number) => {
    const updated = form.route_stops
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, stop_order: i + 1 }));
    setForm({ ...form, route_stops: updated });
  };

  const updateRouteStop = (idx: number, field: keyof RouteStop, value: string | number) => {
    const updated = form.route_stops.map((s, i) => {
      if (i !== idx) return s;
      if (field === 'stop_id') {
        const stop = stopsList.find(st => st.stop_id === value);
        return { ...s, stop_id: value as string, stop_name: stop?.name || '' };
      }
      return { ...s, [field]: value };
    });
    setForm({ ...form, route_stops: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{isEdit ? 'Edit Rute' : 'Tambah Rute'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 mb-6">
          {/* Nama Rute */}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Nama Rute</Label>
            <Input value={form.route_name} onChange={(e) => setForm({ ...form, route_name: e.target.value })}
              placeholder="Nama rute" className="h-10" />
          </div>

          {/* Transportasi */}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Transportasi</Label>
            <select value={form.trans_id} onChange={(e) => setForm({ ...form, trans_id: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
              <option value="">Pilih transportasi...</option>
              {transList.map(t => <option key={t.trans_id} value={t.trans_id}>{t.name} ({t.type})</option>)}
            </select>
          </div>

          {/* Halte Asal */}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Halte Asal</Label>
            <select value={form.origin_stop_id} onChange={(e) => {
              const stop = stopsList.find(s => s.stop_id === e.target.value);
              setForm({ ...form, origin_stop_id: e.target.value, origin_stop_name: stop?.name || '' });
            }} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
              <option value="">Pilih halte asal...</option>
              {stopsList.map(s => <option key={s.stop_id} value={s.stop_id}>{s.name}</option>)}
            </select>
          </div>

          {/* Halte Tujuan */}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Halte Tujuan</Label>
            <select value={form.destination_stop_id} onChange={(e) => {
              const stop = stopsList.find(s => s.stop_id === e.target.value);
              setForm({ ...form, destination_stop_id: e.target.value, dest_stop_name: stop?.name || '' });
            }} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
              <option value="">Pilih halte tujuan...</option>
              {stopsList.filter(s => s.stop_id !== form.origin_stop_id).map(s =>
                <option key={s.stop_id} value={s.stop_id}>{s.name}</option>
              )}
            </select>
          </div>

          {/* Route Stops */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Urutan Halte (Route Stops)</Label>
              <button onClick={addRouteStop}
                className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                <Plus className="h-3.5 w-3.5" /> Tambah Halte
              </button>
            </div>

            {form.route_stops.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                Belum ada halte. Klik "Tambah Halte" untuk menambahkan.
              </div>
            )}

            <div className="space-y-2">
              {form.route_stops.map((rs, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 border border-border">
                  {/* Stop Order */}
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {rs.stop_order}
                  </div>

                  {/* Pilih Halte */}
                  <select value={rs.stop_id}
                    onChange={(e) => updateRouteStop(idx, 'stop_id', e.target.value)}
                    className="flex-1 h-8 px-2 rounded-md border border-border bg-background text-xs">
                    <option value="">Pilih halte...</option>
                    {stopsList.map(s => <option key={s.stop_id} value={s.stop_id}>{s.name}</option>)}
                  </select>

                  {/* Est Time */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Input type="number" min={0}
                      value={rs.est_time_minutes}
                      onChange={(e) => updateRouteStop(idx, 'est_time_minutes', parseInt(e.target.value) || 0)}
                      className="h-8 w-16 text-xs text-center px-1" />
                    <span className="text-xs text-muted-foreground">mnt</span>
                  </div>

                  {/* Hapus */}
                  <button onClick={() => removeRouteStop(idx)}
                    className="text-rose-500 hover:text-rose-700 flex-shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Aktif */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input type="checkbox" id="route_active" checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
            <Label htmlFor="route_active" className="text-sm accent-blue-600 cursor-pointer">Aktif</Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
          <Button className="flex-1" onClick={() => {
            if (!form.route_name || !form.trans_id || !form.origin_stop_id || !form.destination_stop_id) return;
            onSave(form as Route);
          }}>
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── DELETE MODAL ──
function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">Konfirmasi Hapus</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Apakah kamu yakin ingin menghapus <strong>{name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Batal</Button>
          <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={onConfirm}>Hapus</Button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function AdminData() {
  const [activeTab, setActiveTab] = useState<'trans' | 'stops' | 'routes'>('trans');
  const [search, setSearch] = useState('');

  // Transport & Stops menggunakan Dummy Data Sementara
  const [transList, setTransList] = useState([]);
  const [stopsList, setStopsList] = useState([]);

  // Routes di-set kosong karena akan di-fetch dari Backend API
  const [routesList, setRoutesList] = useState([]);

  // Filter states
  const [filterType, setFilterType] = useState('All');
  const [filterFacility, setFilterFacility] = useState('All');

  const [transModal, setTransModal] = useState<Partial<Trans> | null>(null);
  const [stopModal, setStopModal] = useState<Partial<Stop> | null>(null);
  const [routeModal, setRouteModal] = useState<Partial<Route> | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ name: string; onConfirm: () => void } | null>(null);

  // --- API SETTINGS ---
  const API_URL_ROUTES = "http://localhost:3000/api/admin/transportations/routes";
  const API_URL_TRANS = "http://localhost:3000/api/admin/transportations/trans";
  const API_URL_STOPS = "http://localhost:3000/api/admin/transportations/stops";
  const token = localStorage.getItem("token");

  // ==========================================
  // 🚀 LOGIKA API RUTE (FETCH, SAVE, DELETE)
  // ==========================================

  const fetchRoutes = async () => {
    try {
      const res = await fetch(API_URL_ROUTES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok) {
        // Konversi format DB ke format State UI
        const mappedRoutes = json.data.map((r: any) => ({
          route_id: r.route_id,
          trans_id: r.trans_id,
          route_name: r.route_name,
          origin_stop_id: r.origin_stop_id,
          destination_stop_id: r.destination_stop_id,
          origin_stop_name: r.origin_stop_name || '',
          dest_stop_name: r.destination_stop_name || '', // Di UI menggunakan dest_stop_name
          is_active: r.is_active === 1, // Ubah tinyint(1) ke boolean true/false
          route_stops: r.route_stops || [], // Ambil dari API
        }));
        setRoutesList(mappedRoutes);
      }
    } catch (error) {
      console.error("Gagal mengambil data rute:", error);
    }
  };

  // Muat data saat pertama kali halaman dibuka
  useEffect(() => {
    fetchRoutes();
    fetchTrans();
    fetchStops();
  }, []);

  const handleSaveRoute = async (r: Route) => {
    const isEdit = !!r.route_id && r.route_id !== '';
    const url = isEdit ? `${API_URL_ROUTES}/${r.route_id}` : API_URL_ROUTES;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          route_name: r.route_name,
          origin_stop_id: r.origin_stop_id,
          destination_stop_id: r.destination_stop_id,
          trans_id: r.trans_id,
          is_active: r.is_active ? 1 : 0, // Ubah boolean kembali ke angka
          route_stops: r.route_stops
        }),
      });

      const json = await res.json();
      if (res.ok) {
        alert(json.message);
        fetchRoutes(); // Refresh data dari DB
        setRouteModal(null); // Tutup modal
      } else {
        alert(json.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleDeleteRoute = async (route_id: string) => {
    try {
      const res = await fetch(`${API_URL_ROUTES}/${route_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchRoutes(); // Refresh data
        setDeleteModal(null);
      } else {
        const json = await res.json();
        alert(json.message);
      }
    } catch (error) {
      alert("Gagal menghapus rute.");
    }
  };

  // ==========================================
  // 🛑 END LOGIKA API RUTE
  // ==========================================


  // ── FILTERED DATA ──
  const filteredTrans = transList.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || t.type === filterType;
    return matchSearch && matchType;
  });

  const filteredStops = stopsList.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.address || '').toLowerCase().includes(search.toLowerCase());
    const matchFacility =
      filterFacility === 'All' ||
      (filterFacility === 'Ramp' && s.has_ramp) ||
      (filterFacility === 'Elevator' && s.has_elevator) ||
      (filterFacility === 'Ramp & Elevator' && s.has_ramp && s.has_elevator) ||
      (filterFacility === 'Tanpa Fasilitas' && !s.has_ramp && !s.has_elevator);
    return matchSearch && matchFacility;
  });

  const filteredRoutes = routesList.filter(r =>
    r.route_name.toLowerCase().includes(search.toLowerCase()) ||
    r.origin_stop_name.toLowerCase().includes(search.toLowerCase()) ||
    r.dest_stop_name.toLowerCase().includes(search.toLowerCase())
  );

  // Integrasi API Transportasi
  const fetchTrans = async () => {
    try {
      const res = await fetch(API_URL_TRANS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok) {
        const mappedTrans = json.data.map((t: any) => ({
          trans_id: t.trans_id,
          name: t.name,
          type: t.type,
          is_low_entry: t.is_low_entry === 1,
          has_wheelchair_slot: t.has_wheelchair_slot === 1,
          has_priority_seat: t.has_priority_seat === 1,
          has_women_area: t.has_women_area === 1,
          is_active: t.is_active === 1,
        }));
        setTransList(mappedTrans);
      }
    }
    catch (error) {
      console.error("Gagal mengambil data transportasi: ", error);
    }
  };

  const handleSaveTrans = async (t: Trans) => {
    const isEdit = !!t.trans_id && t.trans_id !== '';
    const url = isEdit ? `${API_URL_TRANS}/${t.trans_id}` : API_URL_TRANS;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: t.name,
          type: t.type,
          is_low_entry: t.is_low_entry ? 1 : 0,
          has_wheelchair_slot: t.has_wheelchair_slot ? 1 : 0,
          has_priority_seat: t.has_priority_seat ? 1 : 0,
          has_women_area: t.has_women_area ? 1 : 0,
          is_active: t.is_active ? 1 : 0
        }),
      });

      const json = await res.json();
      if (res.ok) {
        alert(json.message || "Data transportasi berhasil disimpan.");
        fetchTrans();
        setTransModal(null);
      }
      else {
        alert(json.message);
      }
    }
    catch (error) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleDeleteTrans = async (trans_id: string) => {
    try {
      const res = await fetch(`${API_URL_TRANS}/${trans_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchTrans();
        setDeleteModal(null);
      }
      else {
        const json = await res.json();
        alert(json.message);
      }
    }
    catch (error) {
      alert("Gagal menghapus transportasi.");
    }
  };

  // Integrasi API Halte
  const fetchStops = async () => {
    try {
      const res = await fetch(API_URL_STOPS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok) {
        const mappedStops = json.data.map((s: any) => ({
          stop_id: s.stop_id,
          name: s.name,
          address: s.address || '',
          latitude: parseFloat(s.latitude) || 0,
          longitude: parseFloat(s.longitude) || 0,
          hub_id: s.hub_id || '',
          has_ramp: s.has_ramp === 1,
          has_elevator: s.has_elevator === 1,
          is_active: s.is_active === 1,
        }));
        setStopsList(mappedStops);
      }
    }
    catch (error) {
      console.error("Gagal mengambil data halte: ", error);
    }
  };

  const handleSaveStops = async (s: Stop) => {
    const isEdit = !!s.stop_id && s.stop_id !== '';
    const url = isEdit ? `${API_URL_STOPS}/${s.stop_id}` : API_URL_STOPS;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: s.name,
          address: s.address || '',
          latitude: s.latitude,
          longitude: s.longitude,
          hub_id: s.hub_id || '',
          has_ramp: s.has_ramp ? 1 : 0,
          has_elevator: s.has_elevator ? 1 : 0,
          is_active: s.is_active ? 1 : 0
        }),
      });

      const json = await res.json();
      if (res.ok) {
        alert(json.message || "Data halte berhasil disimpan.");
        fetchStops();
        setStopModal(null);
      }
      else {
        alert(json.message);
      }
    }
    catch (error) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleDeleteStops = async (stops_id: string) => {
    try {
      const res = await fetch(`${API_URL_STOPS}/${stops_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchStops();
        setDeleteModal(null);
      }
      else {
        const json = await res.json();
        alert(json.message);
      }
    }
    catch (error) {
      alert("Gagal menghapus halte.");
    }
  };

  // ── STATS ──
  const transStats = {
    all: transList.length,
    Bus: transList.filter(t => t.type === 'Bus').length,
    MRT: transList.filter(t => t.type === 'MRT').length,
    Train: transList.filter(t => t.type === 'Train').length,
    LRT: transList.filter(t => t.type === 'LRT').length,
  };

  const stopStats = {
    all: stopsList.length,
    ramp: stopsList.filter(s => s.has_ramp).length,
    elevator: stopsList.filter(s => s.has_elevator).length,
    both: stopsList.filter(s => s.has_ramp && s.has_elevator).length,
    none: stopsList.filter(s => !s.has_ramp && !s.has_elevator).length,
  };

  const tabs = [
    { key: 'trans', label: 'Transportasi', count: transList.length },
    { key: 'stops', label: 'Halte', count: stopsList.length },
    { key: 'routes', label: 'Rute', count: routesList.length },
  ];

  const [transPage, setTransPage] = useState(1);
  const [stopsPage, setStopsPage] = useState(1);
  const [routesPage, setRoutesPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset saat tab ganti
  useEffect(() => {
    setTransPage(1); setStopsPage(1); setRoutesPage(1);
  }, [activeTab, search, filterType, filterFacility]);

  const paginatedTrans = filteredTrans.slice((transPage - 1) * ITEMS_PER_PAGE, transPage * ITEMS_PER_PAGE);
  const paginatedStops = filteredStops.slice((stopsPage - 1) * ITEMS_PER_PAGE, stopsPage * ITEMS_PER_PAGE);
  const paginatedRoutes = filteredRoutes.slice((routesPage - 1) * ITEMS_PER_PAGE, routesPage * ITEMS_PER_PAGE);


  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Manajemen Data</h1>
            <p className="text-muted-foreground text-sm">
              Kelola data transportasi, halte, dan rute ARAHIN
            </p>
          </div>

          {/* ── STATS: TRANSPORTASI ── */}
          {activeTab === "trans" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Total", val: transStats.all, color: "text-primary" },
                { label: "Bus", val: transStats.Bus, color: "text-orange-600" },
                { label: "MRT", val: transStats.MRT, color: "text-blue-600" },
                {
                  label: "Train",
                  val: transStats.Train,
                  color: "text-emerald-600",
                },
                { label: "LRT", val: transStats.LRT, color: "text-purple-600" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <div className={`text-2xl font-bold ${s.color} mb-1`}>
                    {s.val}
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── STATS: HALTE ── */}
          {activeTab === "stops" && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                {
                  label: "Total Halte",
                  val: stopStats.all,
                  color: "text-primary",
                },
                {
                  label: "Ada Ramp",
                  val: stopStats.ramp,
                  color: "text-emerald-600",
                },
                {
                  label: "Ada Elevator",
                  val: stopStats.elevator,
                  color: "text-blue-600",
                },
                {
                  label: "Tanpa Fasilitas",
                  val: stopStats.none,
                  color: "text-rose-600",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <div className={`text-2xl font-bold ${s.color} mb-1`}>
                    {s.val}
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as typeof activeTab);
                  setSearch("");
                  setFilterType("All");
                  setFilterFacility("All");
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px
                  ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tab.label}
                <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── SEARCH + FILTER + ADD ── */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Cari ${activeTab === "trans" ? "transportasi" : activeTab === "stops" ? "halte" : "rute"}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Button
                className="gap-2 h-11"
                onClick={() => {
                  if (activeTab === "trans") setTransModal(emptyTrans);
                  else if (activeTab === "stops") setStopModal(emptyStop);
                  else setRouteModal(emptyRoute);
                }}
              >
                <Plus className="h-4 w-4" />
                Tambah{" "}
                {activeTab === "trans"
                  ? "Transportasi"
                  : activeTab === "stops"
                    ? "Halte"
                    : "Rute"}
              </Button>
            </div>

            {/* Filter Tipe Transportasi */}
            {activeTab === "trans" && (
              <div className="flex flex-wrap gap-2">
                {["All", "Bus", "MRT", "Train", "LRT"].map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filterType === f ? "default" : "outline"}
                    className="h-9 px-3 text-xs font-semibold"
                    onClick={() => setFilterType(f)}
                  >
                    {f === "All" ? "Semua Tipe" : f}
                  </Button>
                ))}
              </div>
            )}

            {/* Filter Fasilitas Halte */}
            {activeTab === "stops" && (
              <div className="flex flex-wrap gap-2">
                {[
                  "All",
                  "Ramp",
                  "Elevator",
                  "Ramp & Elevator",
                  "Tanpa Fasilitas",
                ].map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filterFacility === f ? "default" : "outline"}
                    className="h-9 px-3 text-xs font-semibold"
                    onClick={() => setFilterFacility(f)}
                  >
                    {f === "All" ? "Semua Fasilitas" : f}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* ── TAB: TRANSPORTASI ── */}
          {activeTab === "trans" && (
            <>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[30%]">
                        Transportasi
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[10%]">
                        Tipe
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[35%]">
                        Fasilitas
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[10%]">
                        Status
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[15%]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedTrans.map((t) => (
                      <tr
                        key={t.trans_id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold">{t.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {t.trans_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 px-2.5 py-1 rounded-full font-semibold">
                            {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {t.is_low_entry && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                Low Entry
                              </span>
                            )}
                            {t.has_wheelchair_slot && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                Slot Kursi Roda
                              </span>
                            )}
                            {t.has_priority_seat && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                Kursi Prioritas
                              </span>
                            )}
                            {t.has_women_area && (
                              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                                Area Khusus Wanita
                              </span>
                            )}
                            {!t.is_low_entry &&
                              !t.has_wheelchair_slot &&
                              !t.has_priority_seat &&
                              !t.has_women_area && (
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                          >
                            {t.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => setTransModal(t)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() =>
                                setDeleteModal({
                                  name: t.name,
                                  onConfirm: () => handleDeleteTrans(t.trans_id),
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedTrans.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-muted-foreground text-sm"
                        >
                          Tidak ada data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4">
              <Pagination 
                currentPage={transPage} 
                totalItems={filteredTrans.length} 
                itemsPerPage={ITEMS_PER_PAGE} 
                onPageChange={setTransPage} 
              />
            </div>
            </>
          )}
          

          {/* ── TAB: HALTE ── */}
          {activeTab === "stops" && (
            <>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[20%]">
                        Halte
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[20%]">
                        Alamat
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[15%]">
                        Koordinat
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[20%]">
                        Fasilitas
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[10%]">
                        Status
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[15%]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedStops.map((s) => (
                      <tr
                        key={s.stop_id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold">{s.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {s.stop_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {s.address}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-muted-foreground font-mono">
                            <div>{s.latitude.toFixed(5)}</div>
                            <div>{s.longitude.toFixed(5)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {s.has_ramp && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                Ramp
                              </span>
                            )}
                            {s.has_elevator && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                Elevator
                              </span>
                            )}
                            {!s.has_ramp && !s.has_elevator && (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                          >
                            {s.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => setStopModal(s)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() =>
                                setDeleteModal({
                                  name: s.name,
                                  onConfirm: () => handleDeleteStops(s.stop_id),
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedStops.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-muted-foreground text-sm"
                        >
                          Tidak ada data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4">
                <Pagination currentPage={stopsPage} totalItems={filteredStops.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setStopsPage} />
            </div>
            </>
          )}
          

          {/* ── TAB: RUTE ── */}
          {activeTab === "routes" && (
            <>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[20%]">
                        Nama Rute
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[15%]">
                        Transportasi
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[20%]">
                        Asal → Tujuan
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[30%]">
                        Urutan Halte (Route Stops)
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[8%]">
                        Status
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-4 whitespace-nowrap w-[7%]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedRoutes.map((r) => {
                      const trans = transList.find(
                        (t) => t.trans_id === r.trans_id,
                      );
                      return (
                        <tr
                          key={r.route_id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold">
                              {r.route_name}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {r.route_id}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">{trans?.name || "-"}</div>
                            <div className="text-xs text-muted-foreground">
                              {trans?.type || ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">
                                {r.origin_stop_name}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium">
                                {r.dest_stop_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {r.route_stops.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {r.route_stops.map((rs, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                                      {rs.stop_order}
                                    </span>
                                    <span className="text-muted-foreground truncate max-w-[120px]">
                                      {rs.stop_name}
                                    </span>
                                    <span className="text-muted-foreground flex-shrink-0">
                                      {rs.est_time_minutes} mnt
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${r.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                            >
                              {r.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => setRouteModal(r)}
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                                onClick={() =>
                                  setDeleteModal({
                                    name: r.route_name,
                                    onConfirm: () => handleDeleteRoute(r.route_id),
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedRoutes.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-muted-foreground text-sm"
                        >
                          Tidak ada data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4">
                <Pagination currentPage={routesPage} totalItems={filteredRoutes.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setRoutesPage} />
            </div>
            </> 
          )}
          
        </div>
      </main>

      {/* Modals */}
      {transModal && (
        <TransModal
          trans={transModal}
          onSave={handleSaveTrans}
          onClose={() => setTransModal(null)}
        />
      )}
      {stopModal && (
        <StopModal
          stop={stopModal}
          onSave={handleSaveStops}
          onClose={() => setStopModal(null)}
        />
      )}
      {routeModal && (
        <RouteModal
          route={routeModal}
          transList={transList}
          stopsList={stopsList}
          onSave={handleSaveRoute}
          onClose={() => setRouteModal(null)}
        />
      )}
      {deleteModal && (
        <DeleteModal
          name={deleteModal.name}
          onConfirm={deleteModal.onConfirm}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}