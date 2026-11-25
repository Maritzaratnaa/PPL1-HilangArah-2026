/**
 * Layanan & Helper Pengelolaan Step Guide ARAHIN
 * Mengatur pelacakan modul yang pertama kali diakses oleh pengguna baru
 * serta spesialisasi reset step guide setiap kali login untuk akun tester.
 */

export const EMAIL_TESTER = [
  "tester.arahin@gmail.com",
  "tester.arahin1@gmail.com",
];

/**
 * Cek apakah sebuah alamat email terdaftar sebagai akun tester
 */
export function isTesterEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return EMAIL_TESTER.some((tester) => tester.toLowerCase() === cleanEmail);
}

/**
 * Mengambil email pengguna aktif saat ini dari localStorage
 */
export function getCurrentUserEmail(): string {
  try {
    return (localStorage.getItem("userEmail") || "guest").trim().toLowerCase();
  } catch {
    return "guest";
  }
}

/**
 * Reset seluruh riwayat panduan pengguna.
 * Dipanggil otomatis setiap kali akun tester melakukan login,
 * sehingga semua step guide di setiap modul akan muncul kembali.
 */
export function resetUserGuides(email?: string | null): void {
  try {
    const targetEmail = (email || getCurrentUserEmail()).trim().toLowerCase();
    const prefix = `arahin_guide_${targetEmail}_`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(prefix) || key === `arahin_completed_modules_${targetEmail}`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(`arahin_tester_reset_at_${targetEmail}`, Date.now().toString());
  } catch (err) {
    console.error("Gagal mereset status step guide:", err);
  }
}

/**
 * Cek apakah panduan untuk modul tertentu sudah pernah diselesaikan oleh pengguna
 */
export function isGuideCompleted(moduleName: string, email?: string | null): boolean {
  try {
    const targetEmail = (email || getCurrentUserEmail()).trim().toLowerCase();
    const key = `arahin_guide_${targetEmail}_${moduleName}`;
    const status = localStorage.getItem(key);
    return status === "true" || status === "completed";
  } catch {
    return false;
  }
}

/**
 * Tandai bahwa panduan untuk modul tertentu telah selesai atau dilewati oleh pengguna
 */
export function setGuideCompleted(moduleName: string, email?: string | null): void {
  try {
    const targetEmail = (email || getCurrentUserEmail()).trim().toLowerCase();
    const key = `arahin_guide_${targetEmail}_${moduleName}`;
    localStorage.setItem(key, "true");
  } catch (err) {
    console.error("Gagal menyimpan status step guide:", err);
  }
}

/**
 * Reset status modul tertentu secara spesifik (misal jika user klik "Ulangi Panduan")
 */
export function resetModuleGuide(moduleName: string, email?: string | null): void {
  try {
    const targetEmail = (email || getCurrentUserEmail()).trim().toLowerCase();
    const key = `arahin_guide_${targetEmail}_${moduleName}`;
    localStorage.removeItem(key);
  } catch (err) {
    console.error("Gagal mereset modul step guide:", err);
  }
}
