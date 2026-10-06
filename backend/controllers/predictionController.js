const { spawn } = require('child_process');
const path = require('path');
const db = require('../db'); 

const SCRIPT = path.join(__dirname, '..', 'ml_models', 'predict.py');
const PYTHON = process.env.PYTHON_BIN || 'python3';

// Fungsi fetch cuaca real-time menggunakan OpenWeatherMap
async function getRealtimeWeather() {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    const lat = -6.2088; // Koordinat default Jakarta
    const lon = 106.8456;
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=id`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.weather && data.weather.length > 0) {
      const desc = data.weather[0].description;
      return desc.charAt(0).toUpperCase() + desc.slice(1);
    }
    return "Cerah"; 
  } catch (err) {
    console.error("Gagal ambil cuaca:", err.message);
    return "Cerah Berawan";
  }
}

function normalizeVehicle(t) {
  const s = String(t || '').toLowerCase();
  if (s.includes('mrt')) return 'MRT';
  if (s.includes('lrt')) return 'LRT';
  if (s.includes('bus') || s.includes('brt') || s.includes('transjakarta')) return 'Bus';
  return null; 
}

function hariJamWIB(offsetMenit = 0) {
  const d = new Date(Date.now() + offsetMenit * 60000);
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', weekday: 'long',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t) => (parts.find((p) => p.type === t) || {}).value || '';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return { hari: cap(get('weekday')), jam: `${get('hour')}:${get('minute')}` };
}

function runPython(items) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, [SCRIPT]);
    let out = '', err = '';
    const timer = setTimeout(() => { proc.kill(); reject(new Error('Timeout')); }, 15000);
    
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (err += d.toString()));
    
    proc.on('error', (e) => { clearTimeout(timer); reject(e); });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(err || `Python exit ${code}`));
      try { 
        resolve(JSON.parse(out)); 
      } catch (e) { 
        reject(new Error(`Output JSON tidak valid dari Python: ${out}`)); 
      }
    });
    
    proc.stdin.write(JSON.stringify({ items }));
    proc.stdin.end();
  });
}

exports.getRoutePrediction = async (req, res) => {
  console.log("\n[API HIT] === ADA REQUEST MASUK KE API PREDIKSI ===");
  try {
    const legs = Array.isArray(req.body.legs) ? req.body.legs : [];
    const data = new Array(legs.length).fill(null);
    const items = [];
    const idx = [];
    
    // Ambil data cuaca real-time secara paralel
    const cuacaRealtime = await getRealtimeWeather();

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      if (!leg.route_id) continue;

      // Menggunakan tabel 'trans' sesuai struktur database Anda
      const query = `
        SELECT t.type AS jenis_kendaraan 
        FROM routes r 
        JOIN trans t ON r.trans_id = t.trans_id 
        WHERE r.route_name = ?
      `;
      const [rows] = await db.query(query, [leg.route_id]);

      if (rows.length > 0) {
        const dbJenis = rows[0].jenis_kendaraan;
        const jenis = normalizeVehicle(dbJenis);
        
        if (jenis) {
          const { hari, jam } = hariJamWIB(Number(leg.offset_menit) || 0);
          items.push({ hari, jam, jenis });
          idx.push(i);
        } else {
          console.log(`[DEBUG] Rute "${leg.route_id}" diabaikan (Tipe armada: ${dbJenis})`);
        }
      } else {
         console.log(`[DEBUG] Rute "${leg.route_id}" tidak ditemukan di database.`);
      }
    }

    if (items.length > 0) {
      console.log(`[DEBUG] Mengirim ${items.length} skenario prediksi ke Python...`);
      const results = await runPython(items);
      results.forEach((r, k) => { data[idx[k]] = r; });
    }
    
    // Kirim hasil prediksi dan data cuaca ke frontend
    res.json({ 
      success: true, 
      data, 
      cuaca: cuacaRealtime 
    });
  } catch (err) {
    console.error('Gagal prediksi kepadatan:', err.message);
    res.status(500).json({ success: false, message: 'Prediksi kepadatan gagal' });
  }
};