from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import os
import webbrowser
from threading import Timer

app = Flask(__name__)

# Load Model Decision Tree Regressor
MODEL_PATH = os.path.join('model', 'model_DT.pkl')
model = None

def load_ml_model():
    global model
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
            print("✅ Model Machine Learning berhasil dimuat di app.py!")
    else:
        print("⚠️ File model_DT.pkl belum ada. Silakan jalankan 'python getmodel.py' terlebih dahulu.")

load_ml_model()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict_api', methods=['POST'])
def predict_api():
    """API Endpoint untuk kalkulasi prediksi AI via AJAX / JavaScript"""
    try:
        data = request.get_json()
        sqft = float(data.get('sqft_living', 1800))
        grade = float(data.get('grade', 7))
        bedrooms = float(data.get('bedrooms', 3))
        bathrooms = float(data.get('bathrooms', 2))
        floors = float(data.get('floors', 2))
        yr_built = float(data.get('yr_built', 2015))

        if model is not None:
            input_array = np.array([[sqft, grade, bedrooms, bathrooms, floors, yr_built]])
            raw_usd_price = model.predict(input_array)[0]
            
            # Konversi hasil prediksi dataset Kaggle (USD) ke Rupiah (Kurs ~Rp 16.000)
            KURS_USD_IDR = 16000
            predicted_price = raw_usd_price * KURS_USD_IDR
        else:
            # Fallback perhitungan simulasi jika file model .pkl belum di-generate
            base_price = 800000000
            predicted_price = (base_price + (sqft * 1250000) + (bedrooms * 100000000)) * ((grade/7)**2)

        price_per_sqft = round(predicted_price / sqft)

        # Penentuan Status Pasar
        if price_per_sqft < 1500000:
            status = "Underpriced (Potensi Untung Tinggi)"
            status_class = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
        elif price_per_sqft <= 3000000:
            status = "Fair Market Value (Harga Wajar)"
            status_class = "bg-blue-500/20 text-blue-300 border border-blue-500/30"
        else:
            status = "Overpriced (Nilai Di Atas Rata-rata)"
            status_class = "bg-rose-500/20 text-rose-300 border border-rose-500/30"

        return jsonify({
            'success': True,
            'predicted_price': round(predicted_price),
            'price_per_sqft': price_per_sqft,
            'status': status,
            'status_class': status_class
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

def open_browser():
    """Membuka halaman website secara otomatis di browser"""
    webbrowser.open_new("http://127.0.0.1:5000")

if __name__ == '__main__':
    # Mencegah browser terbuka 2x saat mode debug aktif
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        Timer(1.25, open_browser).start()
    app.run(debug=True, port=5000)