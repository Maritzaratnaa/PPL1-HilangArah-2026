import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import {
  User,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Heart,
  Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';

export default function SubscriptionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const planLabel = location.state?.planLabel || 'Paket Bulanan';
  const planAmount = location.state?.amount || 299000;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [domicile, setDomicile] = useState("");
  const [specificNeeds, setSpecificNeeds] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [guideGenderPref, setGuideGenderPref] = useState('');
  const [guideAgePref, setGuideAgePref] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customToastStyle = {
    className: "!bg-primary !text-primary-foreground border-none font-medium !text-[16px] !p-4",
  };

  const handleNameChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[a-zA-Z\s'.-]*$/.test(val)) {
      setter(val);
    }
  };

  const handlePhoneChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('0')) {
      val = val.substring(1); 
    }
    setter(val);
  };

  const handleProceedToPayment = async () => {
    if (!fullName || !phone || !gender || !domicile || !emergencyContactName || !emergencyContactPhone) {
      toast.error("Mohon isi semua field yang wajib (*)", customToastStyle);
      return;
    }
    if (!termsAgreed) {
      toast.error("Anda harus menyetujui syarat dan ketentuan", customToastStyle);
      return;
    }

    if (fullName.trim().toLowerCase() === emergencyContactName.trim().toLowerCase()) {
      toast.error("Nama Lengkap Anda dan Nama Kontak Darurat tidak boleh sama!", customToastStyle);
      return;
    }

    if (phone === emergencyContactPhone) {
      toast.error("Nomor Telepon Anda dan Nomor Telepon Darurat tidak boleh sama!", customToastStyle);
      return;
    }

    if (phone.length < 8 || phone.length > 15) {
      toast.error("Format Nomor Telepon Anda tidak valid (harus 8-15 digit angka).", customToastStyle);
      return;
    }

    if (emergencyContactPhone.length < 8 || emergencyContactPhone.length > 15) {
      toast.error("Format Nomor Telepon Darurat tidak valid (harus 8-15 digit angka).", customToastStyle);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Sesi Anda telah habis atau Anda belum login. Silakan login kembali.", customToastStyle);
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      let selectedPlan = location.state?.plan || 'Monthly'; 
      selectedPlan = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1).toLowerCase();

      const formattedPhone = `+62${phone}`;
      const formattedEmergencyPhone = `+62${emergencyContactPhone}`;

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: formattedEmergencyPhone,
          domicile: domicile,
          specific_needs: specificNeeds,
          duration: selectedPlan, 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('activePlanLabel', planLabel);
        localStorage.setItem('activePlanPeriod', location.state?.plan === 'daily' ? '1 Hari' : '1 Bulan');
        
        toast.success("Data berhasil disimpan! Mengarahkan ke pembayaran...", customToastStyle);
        
        navigate("/subscription/Payment", {
          state: {
            subs_id: data.subs_id,
            plan: selectedPlan,
            amount: planAmount,
            planLabel: planLabel,
          },
        });
      } else {
        toast.error(data.message || "Gagal memproses langganan.", customToastStyle);
        if (data.message && data.message.includes("sudah memiliki langganan")) {
          navigate("/subscription/Profile");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Terjadi kesalahan pada server. Silakan coba lagi nanti.", customToastStyle);
    } finally {
      setIsSubmitting(false);
    }
  };

  const domicileOptions = [
  { value: 'Jakarta Pusat', label: 'Jakarta Pusat', group: 'DKI JAKARTA' },
  { value: 'Jakarta Selatan', label: 'Jakarta Selatan', group: 'DKI JAKARTA' },
  { value: 'Jakarta Barat', label: 'Jakarta Barat', group: 'DKI JAKARTA' },
  { value: 'Jakarta Utara', label: 'Jakarta Utara', group: 'DKI JAKARTA' },
  { value: 'Jakarta Timur', label: 'Jakarta Timur', group: 'DKI JAKARTA' },
  { value: 'Tangerang', label: 'Tangerang', group: 'BANTEN' },
  { value: 'Tangerang Selatan', label: 'Tangerang Selatan', group: 'BANTEN' },
  { value: 'Serang', label: 'Serang', group: 'BANTEN' },
  { value: 'Cilegon', label: 'Cilegon', group: 'BANTEN' },
  { value: 'Lebak', label: 'Lebak', group: 'BANTEN' },
  { value: 'Pandeglang', label: 'Pandeglang', group: 'BANTEN' },
  { value: 'Bandung', label: 'Bandung', group: 'JAWA BARAT' },
  { value: 'Bekasi', label: 'Bekasi', group: 'JAWA BARAT' },
  { value: 'Depok', label: 'Depok', group: 'JAWA BARAT' },
  { value: 'Bogor', label: 'Bogor', group: 'JAWA BARAT' },
  { value: 'Cimahi', label: 'Cimahi', group: 'JAWA BARAT' },
  { value: 'Tasikmalaya', label: 'Tasikmalaya', group: 'JAWA BARAT' },
  { value: 'Cirebon', label: 'Cirebon', group: 'JAWA BARAT' },
  { value: 'Sukabumi', label: 'Sukabumi', group: 'JAWA BARAT' },
  { value: 'Sumedang', label: 'Sumedang', group: 'JAWA BARAT' },
  { value: 'Garut', label: 'Garut', group: 'JAWA BARAT' },
  { value: 'Semarang', label: 'Semarang', group: 'JAWA TENGAH' },
  { value: 'Surakarta', label: 'Surakarta (Solo)', group: 'JAWA TENGAH' },
  { value: 'Magelang', label: 'Magelang', group: 'JAWA TENGAH' },
  { value: 'Pekalongan', label: 'Pekalongan', group: 'JAWA TENGAH' },
  { value: 'Salatiga', label: 'Salatiga', group: 'JAWA TENGAH' },
  { value: 'Tegal', label: 'Tegal', group: 'JAWA TENGAH' },
  { value: 'Banyumas', label: 'Banyumas', group: 'JAWA TENGAH' },
  { value: 'Cilacap', label: 'Cilacap', group: 'JAWA TENGAH' },
  { value: 'Surabaya', label: 'Surabaya', group: 'JAWA TIMUR' },
  { value: 'Malang', label: 'Malang', group: 'JAWA TIMUR' },
  { value: 'Sidoarjo', label: 'Sidoarjo', group: 'JAWA TIMUR' },
  { value: 'Gresik', label: 'Gresik', group: 'JAWA TIMUR' },
  { value: 'Batu', label: 'Batu', group: 'JAWA TIMUR' },
  { value: 'Kediri', label: 'Kediri', group: 'JAWA TIMUR' },
  { value: 'Madiun', label: 'Madiun', group: 'JAWA TIMUR' },
  { value: 'Mojokerto', label: 'Mojokerto', group: 'JAWA TIMUR' },
  { value: 'Pasuruan', label: 'Pasuruan', group: 'JAWA TIMUR' },
  { value: 'Probolinggo', label: 'Probolinggo', group: 'JAWA TIMUR' },
  { value: 'Blitar', label: 'Blitar', group: 'JAWA TIMUR' },
];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-['Atkinson_Hyperlegible',_sans-serif]">
      <Navbar />

      <main className="flex-grow px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          {/* STEPPER */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-px bg-border z-0 mx-10 sm:mx-16" />

              {[
                { num: 1, label: "Isi Data", icon: "📋", active: true, completed: false },
                { num: 2, label: "Pembayaran", icon: "💳", active: false, completed: false },
                { num: 3, label: "Konfirmasi", icon: "✅", active: false, completed: false },
              ].map((step) => (
                <div key={step.num} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 flex-shrink-0 transition-all duration-300 ${
                    step.active
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-card border-border text-muted-foreground"
                  }`}>
                    <span className="font-bold text-sm">{step.num}</span>
                  </div>
                  <div className="text-center">
                    <p className={`text-[10px] sm:text-xs font-bold leading-tight ${step.active ? "text-primary" : "text-muted-foreground"}`}>
                      {step.icon} {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <h1 className="text-[32px] font-bold text-foreground leading-tight mb-2 tracking-tight">
              Lengkapi Profil Anda
            </h1>
            <p className="text-muted-foreground text-[16px] font-medium">
              Informasi ini membantu kami mencocokkan Anda dengan pemandu yang paling kompeten.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <Card className="bg-card border-border rounded-[var(--radius)] p-8 lg:p-10 shadow-sm">
                <div className="space-y-10">
                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-2.5 bg-accent/10 rounded-xl text-primary">
                        <User size={24} />
                      </div>
                      <h2 className="text-[20px] font-bold text-foreground">
                        Informasi Pribadi
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">
                          Nama Lengkap *
                        </Label>
                        <Input
                          value={fullName}
                          onChange={handleNameChange(setFullName)}
                          placeholder="Contoh: Budi Santoso"
                          className="h-12 border-input rounded-xl font-medium text-[16px]"
                          style={{ fontSize: '16px' }}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">
                          Nomor Telepon *
                        </Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold border-r pr-3" style={{ fontSize: '16px' }}>
                            +62
                          </span>
                          <Input
                            value={phone}
                            onChange={handlePhoneChange(setPhone)}
                            placeholder="812xxxxxx"
                            className="h-12 border-input rounded-xl font-medium text-[16px]"
                            style={{ fontSize: '16px', paddingLeft: '64px' }}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">
                          Jenis Kelamin *
                        </Label>
                        <Select value={gender} onValueChange={setGender} disabled={isSubmitting}>
                          <SelectTrigger className="h-12 border-input rounded-xl font-medium text-[16px]" style={{ fontSize: '16px' }}>
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                          <SelectContent style={{ fontSize: '16px' }}>
                            <SelectItem value="laki-laki" className="text-[16px] font-medium">Laki-laki</SelectItem>
                            <SelectItem value="perempuan" className="text-[16px] font-medium">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-[15px]">Domisili (Kota/Kabupaten) *</Label>
                        <SearchableDropdown
                          options={domicileOptions}
                          value={domicile}
                          onChange={setDomicile}
                          placeholder="Pilih Domisili"
                          searchPlaceholder="Cari kota..."
                          disabled={isSubmitting}
                          triggerClassName="h-12 rounded-xl text-[16px] font-medium"
                          dropdownClassName="text-[16px]"
                        />
                      </div>
                    </div>
                  </section>

                  <hr className="border-border" />

                  <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-2.5 bg-accent/10 rounded-xl text-primary">
                        <AlertCircle size={24} />
                      </div>
                      <h2 className="text-[20px] font-bold text-foreground">Layanan & Kebutuhan</h2>
                    </div>

                    <div>
                      <p className="font-bold text-foreground text-[16px] mb-4">
                        Preferensi Pemandu <span className="text-muted-foreground font-normal text-sm">(opsional)</span>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-semibold text-foreground text-[15px]">Jenis Kelamin Pemandu</Label>
                          <Select value={guideGenderPref} onValueChange={setGuideGenderPref} disabled={isSubmitting}>
                            <SelectTrigger className="h-12 border-input rounded-xl font-medium text-[16px]" style={{ fontSize: '16px' }}>
                              <SelectValue placeholder="Tidak ada preferensi" />
                            </SelectTrigger>
                            <SelectContent style={{ fontSize: '16px' }}>
                              <SelectItem value="none" className="text-[16px] font-medium">Tidak ada preferensi</SelectItem>
                              <SelectItem value="Laki-laki" className="text-[16px] font-medium">Laki-laki</SelectItem>
                              <SelectItem value="Perempuan" className="text-[16px] font-medium">Perempuan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold text-foreground text-[15px]">Rentang Usia Pemandu</Label>
                          <Select value={guideAgePref} onValueChange={setGuideAgePref} disabled={isSubmitting}>
                            <SelectTrigger className="h-12 border-input rounded-xl font-medium text-[16px]" style={{ fontSize: '16px' }}>
                              <SelectValue placeholder="Tidak ada preferensi" />
                            </SelectTrigger>
                            <SelectContent style={{ fontSize: '16px' }}>
                              <SelectItem value="none" className="text-[16px] font-medium">Tidak ada preferensi</SelectItem>
                              <SelectItem value="20-30" className="text-[16px] font-medium">20 - 30 tahun</SelectItem>
                              <SelectItem value="30-40" className="text-[16px] font-medium">31 - 40 tahun</SelectItem>
                              <SelectItem value="40-50" className="text-[16px] font-medium">41 - 50 tahun</SelectItem>
                              <SelectItem value="50+" className="text-[16px] font-medium">51 tahun ke atas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="needs" className="font-bold text-[15px]">Detail Kebutuhan Khusus <span className="text-muted-foreground font-normal text-sm">(opsional)</span></Label>
                      <Textarea
                        value={specificNeeds}
                        onChange={(e) => setSpecificNeeds(e.target.value)}
                        placeholder="Ceritakan bantuan khusus yang Anda perlukan..."
                        className="min-h-[120px] border-input rounded-xl p-4 font-medium text-[16px]"
                        disabled={isSubmitting}
                      />
                    </div>
                  </section>

                  <hr className="border-border" />

                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-2.5 bg-accent/10 rounded-xl text-primary">
                        <Heart size={24} />
                      </div>
                      <h2 className="text-[20px] font-bold text-foreground">
                        Kontak Darurat
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">
                          Nama Kontak Darurat *
                        </Label>
                        <Input
                          value={emergencyContactName}
                          onChange={handleNameChange(setEmergencyContactName)}
                          placeholder="Nama keluarga atau wali"
                          className="h-12 border-input rounded-xl font-medium text-[16px]"
                          style={{ fontSize: '16px' }}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">
                          Nomor Telepon Darurat *
                        </Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold border-r pr-3" style={{ fontSize: '16px' }}>
                            +62
                          </span>
                          <Input
                            value={emergencyContactPhone}
                            onChange={handlePhoneChange(setEmergencyContactPhone)}
                            placeholder="812xxxxxx"
                            className="h-12 border-input rounded-xl font-medium text-[16px]"
                            style={{ fontSize: '16px', paddingLeft: '64px' }}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="space-y-6 pt-4">
                    <div className="flex items-start gap-4 bg-muted/30 p-6 rounded-2xl border border-border">
                      <Checkbox
                        id="terms"
                        checked={termsAgreed}
                        onCheckedChange={(c) => setTermsAgreed(c as boolean)}
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                      <Label
                        htmlFor="terms"
                        className="font-medium text-muted-foreground text-[16px] cursor-pointer leading-relaxed"
                      >
                        Saya menyetujui{" "}
                        <span className="text-primary font-bold underline underline-offset-4">
                          Syarat & Ketentuan
                        </span>{" "}
                        serta{" "}
                        <span className="text-primary font-bold underline underline-offset-4">
                          Kebijakan Privasi
                        </span>{" "}
                        ARAHIN.
                      </Label>
                    </div>

                    <Button
                      onClick={handleProceedToPayment}
                      disabled={isSubmitting}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-auto min-h-[56px] py-4 px-6 rounded-2xl font-bold text-[18px] transition-all"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                          <span className="whitespace-nowrap">
                            Memproses Data...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 leading-snug">
                          <span className="text-center whitespace-normal break-words">
                            Konfirmasi & Lanjut ke Pembayaran
                          </span>
                          <ArrowRight size={20} className="shrink-0" />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Summary Card */}
            <div className="lg:col-span-4 lg:sticky lg:top-10">
              <Card className="bg-card border-border rounded-[var(--radius)] p-7 shadow-sm flex flex-col">
                <h3 className="text-[18px] font-bold text-foreground mb-6">Ringkasan Langganan</h3>
                <div className="flex items-center gap-4 mb-8 p-5 bg-muted/30 rounded-2xl border border-border">
                  <div className="w-14 h-14 bg-background rounded-xl shadow-sm flex items-center justify-center text-[24px]">🧭</div>
                  <div>
                    <p className="text-[12px] font-bold text-primary uppercase tracking-wider">
                      {planLabel}
                    </p>
                    <p className="font-bold text-foreground text-[16px]">Akses Pemandu Pribadi</p>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-muted-foreground font-medium text-[16px]">
                    <span>Harga Paket</span>
                    <span className="font-bold text-foreground">
                      Rp {planAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground font-medium text-[16px]">
                    <span>Durasi</span>
                    <span className="font-bold text-foreground">
                      {location.state?.plan === 'daily' ? '1 Hari' : location.state?.plan === 'weekly' ? '7 Hari' : '1 Bulan'}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-dashed border-border flex justify-between items-center">
                    <span className="font-bold text-foreground text-[16px]">Total Tagihan</span>
                    <span className="text-[22px] font-bold text-primary">
                      Rp {planAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <div className="space-y-3.5 pt-6 border-t border-border">
                  {['1 Pemandu Terverifikasi', 'Perjalanan Tak Terbatas', 'Support Prioritas 24/7'].map((b, i) => (
                    <div key={i} className="flex items-center gap-3 text-[14px] font-bold text-muted-foreground">
                      <ShieldCheck size={18} className="text-primary" />
                      {b}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}