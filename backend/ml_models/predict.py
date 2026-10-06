import sys
import json
import os
import joblib
import pandas as pd
import warnings

# Matikan warning agar tidak mencemari output JSON yang akan dibaca Node.js
warnings.filterwarnings("ignore")

def main():
    try:
        # 1. Menentukan path lokasi model
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'model_klasifikasi_kepadatan.joblib')
        
        # 2. Load model
        _M = joblib.load(model_path)
        model = _M["model"]
        LABEL = _M["label"]
        FITUR = _M["fitur"]
        AMBANG_POTENSI_PADAT = 0.35
        
        # 3. Baca input dari Node.js
        input_data = sys.stdin.read()
        if not input_data:
            sys.exit(0)
            
        data = json.loads(input_data)
        items = data.get("items", [])
        
        hasil_prediksi = []
        
        for item in items:
            hari = item.get("hari")
            jam = item.get("jam")
            jenis = item.get("jenis") # MRT / LRT / Bus
            
            # --- EKSTRAKSI FITUR SESUAI MODEL TERBARU ---
            h, mnt = map(int, jam.split(":"))
            menit = h * 60 + mnt
            
            fitur_dict = {
                "is_weekend": int(hari in ("Sabtu", "Minggu")),
                "is_rush": int(360 <= menit < 540 or 960 <= menit < 1140), # 06:00-08:59 & 16:00-18:59
                "kendaraan_Bus": int(jenis == "Bus"),
                "kendaraan_LRT": int(jenis == "LRT"),
                "kendaraan_MRT": int(jenis == "MRT")
            }
            
            # Susun ke dalam DataFrame sesuai urutan FITUR dari model
            input_df = pd.DataFrame([fitur_dict])[FITUR]
            
            # Lakukan Prediksi
            p = model.predict_proba(input_df)[0]
            prob = {l: round(float(v) * 100) for l, v in zip(LABEL, p)}
            
            top_idx = int(p.argmax())
            top_class = LABEL[top_idx]
            
            teks = f"{top_class} ({prob[top_class]}%)"
            if top_class != "Padat" and p[2] >= AMBANG_POTENSI_PADAT:
                teks += f", berpotensi Padat ({prob['Padat']}%)"
                
            hasil_prediksi.append({
                "kepadatan": top_class,
                "detail": teks,
                "probabilitas": prob
            })
            
        # 4. Kirim hasil kembali ke Node.js
        print(json.dumps(hasil_prediksi))
        sys.exit(0)
        
    except Exception as e:
        # Lempar error ke stderr agar Node.js bisa mendeteksinya
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()