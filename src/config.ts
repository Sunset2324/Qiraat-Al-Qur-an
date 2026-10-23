// Ganti URL sesuai dengan cara testing Anda:
// Android Emulator: http://10.0.2.2:3000/api
// HP Fisik (ganti dengan IP laptop): http://192.168.x.x:3000/api
// iOS Simulator: http://localhost:3000/api

export const API_BASE_URL = "https://api.alqiraat.app/api";

// 2. Jika pakai iOS Simulator di Mac:
// export const API_BASE_URL = 'http://localhost:3000/api';

// 3. Jika pakai HP Asli (Expo Go) & Laptop di Wi-Fi yang sama:
// Ganti '192.168.x.x' dengan IPv4 Address laptop Anda (cek via 'ipconfig' di PowerShell)
// export const API_BASE_URL = 'http://192.168.1.15:3000/api';
// Gambar sampul untuk notifikasi media (disajikan backend, PNG 512x512).
export const NOTIF_ARTWORK_URL = `${API_BASE_URL}/notif-art.png`;

// Tautan di footer Pengaturan (Hubungi Kami & Website)
export const WEBSITE_URL = "https://alqiraat.app";
export const CONTACT_EMAIL = "support@qiraat.app"; // ganti kalau alamat email resminya berbeda
