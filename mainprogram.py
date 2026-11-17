import getmodel  
import pickle
import os
import numpy as np

"""
Program Terminal (CLI) untuk menguji prediksi harga rumah secara interaktif di konsol/terminal VS Code.
"""

def load_model():
    file_path = os.path.join('model', 'model_DT.pkl')
    if not os.path.exists(file_path):
        print(f"⚠️ Model tidak ditemukan di: {file_path}. Melatih model baru...")
        getmodel.main()

    try:
        with open(file_path, 'rb') as file:
            model = pickle.load(file)
        print("✅ Model Decision Tree berhasil dimuat.")
        return model
    except Exception as e:
        print(f"❌ Terjadi kesalahan saat memuat model: {e}")
        return None

def input_data():
    print("\n-------------------------------------------")
    print("🏠 PROPVALUE AI - INPUT SPESIFIKASI RUMAH")
    print("-------------------------------------------")
    sqft = float(input('Luas Bangunan (sqft, ex: 1800): '))
    grade = float(input('Tingkat Konstruksi / Grade (1-13, ex: 7): '))
    bedrooms = float(input('Jumlah Kamar Tidur (ex: 3): '))
    bathrooms = float(input('Jumlah Kamar Mandi (ex: 2): '))
    floors = float(input('Jumlah Lantai (ex: 1): '))
    yr_built = float(input('Tahun Bangunan (ex: 2015): '))
    
    return [sqft, grade, bedrooms, bathrooms, floors, yr_built]

def main():
    model = load_model()
    if model is not None:
        user_input = input_data()
        input_array = np.array(user_input).reshape(1, -1)
        raw_usd_price = model.predict(input_array)[0]
        
        # Konversi hasil prediksi (USD) ke Rupiah (Kurs ~Rp 16.000)
        KURS_USD_IDR = 16000
        predicted_price = raw_usd_price * KURS_USD_IDR
        
        print("\n===========================================")
        print(f"💰 ESTIMASI HARGA PASAR: Rp {predicted_price:,.0f}")
        print("===========================================\n")

if __name__ == "__main__":
    main()