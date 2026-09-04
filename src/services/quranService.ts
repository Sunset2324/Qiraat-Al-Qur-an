import axios from 'axios';
import { API_BASE_URL } from '../config';

// Buat axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDaftarSurah = async () => {
  try {
    const response = await api.get('/surat');
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Gagal mengambil data dari backend');
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Backend tidak merespons.');
    }
    if (error.message.includes('Network Error')) {
      throw new Error('Gagal terhubung ke backend. Pastikan server Node.js sedang berjalan dan URL benar.');
    }
    
    console.error('Axios Error:', error.message);
    throw new Error('Terjadi kesalahan saat mengambil data.');
  }
};

export const getDetailSurah = async (nomor: number, qariId: string = '05') => {
  try {
    const response = await api.get(`/surat/${nomor}`, {
      params: { qari: qariId }
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Gagal mengambil detail surah');
  } catch (error: any) {
    console.error('Axios Error:', error.message);
    throw new Error('Gagal memuat detail surah.');
  }
};