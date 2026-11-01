import axios from "axios";
import { API_BASE_URL } from "../config";
import { cachedRequest, MINUTE } from "../utils/apiCache";
import { assertSensitiveAllowed, installGuard } from "../security/guard";

export interface Iklan {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  tema: string; // judul tema Thibbun Nabawi
  surah: number;
  ayat: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  productUrl: string;
  /** ISO; setelah waktu ini iklan tidak ditampilkan (server juga menyaring). */
  expiresAt?: string | null;
}

const http = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });
installGuard(http);

/** Hanya https yang boleh dibuka/ditampilkan, apa pun isi respons server. */
const httpsOnly = (u: unknown) => typeof u === "string" && /^https:\/\//i.test(u);

/**
 * Daftar iklan aktif Jurnal Kesehatan. Cache 30 menit; kalau offline, pakai cache lama
 * supaya layar tidak kosong.
 * Endpoint: GET /ads
 */
const belumKedaluwarsa = (a: Iklan) => !a.expiresAt || Date.parse(a.expiresAt) > Date.now();

export const getIklan = async (force = false): Promise<Iklan[]> => {
  const key = "iklan:list";
  const ambil = async () => {
    await assertSensitiveAllowed(); // iklan dimatikan di mode terbatas
    const res = await http.get("/ads");
    const list: Iklan[] = Array.isArray(res.data?.data) ? res.data.data : [];
    return list.filter(
      (a) => a && a.id && a.title && a.surah > 0 && a.ayat > 0 && httpsOnly(a.imageUrl) && httpsOnly(a.productUrl)
    );
  };
  // Disaring lagi di sini: cache lokal/offline bisa memuat iklan yang sudah lewat masa tayangnya.
  if (force) return (await ambil()).filter(belumKedaluwarsa);
  return cachedRequest<Iklan[]>(key, ambil, { ttlMs: 30 * MINUTE, group: "iklan", maxEntries: 1 })
    .then((l) => l.filter(belumKedaluwarsa))
    .catch(() => {
      throw new Error("ads_unavailable");
    });
};
