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
  if (force) return ambil();
  return cachedRequest<Iklan[]>(key, ambil, { ttlMs: 30 * MINUTE, group: "iklan", maxEntries: 1 }).catch(() => {
    throw new Error("ads_unavailable");
  });
};
