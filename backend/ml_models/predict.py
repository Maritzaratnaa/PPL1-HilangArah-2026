import sys
import json
import os
import joblib
import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings("ignore")

# Mapping dan Konfigurasi Fitur V4
HARI = {"senin": 0, "selasa": 1, "rabu": 2, "kamis": 3, "jumat": 4, "jum'at": 4, "sabtu": 5, "minggu": 6}
KAT = ["route_id", "jenis_kendaraan", "halte_id", "kondisi_cuaca", "status_lalu_lintas", "event"]
KOLOM_RIWAYAT = ["headway_menit", "keterisian_sebelumnya_1", "keterisian_sebelumnya_2",
                 "penumpang_naik_halte_sebelumnya", "penumpang_turun_halte_sebelumnya"]

def build_features(d, kategori=None):
    """Ekstraksi fitur berdasarkan Kepadatan Penumpang v4"""
    out = pd.DataFrame(index=d.index)
    
    dow = d["hari"].astype(str).str.strip().str.lower().map(HARI)
    hm = d["jam"].astype(str).str.extract(r"^(\d{1,2})[:.](\d{2})").astype(float)
    menit = hm[0] * 60 + hm[1]
    
    out["hari_dow"] = dow
    out["jam_menit"] = menit
    out["jam_sin"] = np.sin(2 * np.pi * menit / 1440)
    out["jam_cos"] = np.cos(2 * np.pi * menit / 1440)
    out["is_weekend"] = (dow >= 5).astype(int)
    out["is_rush"] = (((menit >= 360) & (menit < 540)) | ((menit >= 960) & (menit < 1140))).astype(int)
    
    out["hari_libur"] = d.get("hari_libur", 0)
    
    # Pengolahan kategori
    for c in KAT:
        if c in d.columns:
            s = d[c].astype(str).str.strip()
            out[c] = pd.Categorical(s, categories=(kategori[c] if kategori else sorted(s.unique())))
        else:
            out[c] = pd.Categorical([np.nan]*len(d), categories=kategori[c] if kategori else [])
            
    # Kolom numerik dan riwayat
    for c in ["urutan_halte", "jumlah_halte_rute", "jumlah_rute_di_halte", "eta_kedatangan_menit", "waktu_tempuh_menit"] + KOLOM_RIWAYAT:
        out[c] = d[c].values if c in d.columns else np.nan
        
    out["posisi_rute"] = out["urutan_halte"] / out["jumlah_halte_rute"]
    return out

def main():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Pastikan merujuk pada model iterasi ke-4
        model_path = os.path.join(current_dir, 'model_klasifikasi_kepadatan_v4.joblib')
        
        _M = joblib.load(model_path)
        model = _M["model"]
        LABEL = _M["label"]
        FITUR = _M["fitur"]
        KATEGORI = _M["kategori"]
        AMBANG_PADAT = _M.get("ambang_padat", 0.32) 
        
        input_data = sys.stdin.read()
        if not input_data:
            sys.exit(0)
            
        data = json.loads(input_data)
        items = data.get("items", [])
        hasil_prediksi = []
        
        if items:
            # Bangun dataframe secara batch untuk seluruh leg halte keberangkatan
            df_input = pd.DataFrame(items)
            x = build_features(df_input, kategori=KATEGORI)[FITUR]
            
            probs = model.predict_proba(x)
            
            for p in probs:
                prob_dict = {l: round(float(v) * 100) for l, v in zip(LABEL, p)}
                top_idx = int(p.argmax())
                top_class = LABEL[top_idx]
                
                teks = f"{top_class} ({prob_dict[top_class]}%)"
                # Labeling peringatan potensi padat sesuai ambang model
                if top_class != "Padat" and p[2] >= AMBANG_PADAT:
                    teks += f", berpotensi Padat ({prob_dict['Padat']}%)"
                    
                hasil_prediksi.append({
                    "kepadatan": top_class,
                    "detail": teks,
                    "probabilitas": prob_dict
                })
                
        print(json.dumps(hasil_prediksi))
        sys.exit(0)
        
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()