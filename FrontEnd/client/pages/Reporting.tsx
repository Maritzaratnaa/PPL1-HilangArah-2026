import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Plus,
  ArrowRight,
  ShieldAlert,
  Inbox,
  Sparkles,
  X,
  Calendar,
  Mail,
  Loader2
} from 'lucide-react';

const BASE_URL = 'http://localhost:3000';

interface Report {
  report_id: string;
  category: string;
  description: string;
  status: 'Pending' | 'Processed' | 'Resolved';
  stop_id: string | null;
  subs_id: string | null;
  resolved_by: string | null;
  created_at: string;
}

// Kategori disesuaikan dengan ENUM backend: 'Fasilitas' | 'Pemandu'
const reportCategories = [
  { value: 'Fasilitas', label: 'Fasilitas', icon: '🏗️', color: 'bg-blue-100 text-blue-700' },
  { value: 'Pemandu', label: 'Pemandu', icon: '🧭', color: 'bg-orange-100 text-orange-700' },
];

const statusConfig = {
  Pending: { label: 'Menunggu', color: 'bg-amber-100 text-amber-700', icon: Clock },
  Processed: { label: 'Diproses', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  Resolved: { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export default function Reporting() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch riwayat laporan saat halaman dibuka
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchReports();
  }, [navigate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/reports/my-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setReports(json.data);
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      setErrorMsg('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!category || description.length < 10) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category, description }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccessMessage(true);
        setShowForm(false);
        setCategory('');
        setDescription('');
        setTimeout(() => setSuccessMessage(false), 4000);
        fetchReports(); // refresh list
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert('Gagal menghubungi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports = reports.filter((r) =>
    filterStatus === 'all' ||
    (filterStatus === 'pending' && r.status === 'Pending') ||
    (filterStatus === 'resolved' && r.status === 'Resolved')
  );

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-['Atkinson_Hyperlegible',_sans-serif]">
      <Navbar />

      <main className="flex-grow px-6 py-12 lg:px-10">
        <div className="mx-auto max-w-5xl">

          {/* SUCCESS BANNER */}
          {successMessage && (
            <div className="mb-8 p-5 bg-green-50 border border-green-200 rounded-[24px] flex items-center justify-between animate-in zoom-in duration-300 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 text-white p-2 rounded-full shadow-sm">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="font-bold text-green-800 text-[16px]">Laporan Berhasil Dikirim!</p>
                  <p className="text-green-700 text-[14px]">Terima kasih, tim kami akan segera menindaklanjuti.</p>
                </div>
              </div>
              <Sparkles className="text-green-400" size={24} />
            </div>
          )}

          {/* HEADER */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-[32px] font-bold text-foreground leading-tight tracking-tight">Pusat Bantuan ARAHIN</h1>
              <p className="text-muted-foreground text-[16px] font-medium mt-1">Kelola laporan kendala Anda di sini.</p>
            </div>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 rounded-2xl font-bold text-[16px] shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus size={20} strokeWidth={3} /> Buat Laporan
              </Button>
            )}
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              { label: 'Total Laporan', value: stats.total, icon: Inbox, color: 'text-primary' },
              { label: 'Menunggu', value: stats.pending, icon: Clock, color: 'text-amber-500' },
              { label: 'Selesai', value: stats.resolved, icon: CheckCircle, color: 'text-green-500' },
            ].map((s, i) => (
              <Card key={i} className="p-6 border-border rounded-[24px] flex items-center gap-5 shadow-sm">
                <div className={`p-3 rounded-xl bg-muted/50 ${s.color}`}><s.icon size={24} /></div>
                <div>
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                  <p className="text-[26px] font-bold text-foreground leading-none mt-1">{s.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* FORM CARD */}
          {showForm && (
            <Card className="mb-12 bg-card border-primary/20 rounded-[28px] p-8 lg:p-10 shadow-xl border-2 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary"><ShieldAlert size={24} /></div>
                <h2 className="text-[22px] font-bold text-foreground">Form Laporan Kendala</h2>
              </div>
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-[15px] font-bold text-foreground ml-1">Kategori Masalah</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-14 border-border rounded-2xl font-medium text-[16px]">
                      <SelectValue placeholder="Pilih kategori kendala" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {reportCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="py-3">
                          <span className="mr-2">{cat.icon}</span> {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[15px] font-bold text-foreground ml-1">Deskripsi Masalah</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ceritakan kendala Anda secara detail..."
                    className="min-h-[140px] border-border rounded-2xl p-5 font-medium text-[16px] leading-relaxed focus:ring-primary"
                    maxLength={500}
                  />
                  <p className="text-[13px] text-muted-foreground text-right">{description.length}/500 karakter</p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="ghost" onClick={() => setShowForm(false)} className="h-12 px-6 rounded-xl font-bold">Batal</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !category || description.length < 10}
                    className="bg-primary text-primary-foreground h-12 px-10 rounded-xl font-bold">
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mengirim...</> : 'Kirim Laporan'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* LIST SECTION */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" /> Riwayat Laporan
              </h2>
              <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border">
                {['all', 'pending', 'resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-5 py-1.5 rounded-xl text-[13px] font-bold transition-all ${
                      filterStatus === st ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {st === 'all' ? 'Semua' : st === 'pending' ? 'Menunggu' : 'Selesai'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : errorMsg ? (
              <Card className="p-12 border-dashed border-2 border-border rounded-[28px] bg-muted/10 text-center">
                <AlertCircle className="text-rose-500 mx-auto mb-4" size={40} />
                <p className="font-bold text-foreground">{errorMsg}</p>
              </Card>
            ) : filteredReports.length === 0 ? (
              <Card className="p-20 border-dashed border-2 border-border rounded-[28px] bg-muted/10 text-center">
                <Inbox className="text-muted-foreground mx-auto mb-4" size={40} />
                <p className="font-bold text-foreground">Belum Ada Laporan</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredReports.map((report) => {
                  const cat = reportCategories.find(c => c.value === report.category);
                  const status = statusConfig[report.status] || statusConfig['Pending'];
                  const StatusIcon = status.icon;

                  return (
                    <Card
                      key={report.report_id}
                      onClick={() => setSelectedReport(report)}
                      className="bg-card border-border rounded-[24px] p-6 hover:border-primary/50 transition-all shadow-sm group cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[24px] flex-shrink-0 ${cat?.color || 'bg-gray-100 text-gray-700'}`}>
                            {cat?.icon || '📋'}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
                                #{report.report_id.slice(0, 8).toUpperCase()}
                              </span>
                              <Badge className={`${status.color} border-none font-bold text-[11px] rounded-lg px-2.5 py-0.5 flex items-center gap-1.5`}>
                                <StatusIcon size={12} strokeWidth={3} /> {status.label}
                              </Badge>
                            </div>
                            <h3 className="font-bold text-foreground text-[17px] mb-1 group-hover:text-primary transition-colors">
                              {cat?.label || report.category}
                            </h3>
                            <p className="text-muted-foreground text-[15px] font-medium line-clamp-1">{report.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end border-t md:border-t-0 border-border pt-4 md:pt-0">
                          <div className="md:text-right">
                            <p className="text-[14px] font-bold text-foreground">
                              {new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[12px] font-medium text-muted-foreground">
                              Pukul {new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <ArrowRight className="ml-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" size={22} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* DETAIL MODAL */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl rounded-[32px] p-8 lg:p-10 border-border bg-card font-['Atkinson_Hyperlegible']">
          {selectedReport && (() => {
            const cat = reportCategories.find(c => c.value === selectedReport.category);
            const status = statusConfig[selectedReport.status] || statusConfig['Pending'];
            return (
              <>
                <DialogHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-bold text-muted-foreground tracking-widest uppercase">
                        #{selectedReport.report_id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge className={`${status.color} border-none font-bold text-[12px] px-3 py-1 rounded-lg`}>
                        {status.label}
                      </Badge>
                    </div>
                    <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                      <X size={20} className="text-muted-foreground" />
                    </button>
                  </div>
                  <DialogTitle className="text-[28px] font-bold text-foreground">
                    Detail Laporan {cat?.label || selectedReport.category}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-8 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-2">
                        <Calendar size={12} className="text-primary" /> Tanggal Laporan
                      </p>
                      <p className="font-bold text-foreground text-[15px]">
                        {new Date(selectedReport.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-2">
                        <ShieldAlert size={12} className="text-primary" /> Kategori
                      </p>
                      <p className="font-bold text-foreground text-[15px]">{cat?.label || selectedReport.category}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[14px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={14} className="text-primary" /> Deskripsi Lengkap
                    </h4>
                    <div className="p-6 bg-muted/20 border border-border rounded-2xl">
                      <p className="text-[16px] font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedReport.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-primary/5 border border-primary/10 rounded-2xl">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-foreground">Informasi Penanganan</p>
                      <p className="text-[14px] font-medium text-muted-foreground leading-relaxed mt-1">
                        {selectedReport.status === 'Pending'
                          ? "Laporan Anda telah kami terima dan sedang mengantre untuk diperiksa oleh tim Support ARAHIN. Kami akan memprosesnya dalam waktu maksimal 1x24 jam."
                          : selectedReport.status === 'Processed'
                          ? "Tim kami sedang menangani kendala ini. Harap tunggu pemberitahuan lebih lanjut."
                          : "Kendala ini telah berhasil diselesaikan. Silakan hubungi pusat bantuan jika masih ada masalah."}
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={() => setSelectedReport(null)}
                    className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-bold text-[17px]"
                  >
                    Tutup Rincian
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}