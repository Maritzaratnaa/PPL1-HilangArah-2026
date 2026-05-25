import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Zap,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Menggunakan komponen Sidebar yang sudah kamu buat sebelumnya
import { AdminSidebar } from '@/components/Admin/AdminSideBar';

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AdminDashboard() {
  // State untuk menyimpan data dari API
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    newReports: 0
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [userCategoryData, setUserCategoryData] = useState<any[]>([]);

  // --- 燥 LOGIKA FETCHING DATA API 燥 ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch('http://localhost:3000/api/admin/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const json = await res.json();
        
        if (res.ok) {
          setStats({
            totalUsers: json.data.stats.total_users,
            activeSubscriptions: json.data.stats.active_subscriptions,
            newReports: json.data.stats.new_reports
          });

          const formattedReports = json.data.recent_reports.map((r: any) => ({
            id: r.report_id,
            user: r.reporter_name || 'Pengguna',
            type: r.category,
            status: r.status,
            date: new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          }));
          setRecentReports(formattedReports);

          const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#64748b'];
          const mappedCategories = json.data.user_categories.map((cat: any, index: number) => ({
            name: cat.name,
            value: cat.value,
            color: COLORS[index % COLORS.length]
          }));
          setUserCategoryData(mappedCategories);
        }
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const pieTotalUsers = userCategoryData.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse text-lg font-semibold">Memuat Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      {/* Tambahkan overflow-x-hidden agar main content tidak merusak layout saat zoom */}
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 md:p-8">

          {/* Header - Responsif untuk zoom (flex-wrap) */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="min-w-[280px]">
              <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
              <p className="text-muted-foreground text-sm">Selamat datang kembali, berikut statistik platform hari ini.</p>
            </div>
          </div>

          {/* Stats Grid - Adaptif grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Pengguna */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6 gap-2 flex-wrap">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full whitespace-nowrap">
                  <ArrowUpRight className="h-3 w-3" /> +12%
                </span>
              </div>
              <div className="overflow-hidden">
                <div className="text-2xl md:text-3xl font-bold tracking-tight mb-1 truncate">{stats.totalUsers.toLocaleString('id-ID')}</div>
                <div className="text-[10px] md:text-[11px] text-muted-foreground font-bold uppercase tracking-wider truncate">Total Pengguna</div>
              </div>
            </div>

            {/* Berlangganan Aktif */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6 gap-2 flex-wrap">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full whitespace-nowrap">
                  <ArrowUpRight className="h-3 w-3" /> +5.4%
                </span>
              </div>
              <div className="overflow-hidden">
                <div className="text-2xl md:text-3xl font-bold tracking-tight mb-1 truncate">{stats.activeSubscriptions.toLocaleString('id-ID')}</div>
                <div className="text-[10px] md:text-[11px] text-muted-foreground font-bold uppercase tracking-wider truncate">Berlangganan Aktif</div>
              </div>
            </div>

            {/* Laporan Baru */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-start mb-6 gap-2 flex-wrap">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex-shrink-0">
                  <FileText className="h-5 w-5 text-rose-600" />
                </div>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-rose-700 bg-rose-100 dark:bg-rose-900/30 px-2 py-1 rounded-full whitespace-nowrap">
                  <ArrowDownRight className="h-3 w-3" /> -2%
                </span>
              </div>
              <div className="overflow-hidden">
                <div className="text-2xl md:text-3xl font-bold tracking-tight mb-1 truncate">{stats.newReports.toLocaleString('id-ID')}</div>
                <div className="text-[10px] md:text-[11px] text-muted-foreground font-bold uppercase tracking-wider truncate">Laporan Baru (24j)</div>
              </div>
            </div>
          </div>

          {/* Second Row: Reports - Menggunakan Horizontal Scroll Wrapper */}
          <div className="mb-8">
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-sm">Laporan Terbaru</h3>
                <Link to="/admin/reports" className="text-xs text-primary font-semibold hover:underline">Lihat Semua</Link>
              </div>
              
              <div className="overflow-x-auto w-full scrollbar-thin">
                {recentReports.length > 0 ? (
                  <table className="w-full min-w-[600px]">
                    <tbody className="divide-y divide-border">
                      {recentReports.map((report) => (
                        <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold">{report.user}</div>
                            <div className="text-xs text-muted-foreground">{report.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              report.status === 'Selesai'
                                ? 'bg-emerald-100 text-emerald-700'
                                : report.status === 'Diproses'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                            {report.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Belum ada laporan terbaru.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Third Row: Distribusi Kategori Pengguna */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-sm">Distribusi Kategori Pengguna</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Berdasarkan {pieTotalUsers.toLocaleString('id-ID')} pengguna terdaftar</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>

            {userCategoryData.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* Pie Chart Container - Ukuran tetap agar tidak distorsi saat zoom */}
                <div className="flex-shrink-0" style={{ width: 260, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userCategoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={44}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomLabel}
                      >
                        {userCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          `${value} pengguna (${((value / pieTotalUsers) * 100).toFixed(1)}%)`,
                          name,
                        ]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend + Detail - Grid Responsif */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {userCategoryData.map((item) => {
                    const pct = pieTotalUsers > 0 ? ((item.value / pieTotalUsers) * 100).toFixed(1) : 0;
                    return (
                      <div key={item.name} className="flex items-start justify-between gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                        <div className="flex items-start gap-3 min-w-0">
                          <div 
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1" 
                            style={{ backgroundColor: item.color }} 
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-semibold text-foreground leading-tight truncate">{item.name}</span>
                            <span className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap">
                              {item.value.toLocaleString('id-ID')} pengguna
                            </span>
                          </div>
                        </div>
                        <span className="text-[13px] font-bold text-muted-foreground whitespace-nowrap">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Data kategori pengguna tidak tersedia.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}