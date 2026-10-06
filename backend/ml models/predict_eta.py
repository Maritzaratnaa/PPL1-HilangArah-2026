import os
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'eta_model.joblib')

model = joblib.load(MODEL_PATH)
print("Model ETA berhasil dimuat dari:", MODEL_PATH)

TRAFFIC_MAP = {
    'Lancar': 0,
    'Padat Merayap': 1,
    'Macet': 2
}

WEATHER_MAP = {
    'Cerah': 0,
    'Berawan': 1,
    'Hujan Ringan': 2
}

@app.route('/predict-eta', methods=['POST'])
def predict_eta():
    try:
        data = request.json or {}
        
        status_lalu_lintas = data.get('status_lalu_lintas', 'Lancar')
        kondisi_cuaca = data.get('kondisi_cuaca', 'Cerah')
        waktu_tempuh_menit = float(data.get('waktu_tempuh_menit', 10))
        
        traffic_encoded = TRAFFIC_MAP.get(status_lalu_lintas, 0)
        weather_encoded = WEATHER_MAP.get(kondisi_cuaca, 0)
        
        features = np.array([[traffic_encoded, weather_encoded, waktu_tempuh_menit]])
        
        eta = model.predict(features)[0]
        
        return jsonify({
            'success': True,
            'eta_minutes': round(float(eta), 1)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)