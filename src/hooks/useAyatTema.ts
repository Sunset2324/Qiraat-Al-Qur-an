import { useCallback, useEffect, useState } from "react";
import { getTeksSurah, AyatTeks, SurahTeks } from "../services/quranService";

// Dedupe request dalam satu sesi: beberapa tema dari surah yang sama
// memakai satu promise yang sama.
const memo = new Map<number, Promise<SurahTeks>>();

const ambilSurah = (nomor: number) => {
  let p = memo.get(nomor);
  if (!p) {
    p = getTeksSurah(nomor).catch((e) => {
      memo.delete(nomor); // jangan simpan kegagalan
      throw e;
    });
    memo.set(nomor, p);
  }
  return p;
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; ayat: AyatTeks; surah: SurahTeks };

/** Ambil teks satu ayat (dari cache lokal dulu, lalu API) untuk sebuah referensi surah:ayat. */
export const useAyatTema = (surah: number | null, ayat: number | null) => {
  const [state, setState] = useState<State>({ status: "loading" });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!surah || !ayat) {
      setState({ status: "error", message: "Referensi ayat tidak valid." });
      return;
    }
    let batal = false;
    setState({ status: "loading" });
    ambilSurah(surah)
      .then((s) => {
        if (batal) return;
        const a = s.ayat.find((x) => Number(x.nomor) === ayat);
        if (!a) {
          setState({
            status: "error",
            message: `Ayat ${ayat} tidak ditemukan di surah ${s.namaLatin ?? surah}.`,
          });
        } else {
          setState({ status: "ready", ayat: a, surah: s });
        }
      })
      .catch((e: any) => {
        if (batal) return;
        setState({
          status: "error",
          message: e?.message || "Gagal memuat ayat. Periksa koneksi internet.",
        });
      });
    return () => {
      batal = true;
    };
  }, [surah, ayat, retryKey]);

  const retry = useCallback(() => setRetryKey((k) => k + 1), []);
  return { ...state, retry };
};