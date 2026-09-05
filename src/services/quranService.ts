import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Ambil daftar semua surah dari Backend
 * Endpoint: GET /surat
 */
export const getDaftarSurah = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/surat`);
    
    const surahList = response.data.data;
    
    return surahList.map((item: any) => ({
      nomor: item.nomor,
      namaLatin: item.namaLatin,
      namaArab: item.nama,
      arti: item.arti,
      jumlahAyat: item.jumlahAyat,
      tempatTurun: item.tempatTurun || 'Mekah',
    }));
  } catch (error) {
    console.error('Error fetching surah list:', error);
    throw error;
  }
};

/**
 * Ambil detail surat beserta ayat-ayatnya dari Backend
 * Endpoint: GET /surat/:nomor?qari=05
 */
export const getDetailSurah = async (nomor: number, qariId: string = '05') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/surat/${nomor}?qari=${qariId}`);
    
    const backendData = response.data.data;
    const info = backendData.info;
    const ayatList = backendData.ayat;

    return {
      nomor: info.nomor,
      namaArab: info.nama,
      namaLatin: info.namaLatin,
      arti: info.arti,
      jumlahAyat: info.jumlahAyat,
      tempatTurun: 'Mekah', 
      audioFull: backendData.audioFull,
      ayat: ayatList.map((ayat: any) => ({
        nomor: ayat.nomor,
        teksArab: ayat.teksArab,
        teksLatin: ayat.teksLatin,
        artiIndonesia: ayat.teksIndonesia,
        audio: ayat.audio,
      })),
    };
  } catch (error) {
    console.error(`Error fetching surah ${nomor}:`, error);
    throw error;
  }
};

// ==========================================
// TAMBAHKAN BAGIAN INI UNTUK DOA & DZIKIR
// ==========================================

/**
 * Ambil daftar doa dan dzikir dari Backend
 * Endpoint: GET /doa (dengan opsional query ?grup=... atau ?tag=...)
 */
export const getDaftarDoa = async (grup?: string, tag?: string) => {
  try {
    // Bangun URL dengan query parameter jika ada
    let url = `${API_BASE_URL}/doa`;
    const params = new URLSearchParams();
    
    if (grup) params.append('grup', grup);
    if (tag) params.append('tag', tag);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data.data; // Langsung kembalikan array doa
  } catch (error) {
    console.error('Error fetching doa list:', error);
    throw error;
  }
};

/**
 * Ambil detail doa spesifik berdasarkan ID
 * Endpoint: GET /doa/:id
 */
export const getDetailDoa = async (id: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doa/${id}`);
    return response.data.data; // Kembalikan object detail doa
  } catch (error) {
    console.error(`Error fetching doa detail for ID ${id}:`, error);
    throw error;
  }
};