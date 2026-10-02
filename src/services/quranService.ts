import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * 1. Ambil daftar Mushaf/Qiraat dari Backend (sumber: Quranpedia)
 * Endpoint: GET /mushafs
 */
export const getMushafList = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/mushafs`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching mushaf list:', error);
    throw error;
  }
};

/**
 * 2. Ambil daftar semua surah dari Backend
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
 * 3. Ambil detail surat beserta ayat-ayatnya dari Backend (Default Hafs)
 * Endpoint: GET /surat/:nomor?reciterId=114
 */
export const getDetailSurah = async (nomor: number, reciterId: string = '114') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/surat/${nomor}?reciterId=${reciterId}`);
    const backendData = response.data.data;
    
    const info = backendData.info || backendData; 
    
    return {
      info: {
        nomor: info.nomor,
        nama: info.nama,
        namaLatin: info.namaLatin,
        arti: info.arti,
        jumlahAyat: info.jumlahAyat,
        tempatTurun: info.tempatTurun || 'Mekah',
        mushafAktif: 'HAFS'
      },
      audioFull: backendData.audioFull,
      ayat: (backendData.ayat || []).map((ayat: any) => ({
        nomor: ayat.nomor,
        teksArab: ayat.teksArab,
        teksLatin: ayat.teksLatin,
        teksIndonesia: ayat.teksIndonesia || ayat.artiIndonesia,
        audio: ayat.audio,
      })),
    };
  } catch (error) {
    console.error(`Error fetching surah ${nomor}:`, error);
    throw error;
  }
};

/**
 * 4. Ambil Detail Surah MERGED: Teks Arab Quranpedia + Terjemahan EQuran + Audio Quranpedia
 * Endpoint: GET /surat-merged/:nomor?mushafId=...&reciterId=...
 */
export const getDetailSurahMerged = async (nomor: number, mushafId: string, reciterId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/surat-merged/${nomor}?mushafId=${mushafId}&reciterId=${reciterId}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching merged surah ${nomor}:`, error);
    throw error;
  }
};

/**
 * 5. Ambil daftar Qari/Reciter dari Backend (sumber: Quranpedia)
 * Endpoint: GET /reciters
 */
export const getReciters = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reciters`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching reciters:', error);
    throw error;
  }
};

/**
 * 6. Ambil daftar doa dan dzikir dari Backend
 * Endpoint: GET /doa (dengan opsional query ?grup=... atau ?tag=...)
 */
export const getDaftarDoa = async (grup?: string, tag?: string) => {
  try {
    let url = `${API_BASE_URL}/doa`;
    const params = new URLSearchParams();
    
    if (grup) params.append('grup', grup);
    if (tag) params.append('tag', tag);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching doa list:', error);
    throw error;
  }
};

/**
 * 7. Ambil detail doa spesifik berdasarkan ID
 * Endpoint: GET /doa/:id
 */
export const getDetailDoa = async (id: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doa/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching doa detail for ID ${id}:`, error);
    throw error;
  }
};