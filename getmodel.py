import pandas as pd
import numpy as np
import os
import pickle
from sklearn.tree import DecisionTreeRegressor
from sklearn.model_selection import train_test_split

def load_data():
    """Memuat dataset dari folder dataset/kc_house_data.csv"""
    try:
        file_path = os.path.join('dataset', 'kc_house_data.csv')
        data = pd.read_csv(file_path)
        print("✅ Dataset berhasil dimuat.")
        return data
    except FileNotFoundError:
        print(f"❌ File tidak ditemukan di path: {file_path}")
        return None

def train_model(data):
    """Melatih Model Decision Tree Regressor untuk Prediksi Harga Rumah"""
    # Fitur Input (Spesifikasi Rumah)
    features = ['sqft_living', 'grade', 'bedrooms', 'bathrooms', 'floors', 'yr_built']
    X = data[features]
    y = data['price']
    
    # Bagi data 80% training & 20% testing
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Inisialisasi Model Decision Tree Regressor (Kedalaman max 12 agar tidak overfitting)
    model = DecisionTreeRegressor(max_depth=12, random_state=42)
    model.fit(X_train, y_train)
    return model

def main():
    data = load_data()
    if data is not None:
        model = train_model(data)
        print("✅ Model Decision Tree Regressor berhasil dilatih.")
        
        # Buat folder model jika belum ada
        if not os.path.exists('model'):
            os.makedirs('model')
            
        file_path = os.path.join('model', 'model_DT.pkl')
        try:
            with open(file_path, 'wb') as file:
                pickle.dump(model, file)
            print("💾 Model berhasil disimpan sebagai 'model/model_DT.pkl'.")
        except Exception as e:
            print(f"❌ Terjadi kesalahan saat menyimpan model: {e}")

if __name__ == "__main__":
    main()